import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { Player, Track } from "../core";
import { VoiceCommandInteraction } from "../core/types/Interactions";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Play {
  constructor(private player: Player) {}

  @Slash("play")
  @Slash("add")
  @Slash("enqueue")
  @Description("Play a song in your voice channel.")
  @Guard(InVoiceChannel)
  private async play(
    @SlashOption("query", { description: "A youtube search term or link" })
    query: string,
    interaction: VoiceCommandInteraction
  ) {
    const queue = this.player.queue(interaction.guild);
    const foundTracks = await Track.from(query);
    const responseEmbed = new MessageEmbed();

    const voiceChannel = interaction.member.voice.channel;

    if (!foundTracks.length) {
      responseEmbed.setDescription("No matches found :pouting_cat:");
    } else {
      if (!queue.voiceConnection) {
        await queue.join(voiceChannel);
      }

      await queue.addTracks(foundTracks);

      if (foundTracks.length === 1) {
        const track = foundTracks[0];
        responseEmbed.setDescription(`Queued [${track.title}](${track.url})`);
      } else {
        responseEmbed.setDescription(
          `Queued **${foundTracks.length}** tracks.`
        );
      }
    }

    await interaction.reply({ embeds: [responseEmbed] });
  }
}
