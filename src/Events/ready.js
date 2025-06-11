import { ActivityType, Events } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import globalState from "../Base/state";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log("[Event] 'ready': Running.")
    const rest = new REST({ version: "10" }).setToken(client.token);

    client.user.presence.set({
      activities: [
        { name: "the voice calls.", type: ActivityType.Watching },
      ],
    });

    client.logger.info(`${client.user.username} Active!`);

    try {
      await rest.put(Routes.applicationCommands(client.user.id), {
        body: client.slashDatas,
      });
    } catch (error) {
      console.error(error);
    }

    globalState.getState("client", client);
  },
};
