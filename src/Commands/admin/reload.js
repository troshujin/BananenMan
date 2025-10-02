import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { botClient } from "../../Base/app.js";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import config from "../../Base/config.js";
const execAsync = util.promisify(exec);


export const commandBase = {
  prefixData: {
    name: "reload",
    aliases: [],
  },
  slashData: new SlashCommandBuilder().setName("reload").setDescription("Disconnect and reconnect the bot. Reloads commands, events and handlers without losing state."),
  cooldown: 1000,
  adminOnly: true,

  /**
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").CommandInteraction} interaction
   */
  async slashRun(client, interaction) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("⚠️ Reloading ⚠️")
          .setDescription("Pulling latest code and reconnecting...")
          .setTimestamp()
      ]
    });

    try {
      const { stdout, stderr } = await execAsync(`git pull https://${process.env.GITHUB_USERNAME}:${process.env.GITHUB_TOKEN}@github.com/troshujin/BananenMan.git`);

      if (stderr) { console.error("Git stderr:", stderr); }
      console.log("Git stdout:", stdout);
    } catch (error) {
      console.error("Git pull failed:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("❌ Reload failed")
            .setDescription(`Git pull failed:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp()
        ]
      });
      return;
    }

    await fs.writeFile(
      `${config.dataFolder}/.last-reload.json`,
      JSON.stringify({ channelId: interaction.channelId }, null, 2)
    );

    try {
      const { stdout, stderr } = await execAsync(`npm run restart`);

      if (stderr) { console.error("Git stderr:", stderr); }
      console.log("Git stdout:", stdout);
    } catch (error) {
      console.error("Restart failed:", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("❌ Reload failed")
            .setDescription(`Restart failed:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp()
        ]
      });
      return;
    }

    
    await fs.writeFile(
      "./.last-reload.json",
      JSON.stringify({ channelId: interaction.channelId }, null, 2)
    );

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("✅ Reloaded ✅")
          .setDescription("Pulled latest code and reconnected.\nYou may need to restart Discord (CTRL+R) to see some slash command updates.")
          .setTimestamp()
      ]
    });
  },
};
