import { SlashCommandBuilder } from "@discordjs/builders";
import { CustomInteractionHandler } from "../../Lib/interaction.js";


/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  prefixData: {
    name: "ping",
    aliases: ["pong"],
  },
  slashData: new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
  // If you want to improve the command, check the guide: https://discordjs.guide/slash-commands/advanced-creation.html
  cooldown: 0, // 1 second = 1000 ms / set to 0 if you don't want a cooldown.
  adminOnly: false, // Set to true if you want the command to be usable only by the developer.

  /**
   * @param {CustomInteractionHandler} handler
   * @returns {Promise<void>}
   */
  async slashRun(handler) {
    await handler.interaction.reply(`Pong 🏓`);
  },
};
