import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { Player } from "../core";
import { ErrorMessages } from "../core/types";
import { Deferred, VoiceCommandInteraction } from "../core/types/Interactions";
import { Defer } from "../guards/Defer";
import { InVoiceChannel } from "../guards/InVoiceChannel";
import { replyOrFollowUp } from "../util/replyOrFollowUp";

@Discord()
@injectable()
export class Back {
  constructor(private player: Player) {}

  @Slash("back")
  @Description("Skip to the previous track.")
  @Guard(InVoiceChannel, Defer)
  private async back(
    @SlashOption("increment", {
      type: "INTEGER",
      description: "The number of tracks to go back. Defaults to 1.",
      required: false,
    })
    increment: number | undefined,
    interaction: Deferred<VoiceCommandInteraction>
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

    await replyOrFollowUp(interaction, { embeds: [responseEmbed] });
  }
}
