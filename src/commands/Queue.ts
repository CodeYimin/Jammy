import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
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
    const responseEmbed = new MessageEmbed({
      title: "Current Queue",
      description: `${queue.length} tracks`,
      fields: queue.tracks.map((track, index) => {
        const isPlaying = index === queue.currentTrackIndex;

        const durationPlayed = isPlaying
          ? Math.round(queue.trackPlaybackDuration / 1000)
          : undefined;
        const durationPlayedStr = durationPlayed
          ? secondsToFormattedString(durationPlayed)
          : "";

        const totalDuration = track.durationInSec;
        const totalDurationStr = secondsToFormattedString(totalDuration);

        return {
          name: `${isPlaying ? ":arrow_right:  " : ""}${index + 1}. ${
            track.title
          }`,
          value: `${track.channel} - ${durationPlayedStr} ${
            isPlaying ? "/" : ""
          } ${totalDurationStr}`,
        };
      }),
    });

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
