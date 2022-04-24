import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Guild, StageChannel, VoiceChannel } from "discord.js";
import _ from "lodash";
import { Player } from "./";
import { Track } from "./Track";
import { ErrorMessages } from "./types";

export type RepeatMode = "none" | "track" | "queue";

/**
 * Guild queue
 */
export class Queue<T extends Player = Player> {
  public readonly audioPlayer = createAudioPlayer();
  private _tracks: Track[] = [];
  private _voiceConnection: VoiceConnection | undefined;
  private _volume = 100;
  private _currentTrackIndex: number | undefined;
  private _repeatMode: RepeatMode = "none";

  private queueLock = false;

  public get tracks(): Track[] {
    return this._tracks;
  }

  public get length(): number {
    return this._tracks.length;
  }

  public get currentTrackIndex(): number | undefined {
    return this._currentTrackIndex;
  }

  public get currentTrack(): Track | undefined {
    if (this._currentTrackIndex === undefined) {
      return undefined;
    }

    return this._tracks[this._currentTrackIndex];
  }

  public get voiceConnection(): VoiceConnection | undefined {
    return this._voiceConnection;
  }

  public get voiceChannelId(): string | undefined {
    return this._voiceConnection?.joinConfig.channelId ?? undefined;
  }

  public get voiceGroup(): string | undefined {
    return this._voiceConnection?.joinConfig.group;
  }

  public get voiceGuildId(): string | undefined {
    return this._voiceConnection?.joinConfig.guildId;
  }

  public get repeatMode(): RepeatMode {
    return this._repeatMode;
  }

  public get isReady(): boolean {
    return this._voiceConnection?.state.status === VoiceConnectionStatus.Ready;
  }

