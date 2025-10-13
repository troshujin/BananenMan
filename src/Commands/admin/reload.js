import { EmbedBuilder, IntentsBitField, SlashCommandBuilder } from "discord.js";
import { exec } from "child_process";
import util from "util";
import { setLastChannelId } from "../../Lib/files.js";
import { CustomInteractionHandler } from "../../Lib/interaction.js";
import globalState from "../../Base/state.js";
const execAsync = util.promisify(exec);


/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  slashData: new SlashCommandBuilder().setName("reload").setDescription("Disconnect and reconnect the bot. Reloads commands, events and handlers without losing state."),
  cooldown: 1000,
  ownerOnly: true,

  /**
   * @param {CustomInteractionHandler} handler
   * @returns {Promise<void>}
   */
  async slashRun(handler) {
    await handler.interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("Reloading")
          .setDescription("Pulling latest code and reconnecting...")
          .setTimestamp()
      ], flags: "Ephemeral"
    });

    console.log(globalState.isActive)
    globalState.setInactive();
    console.log(globalState.isActive)

    try {
      let { stdout, stderr } = await execAsync(`git pull https://${process.env.GITHUB_USERNAME}:${process.env.GITHUB_TOKEN}@github.com/troshujin/BananenMan.git`);

      stdout = stdout.replaceAll(process.env.GITHUB_USERNAME, "[GITHUB_USERNAME]").replaceAll(process.env.GITHUB_TOKEN, "[GITHUB_TOKEN]");
      stderr = stderr.replaceAll(process.env.GITHUB_USERNAME, "[GITHUB_USERNAME]").replaceAll(process.env.GITHUB_TOKEN, "[GITHUB_TOKEN]");

      if (stderr) { console.error("Git stderr:", stderr); }
      console.log("Git stdout:", stdout);
    } catch (error) {
      console.error("Git pull failed:", error);
      await handler.interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Reload failed")
            .setDescription(`Git pull failed:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp()
        ], flags: "Ephemeral"
      });
      return;
    }

    await handler.interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("Updated")
          .setDescription("Pulled latest code and started restarting!\nExpect a message from me to tell you I've succesfully restared.")
          .setTimestamp()
      ], flags: "Ephemeral"
    });

    await setLastChannelId(handler.interaction.channelId);

    try {
      const { stdout, stderr } = await execAsync(`npm i`);

      if (stderr) { console.error("npm stderr:", stderr); }
      console.log("npm stdout:", stdout);
    } catch (error) {
      console.error("npm i failed:", error);
      await handler.interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Updating node modules failed")
            .setDescription(`npm i failed:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp()
        ], flags: "Ephemeral"
      });
      return;
    }

    await handler.interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("Updated npm")
          .setDescription("Updated the node modules.")
          .setTimestamp()
      ], flags: "Ephemeral"
    });

    await handler.interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor("Yellow")
          .setTitle("Restarting bot...")
          .setDescription("This may take a while..")
          .setTimestamp()
      ], flags: "Ephemeral"
    });

    try {
      const { stdout, stderr } = await execAsync(`npm run restart`);

      if (stderr) { console.error("npm stderr:", stderr); }
      console.log("npm stdout:", stdout);
    } catch (error) {
      console.error("Restart failed:", error);
      await handler.interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setTitle("Reload failed")
            .setDescription(`Restart failed:\n\`\`\`${error.message}\`\`\``)
            .setTimestamp()
        ], flags: "Ephemeral"
      });
      return;
    }
  },
};
