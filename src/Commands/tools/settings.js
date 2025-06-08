import { SlashCommandBuilder } from "@discordjs/builders";
import { getSettings, saveSettings } from "../../Lib/settings.js";

const SETTINGS_LIST = {
  MESSAGES: "messages",
  _messages: {
    MOTD: "motd"
  },
  GENERAL: "general",
  _general: {
    MAXCOUNT: "maxcount"
  }
}

export const commandBase = {
  prefixData: {
    name: "settings",
    aliases: [],
  },
  slashData: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("View or update bot settings.")
    .addSubcommandGroup(group =>
      group
        .setName(SETTINGS_LIST.GENERAL)
        .setDescription("General settings")
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS_LIST._general.MAXCOUNT)
            .setDescription("Set the max count")
            .addIntegerOption(option =>
              option.setName("value").setDescription("New max count").setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName(SETTINGS_LIST.MESSAGES)
        .setDescription("Message-related settings")
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS_LIST._messages.MOTD)
            .setDescription("Set the message of the day")
            .addStringOption(option =>
              option.setName("value").setDescription("New MOTD").setRequired(true)
            )
        )
    ),

  // If you want to improve the command, check the guide: https://discordjs.guide/slash-commands/advanced-creation.html
  cooldown: 5000, // 1 second = 1000 ms / set to 0 if you don't want a cooldown.
  ownerOnly: true, // Set to true if you want the command to be usable only by the developer.
  async prefixRun(client, message, args) {
    message.reply("Hi!");
  },
  async slashRun(client, interaction) {
    const group = interaction.options.getSubcommandGroup(); // "general" or "messages"

    switch (group) {
      case SETTINGS_LIST.GENERAL:
        await handleGeneralSettings(interaction);
        break;

      case SETTINGS_LIST.MESSAGES:
        await handleMessagesSettings(interaction);
        break;
    
      default:
        break;
    }
  },
};

async function handleGeneralSettings(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case SETTINGS_LIST._general.MAXCOUNT:
      break;
  
    default:
      break;
  }
}

async function handleMessagesSettings(interaction) {
  const subcommand = interaction.options.getSubcommand();

  switch (subcommand) {
    case SETTINGS_LIST._messages.MOTD:
      const value = interaction.options.getString("value");
      const settings = getSettings();
      settings.motd = value;
      saveSettings(settings);
      interaction.reply(`Successfully updated MOTD to ${value}`)
      break;
  
    default:
      break;
  }
}
