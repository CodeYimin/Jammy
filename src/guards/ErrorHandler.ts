import { CommandInteraction, MessageEmbed } from "discord.js";
import { GuardFunction } from "discordx";
import { ErrorMessages } from "../core/types";

export const ErrorHandler: GuardFunction<CommandInteraction> = (
  interaction,
  _client,
  next
) => {
  next().catch((error) => {
    console.error(error);
    const failEmbed = new MessageEmbed({
      description: ErrorMessages.GenericError,
    });

    interaction.reply({ embeds: [failEmbed] }).catch(() => {
      // Do nothing
    });
  });
};
