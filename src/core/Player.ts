import type { Guild, Snowflake } from "discord.js";
import { Collection } from "discord.js";
import { EventEmitter } from "node:events";
import { Queue } from "./Queue";
import type { PlayerEventArgsOf, PlayerEvents } from "./types";

/**
 * Music player
 */
export class Player extends EventEmitter {
  public queues = new Collection<Snowflake, Queue>();

  constructor() {
    super();
  }

  public on<T extends keyof PlayerEvents>(
    event: T,
    handler: PlayerEvents[T]
  ): this {
    return super.on(event, handler);
  }

  public emit<T extends keyof PlayerEvents>(
    event: T,
    ...args: PlayerEventArgsOf<T>
  ): boolean {
    return super.emit(event, ...args);
  }

  /**
   * Gets a queue by guild id or creates a new one if none exists
   * @param guild
   * @returns
   */
  public queue(guild: Guild): Queue {
    const queue = this.queues.get(guild.id) || new Queue(this, guild);

    this.queues.set(guild.id, queue);
    return queue;
  }
}
