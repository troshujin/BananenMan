import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getSettings } from "../../Lib/files.js";

export const commandBase = {
  prefixData: {
    name: "motd",
    aliases: ["message-of-the-day"],
  },
  slashData: new SlashCommandBuilder().setName("motd").setDescription("Message Of The Day!"),
  cooldown: 1000,
  adminOnly: false,
  async prefixRun(client, message, args) {
    message.reply("Message");
  },


  async slashRun(client, interaction) {
    const settings = await getSettings();
    const motd = settings.motd || "No MOTD set.";

    return await interaction.reply({
      embeds: [new EmbedBuilder()
        .setTitle("MOTD")
        .setDescription(motd)
        .setTimestamp()]
    });
  },
};
