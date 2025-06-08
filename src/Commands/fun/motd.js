import { SlashCommandBuilder } from "@discordjs/builders";
import { getSettings, saveSettings } from "../../Lib/settings.js";

export const commandBase = {
  prefixData: {
    name: "motd",
    aliases: ["message-of-the-day"],
  },
  slashData: new SlashCommandBuilder().setName("motd").setDescription("Message Of The Day!"),
  cooldown: 1000,
  ownerOnly: false,
  async prefixRun(client, message, args) {
    message.reply("Message");
  },


  async slashRun(client, interaction) {
    const settings = getSettings();

    const motd = settings.motd || "No MOTD set.";
    return await interaction.reply(`📢 MOTD: ${motd}`);
  },
};
