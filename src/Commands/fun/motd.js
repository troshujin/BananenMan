import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Settings } from "../../Lib/settings.js";
import { CustomInteractionHandler } from "../../Lib/interaction.js";


/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  prefixData: {
    name: "motd",
    aliases: ["message-of-the-day"],
  },
  slashData: new SlashCommandBuilder().setName("motd").setDescription("Message Of The Day!"),
  cooldown: 1000,
  adminOnly: false,

  /**
   * @param {CustomInteractionHandler} handler
   * @returns {Promise<void>}
   */
  async slashRun(handler) {
    const settings = new Settings(handler.interaction.guildId);
    const motd = await settings.get("motd") || "No MOTD set.";

    return await handler.interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("MOTD")
        .setDescription(motd)
        .setTimestamp()]
    });
  },
};
