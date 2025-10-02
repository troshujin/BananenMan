import {
  SlashCommandBuilder,
  EmbedBuilder,
  userMention,
  User,
} from "discord.js";
import { getAdmins, getSettings, saveSettings } from "../../Lib/files.js";

const SETTINGS = {
  NAME: "settings",
  SUBCOMMAND_GROUPS: {
    GENERAL: "general",
    ADMIN: "admin",
  },
  GENERAL_SUBCOMMANDS: {
    MOTD: "motd",
  },
  ADMIN_SUBCOMMANDS: {
    ADD: "add",
    REMOVE: "remove",
    LIST: "list",
  },
};

export const commandBase = {
  prefixData: {
    name: "settings",
    aliases: [],
  },
  slashData: new SlashCommandBuilder()
    .setName(SETTINGS.NAME)
    .setDescription("View or update bot settings.")
    .addSubcommandGroup(group =>
      group
        .setName(SETTINGS.SUBCOMMAND_GROUPS.GENERAL)
        .setDescription("Message-related settings")
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.GENERAL_SUBCOMMANDS.MOTD)
            .setDescription("Set the message of the day")
            .addStringOption(option =>
              option.setName("value").setDescription("New MOTD").setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName(SETTINGS.SUBCOMMAND_GROUPS.ADMIN)
        .setDescription("Admin management")
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.ADD)
            .setDescription("Add an admin")
            .addUserOption(option =>
              option.setName("user").setDescription("User to add as admin").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.REMOVE)
            .setDescription("Remove an admin")
            .addUserOption(option =>
              option.setName("user").setDescription("User to remove").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.LIST)
            .setDescription("List all current admins")
        )
    ),

  cooldown: 5000,
  adminOnly: true,

  async prefixRun(client, message, args) {
    message.reply("Hi!");
  },

  async slashRun(client, interaction) {
    const group = interaction.options.getSubcommandGroup();
    const sub = interaction.options.getSubcommand();

    switch (group) {
      case SETTINGS.SUBCOMMAND_GROUPS.GENERAL:
        if (sub === SETTINGS.GENERAL_SUBCOMMANDS.MOTD)
          return await handleMOTD(interaction);
        break;

      case SETTINGS.SUBCOMMAND_GROUPS.ADMIN:
        if (sub === SETTINGS.ADMIN_SUBCOMMANDS.ADD)
          return await handleAdminAdd(interaction);
        if (sub === SETTINGS.ADMIN_SUBCOMMANDS.REMOVE)
          return await handleAdminRemove(interaction);
        if (sub === SETTINGS.ADMIN_SUBCOMMANDS.LIST)
          return await handleAdminList(interaction);
        break;

      default:
        break;
    }
  },
};

/**
 * @param {CommandInteraction} interaction
 */
async function handleMOTD(interaction) {
  const value = interaction.options.getString("value");
  const settings = await getSettings();

  settings.motd = value;
  await saveSettings(settings);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("✅ MOTD Updated")
    .setDescription(`Message of the Day set to: **${value}**`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleAdminAdd(interaction) {
  /** @type {import('discord.js').User} */
  const user = interaction.options.getUser("user");
  const settings = await getSettings();

  if (settings.admin.find(admin => admin.id === user.id)) {
    return await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor("Yellow")
        .setTitle("ℹ️ Unable to add admin")
        .setDescription(`⚠️ ${user.tag} is already an admin.`)],
      flags: "Ephemeral",
    });
  }

  settings.admin.push({ id: user.id, username: user.username });
  await saveSettings(settings);

  const embed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("✅ Admin Added")
    .setDescription(`${userMention(user.id)} has been added as an admin.`);

  await interaction.reply({ embeds: [embed] });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleAdminRemove(interaction) {
  /** @type {User} */
  const user = interaction.options.getUser("user");
  const settings = await getSettings();

  const index = settings.admin.findIndex(admin => admin.id === user.id);
  if (index === -1) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ ${user.tag} is not an admin.`)],
      flags: "Ephemeral",
    });
  }

  settings.admin.splice(index, 1);
  await saveSettings(settings);

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("🗑️ Admin Removed")
    .setDescription(`${userMention(user.id)} has been removed from admins.`);

  await interaction.reply({ embeds: [embed] });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleAdminList(interaction) {
  const adminList = await getAdmins();

  const embed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("👮 Admin List");

  if (adminList.length === 0) {
    embed.setDescription("No admins are currently set.");
  } else {
    embed.setDescription(
      adminList.map(admin => `• ${userMention(admin.id)}`).join("\n")
    );
  }

  await interaction.reply({ embeds: [embed] });
}
