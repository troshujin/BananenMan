import {
  SlashCommandBuilder,
} from "discord.js";
import { exec } from "child_process";
import util from "util";
import { CustomInteractionHandler } from "../../Lib/interaction.js";
const execAsync = util.promisify(exec);


/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("pm2logs")
    .setDescription("Show the latest PM2 logs from the bot process.")
    .addNumberOption((option) =>
      option
        .setName("lines")
        .setDescription("Set the amount of lines to be shown, defaults to 100")
        .setRequired(false)
    ),
  ownerOnly: true,

  /**
   * @param {CustomInteractionHandler} handler
   * @returns {Promise<void>}
   */
  async slashRun(handler) {
    let nrOfLines = handler.interaction.options.getNumber("lines") ?? 100;

    await handler.interaction.deferReply({ flags: "Ephemeral" });

    let logsText;
    try {
      nrOfLines = parseInt(nrOfLines);
      const { stdout } = await execAsync(`pm2 logs discord-bot --lines ${nrOfLines} --nostream`);
      logsText = stdout.trim();
    } catch (err) {
      console.error("Failed to get logs:", err);
      return await handler.interaction.editReply({
        content: "❌ Failed to retrieve logs. See console for more details.",
      });
    }

    const chunks = [];
    const lines = logsText.split("\n");
    let buffer = "";

    for (const line of lines) {
      if ((buffer + line + "\n").length > 1900) {
        chunks.push(buffer);
        buffer = "";
      }
      buffer += line + "\n";
    }
    if (buffer) chunks.push(buffer);

    await handler.interaction.editReply({
      content: "```\n" + chunks[0] + "```",
    });

    for (let i = 1; i < chunks.length; i++) {
      await handler.interaction.followUp({
        content: "```ansi\n" + chunks[i] + "```",
        flags: "Ephemeral",
      });
    }
  },
};
