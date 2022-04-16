import {
  BaseCommandInteraction,
  InteractionReplyOptions,
  MessageComponentInteraction,
  MessagePayload,
} from "discord.js";

export async function replyOrFollowUp(
  interaction: BaseCommandInteraction | MessageComponentInteraction,
  options: string | MessagePayload | InteractionReplyOptions
): Promise<void> {
  if (interaction.replied) {
    await interaction.followUp(options);
    return;
  }
  if (interaction.deferred) {
    await interaction.editReply(options);
    return;
  }
  await interaction.reply(options);
}
