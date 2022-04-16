import type { StageChannel, VoiceChannel } from "discord.js";
import type { Queue, RepeatMode, Track } from "..";

export interface PlayerEvents {
  onVoiceJoin: (queue: Queue, channel: VoiceChannel | StageChannel) => void;
  onVoiceLeave: (queue: Queue) => void;
  onQueueFinish: (queue: Queue) => void;
  onQueueShuffle: (queue: Queue, tracks: Track[]) => void;
  onQueueRepeat: (queue: Queue) => void;
  onTrackPause: (queue: Queue, track: Track) => void;
  onTrackRepeat: (queue: Queue, track: Track) => void;
  onTrackFinish: (queue: Queue, track: Track) => void;
  onTrackRemove: (queue: Queue, track: Track) => void;
  onTrackResume: (queue: Queue, track: Track) => void;
  onTrackSeek: (queue: Queue, track: Track, time: number) => void;
  onTrackSkip: (queue: Queue, newTrack: Track) => void;
  onTrackStart: (queue: Queue, track: Track) => void;
  onTracksAdd: (queue: Queue, tracks: Track[]) => void;
  onError: (queue: Queue, error: Error) => void;
  onVolumeUpdate: (queue: Queue, newVolume: number) => void;
  onRepeatModeUpdate: (queue: Queue, newRepeatMode: RepeatMode) => void;
}

export type PlayerEventArgsOf<E extends keyof PlayerEvents> = Parameters<
  PlayerEvents[E]
>;
