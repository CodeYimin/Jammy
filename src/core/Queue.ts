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

/**
 * Wait promise
 *
 * @param time
 *
 * @returns
 */
function wait(time: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

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
  private readyLock = false;

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
    this.audioPlayer.on<"stateChange">("stateChange", (oldState, newState) => {
      if (
        oldState.status !== AudioPlayerStatus.Idle &&
        newState.status === AudioPlayerStatus.Idle
      ) {
        // Non idle -> idle: Track finished playing

        // Emit track end event
        const track = oldState.resource.metadata as Track;
        this.player.emit("onTrackFinish", this, track);

        this.processQueue();
      } else if (newState.status === AudioPlayerStatus.Playing) {
        // Any -> Playing: A Track started playing

        newState.resource.volume?.setVolumeLogarithmic(this._volume / 100);

        // Emit track start event
        const track = newState.resource.metadata as Track;
        this.player.emit("onTrackStart", this, track);
      }
    });

    this.audioPlayer.on("error", (error) => {
      this.player.emit("onError", this, error);
    });
  }

  /**
   * Process queue
   * @returns
   */
  private processQueue(): void {
    // If the queue is locked (already being processed), is empty, or the audio player is already playing something, return
    if (
      this.queueLock ||
      this.audioPlayer.state.status !== AudioPlayerStatus.Idle ||
      this._currentTrackIndex === undefined
    ) {
      return;
    }

    // Lock the queue to guarantee safe access
    this.queueLock = true;

    const isLastTrack = this._currentTrackIndex + 1 >= this._tracks.length;

    if (this.repeatMode === "track") {
      // Repeat current track
      this.player.emit("onTrackRepeat", this, this.currentTrack!);
      this.play(this._currentTrackIndex);
    } else if (!isLastTrack) {
      // Play next track
      this.play(this._currentTrackIndex + 1);
    } else if (this._repeatMode === "queue") {
      // Repeat queue
      this.player.emit("onQueueRepeat", this);
      this._currentTrackIndex = 0;
      this.play(this._currentTrackIndex);
    } else {
      // Queue finish playing
      this._currentTrackIndex = undefined;
      this.player.emit("onQueueFinish", this);
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
    this.player.emit("onVoiceJoin", this, channel);
  }

  /**
   * Leave voice channel
   */
  public leave(): void {
    this._tracks = [];
    this.queueLock = false;
    this.readyLock = false;

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
    this.player.emit("onVoiceLeave", this);
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
    this.player.emit("onVolumeUpdate", this, volume);

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
    if (!this.isPlaying) {
      return false;
    }

    this.audioPlayer.pause();
    this.player.emit("onTrackPause", this, this.currentTrack!);
    return true;
  }

  /**
   * Resume audio playback
   */
  public resume(): boolean {
    if (!this.isPaused) {
      return false;
    }

    this.audioPlayer.unpause();
    this.player.emit("onTrackResume", this, this.currentTrack!);

    return true;
  }

  public shuffle(): void {
    this._tracks = _.shuffle(this._tracks);
    this.player.emit("onQueueShuffle", this, this._tracks);
  }

  public setRepeatMode(repeatMode: RepeatMode): void {
    this._repeatMode = repeatMode;
    this.player.emit("onRepeatModeUpdate", this, repeatMode);
  }

  public addTracks(tracks: Track[], top?: boolean): void {
    if (top) {
      this._tracks.unshift(...tracks);
    } else {
      this._tracks.push(...tracks);
    }

    if (this.length && this.isIdle) {
      this.play(this.length - tracks.length);
    }

    this.player.emit("onTracksAdd", this, tracks);
  }

  public removeTrack(index: number): void {
    if (index >= this.length) {
      throw new Error("Index out of bounds");
    }

    const removedTrack = this._tracks.splice(index, 1)[0];
    this.player.emit("onTrackRemove", this, removedTrack);

    this.audioPlayer.stop();
  }
}
