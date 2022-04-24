import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { ErrorMessages } from "../core/types";
import { Deferred, VoiceCommandInteraction } from "../core/types/Interactions";
import { Defer } from "../guards/Defer";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Jump {
  constructor(private player: Player) {}

  @Slash("jump")
  @Slash("go")
  @Description("Jump to a track number.")
  @Guard(InVoiceChannel, Defer)
  private async jump(
    @SlashOption("track_number", {
      description: "The track number to skip to.",
      type: "INTEGER",
    })
    trackNumber: number,
    interaction: Deferred<VoiceCommandInteraction>
  ) {
    const queue = this.player.queue(interaction.guild);
    const responseEmbed = new MessageEmbed();

    const trackIndex = trackNumber - 1;

    if (trackIndex < 0 || trackIndex >= queue.tracks.length) {
      responseEmbed.setDescription(ErrorMessages.TrackNotExist);
    } else {
      const track = queue.tracks[trackIndex];

      responseEmbed.setDescription(
        `Jumped to [${track.title}](${track.url}). :smirk_cat:`
      );

      await queue.play(trackIndex);
    }

    await interaction.editReply({ embeds: [responseEmbed] });
  }
}
