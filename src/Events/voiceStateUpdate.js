import { Events } from 'discord.js';

// Track self-muted users
const selfMutedUsers = new Map(); // userId => { channelId, mutedAt }
const CHECK_INTERVAL_MS = 3_000; // 1 min
const MUTE_LIMIT_MS = 10_000 //20 * 60 * 1000; // 20 mins

let interval; // Store interval so it doesn't restart multiple times

export default {
  name: Events.VoiceStateUpdate,
  once: false, // run every time

  execute(oldState, newState) {
    const client = newState.client;
    const userId = newState.id;
    const wasSelfMuted = oldState.selfMute;
    const isSelfMuted = newState.selfMute;

    // Start the interval only once (on first voice state update)
    if (!interval) {
      interval = setInterval(() => {
        console.log("[AFK-Kicker] Checking...")
        const now = Date.now();
        for (const [userId, info] of selfMutedUsers.entries()) {
          const guild = client.guilds.cache.find(g => g.channels.cache.has(info.channelId));
          const member = guild?.members.cache.get(userId);
          const afkChannel = guild?.afkChannel;

          if (
            member &&
            afkChannel &&
            member.voice.channelId === info.channelId &&
            now - info.mutedAt >= MUTE_LIMIT_MS
          ) {
            member.voice.setChannel(afkChannel).catch(console.error);
            console.log(`Moved ${member.user.tag} to AFK for being muted too long.`);
            selfMutedUsers.delete(userId);
          }
        }
      }, CHECK_INTERVAL_MS);
    }

    // User just muted
    if (!wasSelfMuted && isSelfMuted && newState.channel) {
      selfMutedUsers.set(userId, {
        channelId: newState.channelId,
        mutedAt: Date.now(),
      });
      selfMutedUsers.delete(userId);
    }

    // User unmuted or left channel
    if ((wasSelfMuted && !isSelfMuted) || !newState.channel) {
      selfMutedUsers.delete(userId);
    }

    if (selfMutedUsers.size == 0) {
      clearInterval(interval);
      console.log("[AFK-Kicker] No more muted users.")
    } else {
      interval = undefined;
      console.log(`[AFK-Kicker] Currently ${selfMutedUsers.size} muted users.`)
    }
  },
};