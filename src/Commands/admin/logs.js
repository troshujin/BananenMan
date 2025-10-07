import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { CustomInteractionHandler } from "../../Lib/interaction.js";

const LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

const LEVEL_NAMES = {
  10: "🟦 Trace",
  20: "🟩 Debug",
  30: "🟨 Info",
  40: "🟧 Warn",
  50: "🟥 Error",
};

/** @type {import("../Lib/types.js").CommandBase} */
export const commandBase = {
  prefixData: {
    name: "logs",
    aliases: [],
  },
  slashData: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("View bot logs with optional filters.")
    .addStringOption(option =>
      option
        .setName("level")
        .setDescription("Filter by log level")
        .addChoices(
          { name: "All", value: "all" },
          { name: "Trace", value: "trace" },
          { name: "Debug", value: "debug" },
          { name: "Info", value: "info" },
          { name: "Warn", value: "warn" },
          { name: "Error", value: "error" },
        )
    )
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("Filter by user")
    )
    .addStringOption(option =>
      option
        .setName("guild_id")
        .setDescription("Get logs from a different guild, defaults to current guild")
    )
    .addStringOption(option =>
      option
        .setName("source")
        .setDescription("Filter by source (partial match)")
    )
    .addStringOption(option =>
      option
        .setName("before")
        .setDescription("Show logs before this timestamp (ms or ISO date)")
    )
    .addStringOption(option =>
      option
        .setName("after")
        .setDescription("Show logs after this timestamp (ms or ISO date)")
    )
    .addIntegerOption(option =>
      option
        .setName("limit")
        .setDescription("Max number of logs to display (default 20)")
        .setMinValue(1)
        .setMaxValue(100)
    ),

  cooldown: 3000,
  adminOnly: true,

  /**
   * @param {CustomInteractionHandler} handler
   * @returns {Promise<void>}
   */
  async slashRun(handler) {
    const interaction = handler.interaction;

    const levelFilter = interaction.options.getString("level") ?? "all";
    const userFilter = interaction.options.getUser("user")?.id ?? null;
    const guildIdFilter = interaction.options.getString("guild_id")?.toLowerCase() ?? interaction.guildId;
    const sourceFilter = interaction.options.getString("source")?.toLowerCase() ?? null;
    const beforeStr = interaction.options.getString("before");
    const afterStr = interaction.options.getString("after");
    const limit = interaction.options.getInteger("limit") ?? 20;

    let before = beforeStr ? parseTimestamp(beforeStr) : null;
    let after = afterStr ? parseTimestamp(afterStr) : null;

    const logs = await handler.getLogs(guildIdFilter);

    let filtered = logs;

    if (levelFilter !== "all") {
      const minLevel = LEVELS[levelFilter];
      filtered = filtered.filter(log => log.level >= minLevel);
    }

    if (userFilter) {
      filtered = filtered.filter(log => log.userId === userFilter);
    }

    if (sourceFilter) {
      filtered = filtered.filter(log =>
        log.source?.toLowerCase().includes(sourceFilter)
      );
    }

    if (before) {
      filtered = filtered.filter(log => log.timestamp < before);
    }

    if (after) {
      filtered = filtered.filter(log => log.timestamp > after);
    }

    filtered = filtered
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-limit);

    if (filtered.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📜 Logs")
            .setDescription("No logs found for the given filters.")
            .setColor("Yellow"),
        ],
        flags: "Ephemeral",
      });
    }

    const embedChunks = formatLogs(filtered);
    let first = true;
    for (const chunk of embedChunks) {
      const embed = new EmbedBuilder()
        .setTitle("📜 Logs")
        .setDescription(chunk)
        .setColor("Blue")
        .setFooter({ text: `${filtered.length} log entries shown` });

      if (first) {
        await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
        first = false;
      } else {
        await interaction.followUp({ embeds: [embed], flags: "Ephemeral" });
      }
    }
  },
};

/**
 * Convert logs to formatted strings, splitting if too long.
 * @param {Array} logs
 * @returns {string[]} Array of message chunks
 */
function formatLogs(logs) {
  const lines = logs.map(log => {
    const ts = `<t:${Math.floor(log.timestamp / 1000)}:f>`;
    const level = LEVEL_NAMES[log.level] ?? log.level;
    const source = log.source ? `**${log.source}**` : "Unknown";
    const user = log.userId ? `<@${log.userId}>` : "Unknown user";
    const details = log.details ?? "No details";

    return `${level} | ${ts} | ${user} | ${source} → ${details}`;
  });

  const chunks = [];
  let current = "";

  for (const line of lines) {
    if ((current + "\n" + line).length > 1900) {
      chunks.push(current);
      current = line;
    } else {
      current += (current ? "\n" : "") + line;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/**
 * Parse timestamps (either ms number or ISO string).
 * @param {string} str
 * @returns {number | null}
 */
function parseTimestamp(str) {
  if (!str) return null;
  const num = Number(str);
  if (!isNaN(num)) return num;
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date.getTime();
}
