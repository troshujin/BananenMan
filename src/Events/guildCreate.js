import { Events } from "discord.js";
import { Settings } from "../Lib/settings.js";

const botRoleName = "Purkachu Admin"

export default {
  name: Events.GuildCreate,
  once: false,

  /**
   * @param {import("discord.js").Guild} guild
   */
  async execute(guild) {
    try {
      let role = guild.roles.cache.find(r => r.name === botRoleName);
      if (!role) {
        role = await guild.roles.create({
          name: botRoleName,
          permissions: [],
          reason: `Default ${botRoleName} for bot commands`,
        });
        console.log(`Created role "${botRoleName}" in ${guild.name}`);
      } else {
        console.log(`Role "${botRoleName}" already exists in ${guild.name}`);
      }

      // Save this role ID into your settings for the guild
      const settings = new Settings(guild.id);
      await settings.addAdminRole(role.id);

    } catch (err) {
      console.error(`Failed to create role in ${guild.name}:`, err);
    }
  },
};
