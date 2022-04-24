import { CommandInteraction, MessageEmbed } from "discord.js";
import { GuardFunction } from "discordx";
import { replyOrFollowUp } from "../util/replyOrFollowUp";

export const InGuild: GuardFunction<CommandInteraction> = async (
  interaction,
  _client,
  next
) => {
  const failEmbed = new MessageEmbed({
    description: "You must be in a server to use this command. :pouting_cat:",
  });

  if (!interaction.inCachedGuild()) {
    await replyOrFollowUp(interaction, { embeds: [failEmbed] });
    return;
  }

  await next();
};
