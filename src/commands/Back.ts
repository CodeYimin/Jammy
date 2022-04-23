import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { ErrorMessages } from "../core/types";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Back {
  constructor(private player: Player) {}

  @Slash("back")
  @Description("Skip to the previous track.")
  @Guard(InVoiceChannel)
  private async back(
    @SlashOption("increment", {
      type: "INTEGER",
      description: "The number of tracks to go back. Defaults to 1.",
      required: false,
    })
    increment: number | undefined,
    interaction: VoiceCommandInteraction
  ) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();
    const defaultIncrement = 1;

    const newTrackIndex =
      queue.currentTrackIndex === undefined
        ? undefined
        : queue.currentTrackIndex - (increment || defaultIncrement);

    if (newTrackIndex === undefined) {
      responseEmbed.setDescription(ErrorMessages.NotPlaying);
    } else if (newTrackIndex < 0 || newTrackIndex >= queue.tracks.length) {
      responseEmbed.setDescription(ErrorMessages.SkipOutOfBounds);
    } else {
      responseEmbed.setDescription(
        increment
          ? `Skipped **${increment}** tracks back. :smirk_cat:`
          : `Skipped to the previous track. :smirk_cat:`
      );

      await queue.play(newTrackIndex);
    }

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
