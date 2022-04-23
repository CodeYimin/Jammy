import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Pause {
  constructor(private player: Player) {}

  @Slash("pause")
  @Slash("stop")
  @Description("Pause the currently playing track.")
  @Guard(InVoiceChannel)
  private async pause(interaction: VoiceCommandInteraction) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    if (queue.isPlaying) {
      queue.pause();
      responseEmbed.setDescription(`Paused the music. :smirk_cat:`);
    } else if (queue.isPaused) {
      responseEmbed.setDescription(`The music is already paused... :thinking:`);
    } else {
      responseEmbed.setDescription(`There is no music playing... :thinking:`);
    }

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
