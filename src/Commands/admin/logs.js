import {
  SlashCommandBuilder,
} from "discord.js";
import { exec } from "child_process";
import util from "util";
const execAsync = util.promisify(exec);

export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Show the latest PM2 logs from the bot process.")
    .addNumberOption((option) =>
      option
        .setName("lines")
        .setDescription("Set the amount of lines to be shown, defaults to 100")
        .setRequired(false)
    ),
  adminOnly: true,

  /**
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async slashRun(client, interaction) {
    let nrOfLines = interaction.options.getNumber("lines") ?? 100;

    await interaction.deferReply({ flags: "Ephemeral" });

    let logsText;
    try {
      nrOfLines = parseInt(nrOfLines);
      const { stdout } = await execAsync(`pm2 logs discord-bot --lines ${nrOfLines} --nostream`);
      logsText = stdout.trim();
    } catch (err) {
      console.error("Failed to get logs:", err);
      return await interaction.editReply({
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

    await interaction.editReply({
      content: "```\n" + chunks[0] + "```",
    });

    for (let i = 1; i < chunks.length; i++) {
      await interaction.followUp({
        content: "```ansi\n" + chunks[i] + "```",
        flags: "Ephemeral",
      });
    }
  },
};
