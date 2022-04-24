import { CommandInteraction } from "discord.js";
import { GuardFunction } from "discordx";

export const Defer: GuardFunction<CommandInteraction> = async (
  interaction,
  _client,
  next
) => {
  await interaction.deferReply();
  await next();
};
