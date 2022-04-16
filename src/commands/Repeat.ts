import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashChoice, SlashOption } from "discordx";
import { capitalize } from "lodash";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Repeat {
  constructor(private player: Player) {}

  @Slash("repeat")
  @Description("Change or display the repeat mode.")
  @Guard(InVoiceChannel)
  private async repeat(
    @SlashChoice({ name: "None", value: "none" })
    @SlashChoice({ name: "Track", value: "track" })
    @SlashChoice({ name: "Queue", value: "queue" })
    @SlashOption("mode", {
      type: "STRING",
      description:
        "Repeat mode to set to. Leave blank to display the current repeat mode.",
      required: false,
    })
    mode: "none" | "track" | "queue" | undefined,
    interaction: VoiceCommandInteraction
  ) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    if (!mode) {
      responseEmbed.setDescription(
        `Repeat mode is currently set to **${capitalize(
          queue.repeatMode
        )}**. :smirk_cat:`
      );
    } else {
      responseEmbed.setDescription(
        `Repeat mode is now set to **${capitalize(mode)}**. :smirk_cat:`
      );
      queue.setRepeatMode(mode);
    }

    interaction.reply({ embeds: [responseEmbed] });
  }
}
