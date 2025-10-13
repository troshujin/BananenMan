import { Events } from "discord.js";
import globalState from "./../Base/state.js";
import { checkIdleVoiceConnections } from "../Lib/voiceCleanup.js";

// Constants
const MUTE_LIMIT_MS = 20 * 60 * 1000; // 20 minutes
// const MUTE_LIMIT_MS = 2000; // 2 seconds

// Key prefixes
export const KEYS = {
  AFK_RUNNING: (guildId) => `${guildId}_afkKickerIsRunning`,
  AFK_INTERVAL: (guildId) => `${guildId}_afkKickerCheck`,
  AFK_MUTED: (guildId) => `${guildId}_afkKickerMutedUsers`,
  SOUND_RUNNING: (guildId) => `${guildId}_soundMonitorRunning`,
  SOUND_INTERVAL: (guildId) => `${guildId}_noiseIdleCheck`,
};

// ---------------------------
// Event Handler
// ---------------------------
export default {
  name: Events.VoiceStateUpdate,
  once: false,

  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  async execute(oldState, newState) {
    const guild = newState.guild ?? oldState.guild;
    if (!guild) return;

    // handleAfkKicker(guild, newState, oldState);
    handleSoundMonitor(guild, newState, oldState);
  },
};

// ---------------------------
// AFK Kicker Functions
// ---------------------------
function handleAfkKicker(guild, newState, oldState) {
  const userId = newState.id;
  if (newState.channelId === guild.afkChannel?.id) return;
  const isSelfMuted = newState.selfMute || newState.selfDeaf;

  /** @type {Map<string, { channelId: string, mutedAt: number }>} */
  const mutedUsers = globalState.getState(KEYS.AFK_MUTED(guild.id)) ?? new Map();

  if (isSelfMuted && newState.channelId) {
    const prev = mutedUsers.get(userId);
    mutedUsers.set(userId, {
      channelId: newState.channelId,
      mutedAt: prev?.mutedAt ?? Date.now(),
    });
  } else {
    mutedUsers.delete(userId);
  }

  globalState.setState(KEYS.AFK_MUTED(guild.id), mutedUsers);
  const isActive = globalState.getState(KEYS.AFK_RUNNING(guild.id));

  if (!isActive && mutedUsers.size > 0 && !globalState.getState(KEYS.AFK_RUNNING(guild.id))) {
    startAfkMonitor(guild.id);
  } else if (isActive && mutedUsers.size === 0) {
    stopAfkMonitor(guild.id);
  }
}

function startAfkMonitor(guildId) {
  console.log(`[AFK-Kicker] Starting AFK monitor for guild ${guildId}`);
  globalState.setState(KEYS.AFK_RUNNING(guildId), true);

  globalState.setIntervalFunction(KEYS.AFK_INTERVAL(guildId), () => checkMutedUsersForGuild(guildId))
}

function stopAfkMonitor(guildId) {
  console.log(`[AFK-Kicker] Stopping AFK monitor for guild ${guildId}`);
  globalState.setState(KEYS.AFK_RUNNING(guildId), false);

  globalState.removeIntervalFunction(KEYS.AFK_INTERVAL(guildId))
}

function checkMutedUsersForGuild(guildId) {
  const client = globalState.getClient();
  const mutedUsers = globalState.getState(KEYS.AFK_MUTED(guildId));
  if (!client || !mutedUsers) return stopAfkMonitor(guildId);

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return stopAfkMonitor(guildId);

  const afkChannel = guild.afkChannel;
  if (!afkChannel) return;

  const now = Date.now();
  for (const [userId, info] of mutedUsers.entries()) {
    const member = guild.members.cache.get(userId);
    if (
      member &&
      member.voice.channelId === info.channelId &&
      now - info.mutedAt >= MUTE_LIMIT_MS
    ) {
      member.voice.setChannel(afkChannel).catch(console.error);
      console.log(`[AFK-Kicker] Moved ${member.user.tag} to AFK (muted too long).`);
      mutedUsers.delete(userId);
    }
  }

  globalState.setState(KEYS.AFK_MUTED(guildId), mutedUsers);
  if (mutedUsers.size === 0) stopAfkMonitor(guildId);
}

// ---------------------------
// Sound Monitor Functions
// ---------------------------
function handleSoundMonitor(guild, newState, oldState) {
  const botId = guild.client.user?.id;
  if (!botId) return;

  const wasInChannel = (oldState.channelId && oldState.channel?.members.has(botId)) ?? false;
  const isInChannel = (newState.channelId && newState.channel?.members.has(botId)) ?? false;

  const isRunningKey = KEYS.SOUND_RUNNING(guild.id);

  // Bot joined a channel
  if (!wasInChannel && isInChannel && !globalState.getState(isRunningKey)) {
    startSoundMonitor(guild.id);
  }

  // Bot left a channel
  if (!isInChannel && globalState.getState(isRunningKey)) {
    stopSoundMonitor(guild.id);
  }
}

function startSoundMonitor(guildId) {
  console.log(`[SoundMonitor] Starting sound monitor for guild ${guildId}`);
  globalState.setState(KEYS.SOUND_RUNNING(guildId), true);

  globalState.setIntervalFunction(KEYS.SOUND_INTERVAL(guildId), () => checkIdleVoiceConnections(guildId));
}

function stopSoundMonitor(guildId) {
  console.log(`[SoundMonitor] Stopping sound monitor for guild ${guildId}`);
  globalState.setState(KEYS.SOUND_RUNNING(guildId), false);

  globalState.removeIntervalFunction(KEYS.SOUND_INTERVAL(guildId));
}
