import fs from "fs/promises";
import config from '../Base/config.js';
import path from "path";


export class Logger {
  constructor(guildId, forceCreate = true) {
    this.guildId = guildId;
    this.file = path.join(config.dataFolder, `logs.${guildId}.json`);
    this.defaults = [];
    this.forceCreate = forceCreate;
  }

  async ensureDataDir() {
    await fs.mkdir(config.dataFolder, { recursive: true });
  }

  async load() {
    await this.ensureDataDir();
    try {
      const data = await fs.readFile(this.file, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      if (err.code === "ENOENT") {
        if (this.forceCreate) {
          await this.save(this.defaults);
          return this.defaults;
        } else {
          // Do not create the file, just return defaults in memory
          return this.defaults;
        }
      }
      throw err;
    }
  }

  async save(logs) {
    await this.ensureDataDir();
    await fs.writeFile(this.file, JSON.stringify(logs, null, 2), "utf-8");
  }

  async get() {
    const data = await this.load();
    return data;
  }

  constructLog(level, userId, details, source) {
    return {
      level: level,
      userId: userId,
      timestamp: Date.now(),
      details: details,
      source: source,
    }
  }

  async storeLog(log) {
    const data = await this.load();
    data.push(log);
    await this.save(data);
  }

  async log(details, userId, source) {
    const newLog = this.constructLog(10, userId, details, source);

    console.log(`[${source}] ${details}`);

    await this.storeLog(newLog);
  }

  async warn(details, userId, source) {
    const newLog = this.constructLog(30, userId, details, source);

    console.warn(`[${source}] ${details}`);

    await this.storeLog(newLog);
  }

  async error(details, error, userId, source) {
    const newLog = this.constructLog(50, userId, `${details} - ${error}`, source);

    console.error(`[${source}] ${details}`);
    console.trace(error);

    await this.storeLog(newLog);
  }
}
