import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Resume {
  constructor(private player: Player) {}

  @Slash("resume")
  @Description("Resume the paused music.")
  @Guard(InVoiceChannel)
  private async resume(interaction: VoiceCommandInteraction) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    if (queue.isPaused) {
      queue.resume();
      responseEmbed.setDescription(`Resume the music. :smirk_cat:`);
    } else if (queue.isPlaying) {
      responseEmbed.setDescription(
        `The music is already playing... :thinking:`
      );
    } else {
      responseEmbed.setDescription(`There is no music playing... :thinking:`);
    }

    interaction.reply({ embeds: [responseEmbed] });
  }
}
