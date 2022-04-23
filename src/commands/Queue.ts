import { Description } from "@discordx/utilities";
import { Discord, Guard, Slash } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { GuildCommandInteraction } from "../core/types/Interactions";
import { InGuild } from "../guards/InGuild";
import { secondsToFormattedString } from "../util/time";

@Discord()
@injectable()
export class Queue {
  constructor(private player: Player) {}

  @Slash("queue")
  @Description("Display the current queue of tracks.")
  @Guard(InGuild)
  private async queue(interaction: GuildCommandInteraction) {
    const queue = this.player.queue(interaction.guild);
    const response =
      "```nim\n" +
      (queue.tracks
        .map((track, index) => {
          const isCurrentTrackIndex: boolean =
            index === queue.currentTrackIndex;
          const titleLength: number = 40 - (index + 1).toString().length;

          let title: string;
          if (track.title.length > titleLength) {
            if (track.title[titleLength - 2] === " ") {
              title = track.title.substring(0, titleLength - 2) + "… ";
            } else {
              title = track.title.substring(0, titleLength - 1) + "…";
            }
          } else {
            title = track.title + " ".repeat(titleLength - track.title.length);
          }

          let durationRemaining: number | undefined;

          if (isCurrentTrackIndex && queue.isPlaying) {
            durationRemaining =
              track.durationInSec -
              Math.round(queue.trackPlaybackDuration / 1000);
          }

          return (
            (isCurrentTrackIndex ? "     ⬐ current track\n" : "") +
            ` ${index + 1}) ${title} ` +
            (durationRemaining
              ? `${secondsToFormattedString(durationRemaining, "colon")} left`
              : secondsToFormattedString(track.durationInSec, "colon")) +
            "\n" +
            (isCurrentTrackIndex ? "     ⬑ current track\n" : "")
          );
        })
        .join("") || "The queue is empty") +
      "```";

    await interaction.reply(response);
  }
}
