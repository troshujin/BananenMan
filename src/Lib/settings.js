import fs from "fs/promises";
import config from '../Base/config.js';
import path from "path";


export class Settings {
  constructor(guildId) {
    this.guildId = guildId;
    this.file = path.join(config.dataFolder, `settings.${guildId}.json`);
    this.defaults = {
      adminUsers: config.defaultSettings.admin ?? [],
      adminRoles: [],
    };
  }

  async ensureDataDir() {
    await fs.mkdir(config.dataFolder, { recursive: true });
  }

  async load() {
    await this.ensureDataDir();
    try {
      const data = JSON.parse(await fs.readFile(this.file, "utf-8"));
      return { ...this.defaults, ...data };
    } catch (err) {
      if (err.code === "ENOENT") {
        await this.save(this.defaults);
        return this.defaults;
      }
      throw err;
    }
  }

  async save(settings) {
    await this.ensureDataDir();
    await fs.writeFile(this.file, JSON.stringify(settings, null, 2));
  }

  async get(key) {
    const data = await this.load();
    return data[key] ?? this.defaults[key];
  }

  async set(key, value) {
    const data = await this.load();
    data[key] = value;
    await this.save(data);
  }

  /** @returns {Promise<ShortUser[]>} */
  async getAdmins() {
    const admins = await this.get("adminUsers");
    const defaultAdmins = this.defaults.adminUsers;
    const missing = defaultAdmins.filter(d => !admins.some(a => a.id === d.id));
    return admins.concat(missing);
  }

  /** @returns {Promise<string[]>} */
  async getAdminRoles() {
    return await this.get("adminRoles");
  }

  /** @param {ShortUser} user */
  async addAdminUser(user) {
    const data = await this.load();
    if (!data.adminUsers.some(u => u.id === user.id)) {
      data.adminUsers.push(user);
      await this.save(data);
    }
  }

  /** @param {string} userId */
  async removeAdminUser(userId) {
    const data = await this.load();
    data.adminUsers = data.adminUsers.filter(u => u.id !== userId);
    await this.save(data);
  }

  /** @param {string} roleId */
  async addAdminRole(roleId) {
    const data = await this.load();
    if (!data.adminRoles.includes(roleId)) {
      data.adminRoles.push(roleId);
      await this.save(data);
    }
  }

  /** @param {string} roleId */
  async removeAdminRole(roleId) {
    const data = await this.load();
    data.adminRoles = data.adminRoles.filter(id => id !== roleId);
    await this.save(data);
  }
}
