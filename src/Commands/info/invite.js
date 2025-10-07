import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { CustomInteractionHandler } from "../../Lib/interaction.js";


/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the bot's invite link."),

  cooldown: 5000,
  adminOnly: false,

  /**
   * @param {CustomInteractionHandler} handler
   * @returns {Promise<void>}
   */
  async slashRun(handler) {
    // build the OAuth2 URL
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${handler.client.user.id}&permissions=${PermissionFlagsBits.Administrator}&scope=bot%20applications.commands`;

    await handler.interaction.reply({
      content: `Here's my invite link:\n${inviteUrl}`,
      ephemeral: true,
    });
  },
};