  public get isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
  }

  public get isIdle(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Idle;
  }

  public get isPaused(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
  }

  public get currentAudioResource(): AudioResource<Track> | undefined {
    if (this.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      return undefined;
    }

    const track = this.audioPlayer.state.resource as AudioResource<Track>;

    return track;
  }

  public get volume(): number {
    return this._volume;
  }

  public get trackPlaybackDuration(): number {
    if (!this.currentAudioResource) {
      return 0;
    }
    return this.currentAudioResource.playbackDuration;
  }

  constructor(public player: T, public guild: Guild) {
    this.audioPlayer.on<"stateChange">(
      "stateChange",
      async (oldState, newState) => {
        if (
          oldState.status !== AudioPlayerStatus.Idle &&
          newState.status === AudioPlayerStatus.Idle
        ) {
          // Non idle -> idle: Track finished playing

          await this.processQueue();
        } else if (newState.status === AudioPlayerStatus.Playing) {
          // Any -> Playing: A Track started playing

          newState.resource.volume?.setVolumeLogarithmic(this._volume / 100);
        }
      }
    );

    this.audioPlayer.on("error", (error) => {
      this.player.emit("onError", this, error);
    });
  }

  /**
   * Process queue
   * @returns
   */
  private async processQueue(): Promise<void> {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      this._currentTrackIndex === undefined ||
      !this.currentTrack
    ) {
      return;
    }

    // Lock the queue to guarantee safe access
    this.queueLock = true;

    const isLastTrack = this._currentTrackIndex + 1 >= this._tracks.length;

    if (this.repeatMode === "track") {
      // Repeat current track
      await this.play(this._currentTrackIndex);
    } else if (!isLastTrack) {
      // Play next track
      await this.play(this._currentTrackIndex + 1);
    } else if (this._repeatMode === "queue") {
      // Repeat queue
      this._currentTrackIndex = 0;
      await this.play(this._currentTrackIndex);
    } else {
      // Queue finish playing
      this._currentTrackIndex = undefined;
    }

    this.queueLock = false;
  }

  /**
   * Join voice channel
   *
   * @param channel
   */
  public async join(
    channel: VoiceChannel | StageChannel,
    options?: { force?: boolean; group?: string }
  ): Promise<void> {
    if (this._voiceConnection && !options?.force) {
      return;
    }

    if (this._voiceConnection) {
      if (
        this._voiceConnection.state.status !== VoiceConnectionStatus.Destroyed
      ) {
        this._voiceConnection.destroy();
      }
      this._voiceConnection = undefined;
    }

    const voiceConnection = joinVoiceChannel({
      adapterCreator: channel.guild
        .voiceAdapterCreator as DiscordGatewayAdapterCreator,
      channelId: channel.id,
      group: options?.group,
      guildId: channel.guild.id,
    });

    voiceConnection.subscribe(this.audioPlayer);

    voiceConnection.on<"stateChange">(
      "stateChange",
      async (_oldState, newState) => {
        if (newState.status === VoiceConnectionStatus.Disconnected) {
          if (
            newState.reason ===
              VoiceConnectionDisconnectReason.WebSocketClose &&
            newState.closeCode === 4014
          ) {
            try {
              // Probably moving channels
              await entersState(
                voiceConnection,
                VoiceConnectionStatus.Connecting,
                10
              );
            } catch {
              // Probably kicked
              voiceConnection.rejoin();
            }
          }
        }
      }
    );

    try {
      await entersState(voiceConnection, VoiceConnectionStatus.Ready, 2e4);
    } catch (err) {
      throw Error(ErrorMessages.VoiceConnection);
    }

    this._voiceConnection = voiceConnection;
  }

  /**
   * Leave voice channel
   */
  public leave(): void {
    this._tracks = [];
    this.queueLock = false;

    this.audioPlayer.stop(true);
    if (this._voiceConnection) {
      if (
        this._voiceConnection.state.status !== VoiceConnectionStatus.Destroyed
      ) {
        this._voiceConnection.destroy();
      }
      this._voiceConnection = undefined;
    }

    this.player.queues.delete(this.guild.id);
  }

  public async play(trackIndex: number): Promise<void> {
    const track = this._tracks[trackIndex];
    if (!track) {
      throw new Error("Index out of bounds");
    }

    this._currentTrackIndex = trackIndex;

    const audioResource = await track.createAudioResource();
    this.audioPlayer.play(audioResource);
  }

  /**
   * Set volume
   */
  public setVolume(volume: number): void {
    if (volume < 0 || volume >= Infinity) {
      throw new Error("Invalid volume");
    }

    this._volume = volume;

    if (this.currentAudioResource) {
      this.currentAudioResource.volume?.setVolumeLogarithmic(volume / 100);
    }
  }

  /**
   * Seek current music
   */
  // public seek(time: number): boolean {
  // if (!this.currentTrack || !this.isPlaying) {
  //   return false;
  // }

  // }

  /**
   * Pause audio playback
   */
  public pause(): boolean {
    if (!this.isPlaying || !this.currentTrack) {
      return false;
    }

    this.audioPlayer.pause();
    return true;
  }

  /**
   * Resume audio playback
   */
  public resume(): boolean {
    if (!this.isPaused || !this.currentTrack) {
      return false;
    }

    this.audioPlayer.unpause();

    return true;
  }

  public shuffle(): void {
    this._tracks = _.shuffle(this._tracks);
  }

  public setRepeatMode(repeatMode: RepeatMode): void {
    this._repeatMode = repeatMode;
  }

  public async addTracks(tracks: Track[], top?: boolean): Promise<void> {
    if (top) {
      this._tracks.unshift(...tracks);
    } else {
      this._tracks.push(...tracks);
    }

    if (this.length && this.isIdle) {
      await this.play(this.length - tracks.length);
    }
  }

  public removeTrack(index: number): void {
    if (index >= this.length) {
      throw new Error("Index out of bounds");
    }

    this._tracks.splice(index, 1);

    const isCurrentTrack = this._currentTrackIndex === index;
    if (!isCurrentTrack) {
      return;
    }

    const isLastTrack = index === this.length - 1;
    if (isLastTrack) {
      this._currentTrackIndex!--;
    }

    this.audioPlayer.stop();
    this._tracks.splice(index, 1);
  }
}
