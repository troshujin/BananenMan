import { Client, GatewayIntentBits, Partials } from "discord.js";
import { readdirSync } from "node:fs";
import config from "./config.js";

class BaseClient {
  constructor(token) {
    this.createClient();
    this.token = token;
  }

  createClient() {
    this.client = new Client({
      intents: Object.values(GatewayIntentBits),
      partials: Object.values(Partials),
      shards: "auto",
    });
  }

  loadHandlers() {
    readdirSync("./src/Handlers").forEach(async (file) => {
      const handlerFile = await import(`../Handlers/${file}`);
      const handler = handlerFile.default;
      await handler.execute(this.client);
    });
  }

  async start() {
    this.loadHandlers();
    await this.client.login(this.token);
  }

  async reconnect() {
    this.client.logger.info(`${this.client.user.username} RESTARTING!`);
    await this.client.destroy();
    this.createClient();
    await this.start();
    this.client.logger.info(`${this.client.user.username} RESTARTED!`);
  }
}

const token = config.token;
export const botClient = new BaseClient(token);
botClient.start();
