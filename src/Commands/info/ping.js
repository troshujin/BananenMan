import { EmbedBuilder, PermissionsBitField } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import globalState from "../../Base/state.js";

const myValue = "no";

export const commandBase = {
  prefixData: {
    name: "ping",
    aliases: ["pong"],
  },
  slashData: new SlashCommandBuilder().setName("ping").setDescription("Pong!"),
  // If you want to improve the command, check the guide: https://discordjs.guide/slash-commands/advanced-creation.html
  cooldown: 0, // 1 second = 1000 ms / set to 0 if you don't want a cooldown.
  adminOnly: false, // Set to true if you want the command to be usable only by the developer.
  async prefixRun(client, message, args) {
    message.reply("Pong 🏓");
  },
  async slashRun(client, interaction) {
    await interaction.reply(`Pong 🏓 ${myValue}`);
    myValue += " yes"
  },
};
