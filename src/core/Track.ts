import { AudioResource, createAudioResource } from "@discordjs/voice";
import play, {
  InfoData,
  playlist_info,
  search,
  video_basic_info,
  YouTubeVideo,
  yt_validate,
} from "play-dl";

export interface TrackData {
  url: string;
  title: string;
  channel: string;
  durationInSec: number;
  thumbnail: string;
  views?: number;
  likes?: number;
}

export class Track implements TrackData {
  public readonly url: string;
  public readonly title: string;
  public readonly channel: string;
  public readonly durationInSec: number;
  public readonly thumbnail: string;
  public readonly views?: number;
  public readonly likes?: number;

  constructor({
    url,
    title,
    channel,
    durationInSec,
    thumbnail,
    views,
    likes,
  }: TrackData) {
    this.url = url;
    this.title = title;
    this.channel = channel;
    this.durationInSec = durationInSec;
    this.thumbnail = thumbnail;
    this.views = views;
    this.likes = likes;
  }

  public async createAudioResource(): Promise<AudioResource<Track>> {
    const stream = await play.stream(this.url);
    const resource = createAudioResource(stream.stream, {
      metadata: this,
      inlineVolume: true,
      inputType: stream.type,
    });
    return resource;
  }

  public static fromVideoDetails(details: YouTubeVideo) {
    return new Track({
      url: details.url,
      title: details.title || details.url,
      channel: details.channel?.name || "Unknown",
      thumbnail: details.thumbnails[0].url,
      durationInSec: details.durationInSec,
      views: details.views || undefined,
      likes: details.likes || undefined,
    });
  }

  public static fromVideoInfo(info: InfoData) {
    return this.fromVideoDetails(info.video_details);
  }

  /**
   *
   * @param query Can be playlist url, video url, or video search term
   * @returns
   */
  public static async fromQuery(query: string): Promise<Track[]> {
    const queryType = yt_validate(query);

    if (!queryType) {
      throw new Error(`Invalid query`);
    }

    if (queryType === "playlist") {
      const playlist = await playlist_info(query, { incomplete: true });
      const videos = await playlist.all_videos();

      return videos.map((video) => Track.fromVideoDetails(video));
    } else if (queryType === "video") {
      const videoInfo = await video_basic_info(query);

      return [this.fromVideoInfo(videoInfo)];
    } else {
      const searchResults = await search(query, {
        source: {
          youtube: "video",
        },
        limit: 1,
      });
      const videoDetails = searchResults[0];

      if (!videoDetails) {
        return [];
      }

      return [this.fromVideoDetails(videoDetails)];
    }
  }
}
