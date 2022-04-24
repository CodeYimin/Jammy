import { Description } from "@discordx/utilities";
import { MessageEmbed } from "discord.js";
import { Discord, Guard, Slash, SlashOption } from "discordx";
import { injectable } from "tsyringe";
import { Player, Track } from "../core";
import { Deferred, VoiceCommandInteraction } from "../core/types/Interactions";
import { Defer } from "../guards/Defer";
import { InVoiceChannel } from "../guards/InVoiceChannel";

@Discord()
@injectable()
export class Play {
  constructor(private player: Player) {}

  @Slash("play")
  @Slash("add")
  @Slash("enqueue")
  @Description("Play a song in your voice channel.")
  @Guard(InVoiceChannel, Defer)
  private async play(
    @SlashOption("query", { description: "A youtube search term or link" })
    query: string,
    interaction: Deferred<VoiceCommandInteraction>
  ) {
    const queue = this.player.queue(interaction.guild);
    const foundTracks = await Track.fromQuery(query);
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
        responseEmbed
          .setDescription(`Queued [${track.title}](${track.url})`)
          .setFooter({ text: `Track number: ${queue.length}` });
      } else {
        responseEmbed
          .setDescription(`Queued **${foundTracks.length}** tracks.`)
          .setFooter({
            text: `Track numbers: ${queue.length - foundTracks.length} - ${
              queue.length
            }`,
          });
      }
    }

    await interaction.editReply({ embeds: [responseEmbed] });
  }
}
