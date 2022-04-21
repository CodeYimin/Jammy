import { importx } from "@discordx/importer";
import { Client, DIService } from "discordx";
import "dotenv/config";
import "reflect-metadata";
import { container } from "tsyringe";
import { Player } from "./core";

async function start() {
  DIService.container = container;
  container.registerSingleton(Player);

  const client = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"],
    botGuilds: [
      "393563835019165716",
      "756250551863214110",
      "965343636537634838",
    ],
    silent: false,
  });

  client.once("ready", async () => {
    await client.initApplicationCommands();
    await client.initApplicationPermissions();

    client.user?.setActivity({ name: "music", type: "LISTENING" });

    console.log(`Logged in as ${client.user?.tag}!`);
  });

  client.on("interactionCreate", (interaction) => {
    client.executeInteraction(interaction);
  });

  await importx(`${__dirname}/commands/**/*.ts`);

  if (!process.env.BOT_TOKEN) {
    throw Error("BOT_TOKEN environment variable is not set");
  }
  await client.login(process.env.BOT_TOKEN);
}

start();
