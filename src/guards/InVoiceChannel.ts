import { CommandInteraction, MessageEmbed } from "discord.js";
import { GuardFunction } from "discordx";
import { replyOrFollowUp } from "../util/replyOrFollowUp";

export const InVoiceChannel: GuardFunction<CommandInteraction> = (
  interaction,
  _client,
  next
) => {
  const failEmbed = new MessageEmbed({
    description:
      "You must be in a voice channel to use this command. :pouting_cat:",
  });

  if (!interaction.inCachedGuild()) {
    return replyOrFollowUp(interaction, { embeds: [failEmbed] });
  }

  const member = interaction.member;
  if (!member.voice.channel) {
    return replyOrFollowUp(interaction, { embeds: [failEmbed] });
  }

  return next();
};
