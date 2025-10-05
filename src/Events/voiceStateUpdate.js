import { Events } from 'discord.js';
import globalState from "./../Base/state.js";

const MUTE_LIMIT_MS = 20 * 60 * 1000;
const KEYS = {
  isRunning: "afkKickerIsRunning",
  functionKey: "afkKickerFunction",
  mutedUsers: "afkKickerMutedUsers"
}

let hasActivated = false;

export default {
  name: Events.VoiceStateUpdate,
  once: false,

  /**
   * @param {import('discord.js').VoiceState} oldState
   * @param {import('discord.js').VoiceState} newState
   */
  execute(oldState, newState) {
    return;
    if (newState.channelId === newState.guild.afkChannel?.id) return;

    const userId = newState.id;
    const isSelfMuted = newState.selfMute || newState.selfDeaf;

    /**
     * @typedef {Object} mutedUsers
     * @property {number} channelId
     * @property {number} mutedAt
     */

    /** @type {Map<string, mutedUsers>} */
    const mutedUsers = globalState.getState(KEYS.mutedUsers) ?? new Map();

    if (isSelfMuted && newState.channelId) {
      const prev = mutedUsers.get(userId);

      mutedUsers.set(userId, {
        channelId: newState.channelId,
        mutedAt: prev?.mutedAt ?? Date.now(),
      });
    } else {
      mutedUsers.delete(userId);
    }

    globalState.setState(KEYS.mutedUsers, mutedUsers);

    if (mutedUsers.size > 0 && (!hasActivated || !globalState.getState(KEYS.isRunning))) {
      hasActivated = true;
      globalState.setState(KEYS.isRunning, true);
      globalState.setIntervalFunction(KEYS.functionKey, checkMutedUsers);
    }

    if (mutedUsers.size === 0) {
      globalState.removeIntervalFunction(KEYS.functionKey);
      globalState.setState(KEYS.isRunning, false);
      console.log("[AFK-Kicker] No more muted users.");
    } else {
      console.log(`[AFK-Kicker] Currently ${mutedUsers.size} muted users.`);
    }
  },
};

function checkMutedUsers() {
  const now = Date.now();
  const client = globalState.getState("client");
  /** @type {Map<string, mutedUsers>} */
  const mutedUsers = globalState.getState(KEYS.mutedUsers);

  if (!client) {
    console.log("[Afk-Kicker] Client not set, cancelling.");
    globalState.setState(KEYS.isRunning, false);
    globalState.removeIntervalFunction(KEYS.functionKey);
    return
  }

  if (!mutedUsers) {
    console.log("[AFK-Kicker] (Did run, but non found) No more muted users.");
    globalState.setState(KEYS.isRunning, false);
    globalState.removeIntervalFunction(KEYS.functionKey);
    return;
  }

  for (const [userId, info] of mutedUsers.entries()) {
    const guild = client.guilds.cache.find((g) =>
      g.channels.cache.has(info.channelId)
    );
    const member = guild?.members.cache.get(userId);
    const afkChannel = guild?.afkChannel;

    if (
      member &&
      afkChannel &&
      member.voice.channelId === info.channelId &&
      now - info.mutedAt >= MUTE_LIMIT_MS
    ) {
      member.voice.setChannel(afkChannel).catch(console.error);
      console.log(`[AFK-Kicker] Moved ${member.user.tag} to AFK for being muted too long.`);
      mutedUsers.delete(userId);
    }
  }

  globalState.setState(KEYS.mutedUsers, mutedUsers);
}
