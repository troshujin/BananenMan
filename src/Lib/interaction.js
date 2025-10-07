/**
 * @typedef {Object} CommandBase
 * @property {{name: string, aliases?: string[]}} prefixData - info for prefix command
 * @property {SlashCommandBuilder} slashData - info for slash command
 * @property {number} cooldown - cooldown in ms
 * @property {boolean} adminOnly - whether only admins can run
 * @property {boolean} ownerOnly - whether only owners can run
 * @property {(client: import("discord.js").Client, interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void>} slashRun
 */

import config from "../Base/config.js";
import { Logger } from "./logger.js";
import { Settings } from "./settings.js";

export class CustomInteractionHandler {
  /**
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   * @param {CommandBase} command 
   */
  constructor(client, interaction, command) {
    this.client = client
    this.interaction = interaction
    this.command = command
    this.settings = new Settings(interaction.guildId)
    this.logger = new Logger(interaction.guildId)

    this.isAdminCache = null;
    this.isOwnerCache = null;
  }

  async execute() {
    this.log("Executing command")
    try {
      await this.command.slashRun(this);
    } catch (error) {
      this.error("An error occurred while executing.", error)
      this.handleError(error)
    }
  }

  async handleError(error) {
    const isAdmin = await this.checkIsAdmin();
    let content = "An error occurred."

    if (isAdmin) {
      content = `An error occured:\n\n${error}`
    }

    if (this.interaction.replied) {
      this.interaction.followUp({
        content: content,
        flags: "Ephemeral",
      });
    } else {
      this.interaction.reply({
        content: content,
        flags: "Ephemeral",
      });
    }
  }

  async getLogs(guildId) {
    const logger = new Logger(guildId, false);
    return await logger.get();
  }

  async log(details) {
    this.logger.log(details, this.interaction.user.id, `/${this.command.slashData.name}`)
  }

  async warn(details) {
    this.logger.warn(details, this.interaction.user.id, `/${this.command.slashData.name}`)
  }

  async error(error, details) {
    this.logger.error(error, details, this.interaction.user.id, `/${this.command.slashData.name}`)
  }

  async checkIsAdmin() {
    if (this.isAdminCache !== null) return this.isAdminCache;

    if (await this.checkIsOwner()) {
      this.isAdminCache = true;
      return true;
    }

    const admins = await this.settings.getAdmins();
    if (admins.find(a => a.id === this.interaction.user.id)) {
      this.isAdminCache = true;
      return true;
    }

    if (!this.member) {
      this.member = await this.interaction.guild.members.fetch(this.interaction.user.id);
    }

    const roles = await this.settings.getAdminRoles();
    if (this.member.roles.cache.some(r => roles.includes(r.id))) {
      this.isAdminCache = true;
      return true;
    }

    this.isAdminCache = false;
    return false;
  }

  // its not async, I know, but maybe it will be one day
  async checkIsOwner() {
    if (this.isOwnerCache !== null) return this.isOwnerCache;
    const isOwner = config.owners.includes(this.interaction.user.id)
    this.isOwnerCache = isOwner;
    return isOwner;
  }
}