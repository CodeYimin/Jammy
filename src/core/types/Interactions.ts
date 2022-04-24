import { CommandInteraction } from "discord.js";

export type GuildCommandInteraction = CommandInteraction<"cached">;

export type VoiceCommandInteraction = GuildCommandInteraction & {
  member: GuildCommandInteraction["member"] & {
    voice: GuildCommandInteraction["member"]["voice"] & {
      channel: NonNullable<
        GuildCommandInteraction["member"]["voice"]["channel"]
      >;
    };
  };
};

export type Deferred<T extends CommandInteraction> = T & {
  reply: never;
  deferReply: never;
};
