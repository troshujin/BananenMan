import { ActivityType, Events, Client, EmbedBuilder } from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import globalState from "../Base/state.js";
import { getLastChannelId } from "../Lib/files.js";

export default {
  name: Events.ClientReady,
  once: true,

  /**
   * @param {Client} client 
   */
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

    console.log("[Event] Settings state.")
    globalState.setState("client", client);

    try {
      const channelId = await getLastChannelId();

      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased()) return;

      // Send new message
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Blue")
            .setTitle("✅ Bot Reconnected")
            .setDescription("Reload successful. I'm back online.\nYou may need to restart Discord (CTRL+R) to see some slash command updates.")
            .setTimestamp()
        ]
      });
    } catch (err) {
      console.warn("No last message data found or failed to notify:", err.message);
    }
  },
};
