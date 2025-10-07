import {
  SlashCommandBuilder,
  EmbedBuilder,
  userMention,
  roleMention,
} from "discord.js";
import { CustomInteractionHandler } from "../../Lib/interaction.js";

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
    ADD_USER: "adduser",
    REMOVE_USER: "removeuser",
    LIST_USERS: "listusers",
    ADD_ROLE: "addrole",
    REMOVE_ROLE: "removerole",
    LIST_ROLES: "listroles",
  },
};

/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  prefixData: { name: "settings", aliases: [] },
  slashData: new SlashCommandBuilder()
    .setName(SETTINGS.NAME)
    .setDescription("View or update bot settings.")
    .addSubcommandGroup(group =>
      group
        .setName(SETTINGS.SUBCOMMAND_GROUPS.GENERAL)
        .setDescription("General bot settings")
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.GENERAL_SUBCOMMANDS.MOTD)
            .setDescription("Set the Message of the Day")
            .addStringOption(opt =>
              opt.setName("value").setDescription("New MOTD").setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName(SETTINGS.SUBCOMMAND_GROUPS.ADMIN)
        .setDescription("Admin management")
        // --- USER COMMANDS ---
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.ADD_USER)
            .setDescription("Add a user as admin")
            .addUserOption(opt =>
              opt.setName("user").setDescription("User to add").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.REMOVE_USER)
            .setDescription("Remove a user from admin list")
            .addUserOption(opt =>
              opt.setName("user").setDescription("User to remove").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.LIST_USERS)
            .setDescription("List admin users")
        )
        // --- ROLE COMMANDS ---
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.ADD_ROLE)
            .setDescription("Add a role as admin role")
            .addRoleOption(opt =>
              opt.setName("role").setDescription("Role to add").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.REMOVE_ROLE)
            .setDescription("Remove a role from admin list")
            .addRoleOption(opt =>
              opt.setName("role").setDescription("Role to remove").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SETTINGS.ADMIN_SUBCOMMANDS.LIST_ROLES)
            .setDescription("List admin roles")
        )
    ),

  cooldown: 5000,
  adminOnly: true,

  /**
   * @param {CustomInteractionHandler} handler
   */
  async slashRun(handler) {
    const group = handler.interaction.options.getSubcommandGroup();
    const sub = handler.interaction.options.getSubcommand();

    if (group === SETTINGS.SUBCOMMAND_GROUPS.GENERAL) {
      if (sub === SETTINGS.GENERAL_SUBCOMMANDS.MOTD)
        return handleMOTD(handler);
    }

    if (group === SETTINGS.SUBCOMMAND_GROUPS.ADMIN) {
      switch (sub) {
        case SETTINGS.ADMIN_SUBCOMMANDS.ADD_USER: return handleAdminAddUser(handler);
        case SETTINGS.ADMIN_SUBCOMMANDS.REMOVE_USER: return handleAdminRemoveUser(handler);
        case SETTINGS.ADMIN_SUBCOMMANDS.LIST_USERS: return handleAdminListUsers(handler);
        case SETTINGS.ADMIN_SUBCOMMANDS.ADD_ROLE: return handleAdminAddRole(handler);
        case SETTINGS.ADMIN_SUBCOMMANDS.REMOVE_ROLE: return handleAdminRemoveRole(handler);
        case SETTINGS.ADMIN_SUBCOMMANDS.LIST_ROLES: return handleAdminListRoles(handler);
      }
    }
  },
};

/* -------------------- HANDLERS -------------------- */

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleMOTD(handler) {
  const value = handler.interaction.options.getString("value");
  await handler.settings.set("motd", value);
  await handler.interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setTitle("✅ MOTD Updated")
        .setDescription(`Message of the Day set to: **${value}**`)
        .setTimestamp(),
    ],
  });
}

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleAdminAddUser(handler) {
  const user = handler.interaction.options.getUser("user");
  const admins = await handler.settings.getAdmins();
  if (admins.some(a => a.id === user.id))
    return handler.interaction.reply({
      embeds: [new EmbedBuilder().setColor("Yellow").setTitle("⚠️ Already an admin").setDescription(`${userMention(user.id)} is already an admin.`)],
      flags: "Ephemeral",
    });

  await handler.settings.addAdminUser({ id: user.id, username: user.username });
  await handler.interaction.reply({
    embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ Admin Added").setDescription(`${userMention(user.id)} has been added.`)],
  });
}

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleAdminRemoveUser(handler) {
  const user = handler.interaction.options.getUser("user");
  await handler.settings.removeAdminUser(user.id);
  await handler.interaction.reply({
    embeds: [new EmbedBuilder().setColor("Red").setTitle("🗑️ Admin Removed").setDescription(`${userMention(user.id)} removed from admins.`)],
  });
}

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleAdminListUsers(handler) {
  const admins = await handler.settings.getAdmins();
  const desc = admins.length ? admins.map(a => `• ${userMention(a.id)}`).join("\n") : "No admin users found.";
  await handler.interaction.reply({
    embeds: [new EmbedBuilder().setColor("Blue").setTitle("👮 Admin Users").setDescription(desc)],
  });
}

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleAdminAddRole(handler) {
  const role = handler.interaction.options.getRole("role");
  const roles = await handler.settings.getAdminRoles();
  if (roles.includes(role.id))
    return handler.interaction.reply({
      embeds: [new EmbedBuilder().setColor("Yellow").setTitle("⚠️ Already admin role").setDescription(`${roleMention(role.id)} is already set as admin role.`)],
      flags: "Ephemeral",
    });

  await handler.settings.addAdminRole(role.id);
  await handler.interaction.reply({
    embeds: [new EmbedBuilder().setColor("Green").setTitle("✅ Admin Role Added").setDescription(`${roleMention(role.id)} added as admin role.`)],
  });
}

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleAdminRemoveRole(handler) {
  const role = handler.interaction.options.getRole("role");
  await handler.settings.removeAdminRole(role.id);
  await handler.interaction.reply({
    embeds: [new EmbedBuilder().setColor("Red").setTitle("🗑️ Admin Role Removed").setDescription(`${roleMention(role.id)} removed from admin roles.`)],
  });
}

/**
 * @param {CustomInteractionHandler} handler
 */
async function handleAdminListRoles(handler) {
  const roles = await handler.settings.getAdminRoles();
  const desc = roles.length ? roles.map(id => `• ${roleMention(id)}`).join("\n") : "No admin roles found.";
  await handler.interaction.reply({
    embeds: [new EmbedBuilder().setColor("Blue").setTitle("🎭 Admin Roles").setDescription(desc)],
  });
}
