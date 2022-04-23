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
export class Jump {
  constructor(private player: Player) {}

  @Slash("jump")
  @Slash("go")
  @Description("Jump to a track number.")
  @Guard(InVoiceChannel)
  private async jump(
    @SlashOption("track_number", {
      description: "The track number to skip to.",
      type: "INTEGER",
    })
    trackNumber: number,
    interaction: VoiceCommandInteraction
  ) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    const trackIndex = trackNumber - 1;

    if (trackIndex < 0 || trackIndex >= queue.tracks.length) {
      responseEmbed.setDescription(ErrorMessages.TrackNotExist);
    } else {
      responseEmbed.setDescription(
        `Jumped to track **${trackNumber}**. :smirk_cat:`
      );

      await queue.play(trackIndex);
    }

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
