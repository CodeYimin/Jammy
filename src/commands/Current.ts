import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { ErrorMessages } from "../core/types";
import { GuildCommandInteraction } from "../core/types/Interactions";
import { InGuild } from "../guards/InGuild";
import { secondsToFormattedString } from "../util/time";

@Discord()
@injectable()
export class Current {
  constructor(private player: Player) {}

  @Slash("current")
  @Slash("playing")
  @Slash("song")
  @Description("Display information about currently playing track.")
  @Guard(InGuild)
  private async current(interaction: GuildCommandInteraction) {
    const queue = this.player.queue(interaction.guild);

    const track = queue.currentTrack;
    if (!track) {
      const responseEmbed = new MessageEmbed({
        description: ErrorMessages.NotPlaying,
      });
      return interaction.reply({ embeds: [responseEmbed] });
    }

    const durationPlayed = Math.round(queue.trackPlaybackDuration / 1000);
    const durationPlayedStr = secondsToFormattedString(
      durationPlayed,
      "abbrevation"
    );

    const totalDuration = track.durationInSec;
    const totalDurationStr = secondsToFormattedString(
      totalDuration,
      "abbrevation"
    );

    const loadingBarSize = 20;
    const loadingBarCursorIndex = Math.max(
      Math.round((durationPlayed / totalDuration) * loadingBarSize) - 1,
      0
    );
    const loadingBar =
      "▬".repeat(loadingBarCursorIndex) +
      "🔵" +
      "▬".repeat(loadingBarSize - loadingBarCursorIndex - 1);

    const responseEmbed = new MessageEmbed({
      description: `[${track.title}](${track.url})`,
      footer: {
        text: `${loadingBar} ${durationPlayedStr} / ${totalDurationStr}`,
      },
    });

    interaction.reply({ embeds: [responseEmbed] });
  }
}
