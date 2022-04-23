import { importx } from "@discordx/importer";
import { Client, DIService } from "discordx";
import "dotenv/config";
import express from "express";
import { setToken } from "play-dl";
import "reflect-metadata";
import { container } from "tsyringe";
import { Player } from "./core";
import { ErrorHandler } from "./guards/ErrorHandler";

function startReplitKeepAliveServer(port: number) {
  const app = express();

  app.get("/", (req, res) => {
    res.sendStatus(200);
  });

  app.listen(port, () => {
    console.log(`Replit keep alive server listening on port ${port}`);
  });
}

async function start() {
  DIService.container = container;
  container.registerSingleton(Player);

  await setToken({
    youtube: {
      cookie: process.env.YOUTUBE_COOKIE || "",
    },
  });

  const client = new Client({
    intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"],
    botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
    silent: false,
    guards: [ErrorHandler],
  });

  client.once("ready", async () => {
    await client.initApplicationCommands();
    await client.initApplicationPermissions();

    client.user?.setActivity({ name: "music", type: "LISTENING" });

    console.log(`Logged in as ${client.user?.tag || ""}!`);

    const replitPort = parseInt(process.env.REPLIT_KEEPALIVE_PORT || "");
    if (replitPort) {
      startReplitKeepAliveServer(replitPort);
    }
  });

  client.on("interactionCreate", (interaction) => {
    client.executeInteraction(interaction);
  });

  await importx(`${__dirname}/commands/**/*`);

  if (!process.env.BOT_TOKEN) {
    throw Error("BOT_TOKEN environment variable is not set");
  }

  await client.login(process.env.BOT_TOKEN);
}

void start();
