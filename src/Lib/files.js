import fs from "fs/promises";
import config from '../Base/config.js';
import path from "path";

const settingsFile = "settings"
export const soullinkDataFolder = "soullinkRunData"



export async function saveRun(runname, data) {
  await ensureDataDir();
  const file = getFilePath(runname, soullinkDataFolder);
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

export async function ensureDataDir() {
  await fs.mkdir(`${config.dataFolder}/${soullinkDataFolder}`, { recursive: true });
}

export function getFilePath(filename, folderPath = "") {
  return path.join(config.dataFolder, folderPath, `${filename}.json`);
}

export async function getRuns() {
  const files = await fs.readdir(`${config.dataFolder}/${soullinkDataFolder}`);
  return files.filter(f => f.endsWith(".json")).map(file => path.basename(file, ".json"));
}

/**
 * @param {string} runname
 * @returns {Promise<Run>}
 */
export async function loadRun(runname) {
  const file = getFilePath(runname, soullinkDataFolder);
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}


export async function setLastChannelId(channelId) {
  await fs.writeFile(
    `${config.dataFolder}/.last-reload.json`,
    JSON.stringify({ channelId: interaction.channelId }, null, 2)
  );
}

export async function getLastChannelId() {
  const data = await fs.readFile(`${config.dataFolder}/.last-reload.json`, "utf-8")
  const { channelId } = JSON.parse(data);
  return channelId;
}
