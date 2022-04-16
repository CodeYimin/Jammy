import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Volume {
  constructor(private player: Player) {}

  @Slash("volume")
  @Description("Change or display the volume.")
  @Guard(InVoiceChannel)
  private async volume(
    @SlashOption("value", {
      type: "NUMBER",
      description:
        "The volume to set to. Leave blank to display the current volume.",
      required: false,
    })
    value: number | undefined,
    interaction: VoiceCommandInteraction
  ) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    if (value === undefined) {
      responseEmbed.setDescription(
        `Volume is currently set to **${queue.volume}**%. :smirk_cat:`
      );
    } else if (value < 0) {
      responseEmbed.setDescription(
        "Volume cannot be set to a negative value... :thinking:"
      );
    } else {
      responseEmbed.setDescription(
        `Volume is now set to **${value}**%. :smirk_cat:`
      );
      queue.setVolume(value);
    }

    interaction.reply({ embeds: [responseEmbed] });
  }
}
