import { AudioResource, createAudioResource } from "@discordjs/voice";
import play, {
  playlist_info,
  search,
  video_basic_info,
  yt_validate,
} from "play-dl";

export interface TrackData {
  url: string;
  title: string;
  durationInSec: number;
}

export class Track implements TrackData {
  public readonly url: string;
  public readonly title: string;
  public readonly durationInSec: number;

  constructor({ url, title, durationInSec: durationSec }: TrackData) {
    this.url = url;
    this.title = title;
    this.durationInSec = durationSec;
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

  /**
   *
   * @param query Can be playlist url, video url, or video search term
   * @returns
   */
  public static async from(query: string): Promise<Track[]> {
    const tracks: Track[] = [];

    const queryType = yt_validate(query);

    if (!queryType) {
      throw new Error(`Invalid query`);
    }

    if (queryType === "playlist") {
      const playlist = await playlist_info(query, { incomplete: true });
      const videos = await playlist.all_videos();

      for (const video of videos) {
        tracks.push(
          new Track({
            url: video.url,
            title: video.title || video.url,
            durationInSec: video.durationInSec,
          })
        );
      }
    } else if (queryType === "video") {
      const video = await video_basic_info(query);
      const videoDetails = video.video_details;

      tracks.push(
        new Track({
          url: videoDetails.url,
          title: videoDetails.title || videoDetails.url,
          durationInSec: videoDetails.durationInSec,
        })
      );
    } else {
      const searchResults = await search(query);
      const firstVideo = searchResults.find((video) => video.type === "video");

      if (firstVideo) {
        tracks.push(
          new Track({
            url: firstVideo.url,
            title: firstVideo.title || firstVideo.url,
            durationInSec: firstVideo.durationInSec,
          })
        );
      }
    }

    return tracks;
  }
}
