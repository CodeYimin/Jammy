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
export class Remove {
  constructor(private player: Player) {}

  @Slash("remove")
  @Description("Remove a track number from the queue.")
  @Guard(InVoiceChannel)
  private async remove(
    @SlashOption("track_number", {
      description: "The track number to remove.",
      type: "INTEGER",
    })
    trackNumber: number,
    interaction: VoiceCommandInteraction
  ) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    const trackIndex = trackNumber - 1;

    if (trackIndex < 0 && trackIndex >= queue.length) {
      responseEmbed.setDescription(ErrorMessages.TrackNotExist);
    } else {
      responseEmbed.setDescription(
        `Removed track **${trackNumber}**. :smirk_cat:`
      );

      queue.removeTrack(trackIndex);
    }

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
