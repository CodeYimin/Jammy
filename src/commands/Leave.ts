import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Leave {
  constructor(private player: Player) {}

  @Slash("leave")
  @Slash("die")
  @Slash("clear")
  @Description("Stop the music, clear the queue, and leave the voice channel.")
  @Guard(InVoiceChannel)
  private async leave(interaction: VoiceCommandInteraction) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed({
      description: "Music stopped and queue cleared. :smirk_cat:",
    });

    queue.leave();
    await interaction.reply({ embeds: [responseEmbed] });
  }
}
