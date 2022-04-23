import { importx } from "@discordx/importer";
import axios from "axios";
import { Client, DIService } from "discordx";
import "dotenv/config";
import express from "express";
import { setToken } from "play-dl";
import "reflect-metadata";
import { container } from "tsyringe";
import { Player } from "./core";
import { ErrorHandler } from "./guards/ErrorHandler";

function startReplitKeepAliveServer() {
  const replitSlug = process.env.REPL_SLUG;
  const replitOwner = process.env.REPL_OWNER;
  
  if (!replitSlug || !replitOwner) {
    return;
  }

  const app = express();
  const PORT = 8080;

  app.get("/", (req, res) => {
    res.sendStatus(200);
  });

  app.listen(PORT, () => {
    console.log(`Replit keep alive server listening on port ${PORT}`);
  });

  const replitUrl = `https://${replitSlug}.${replitOwner}.repl.co`;
  const PING_INTERVAL = 1000 * 60 * 5; // 5 minutes

  setInterval(() => {
    axios.get(replitUrl).catch(() => {
      // Do nothing
    });
  }, PING_INTERVAL);
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

    startReplitKeepAliveServer();
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
