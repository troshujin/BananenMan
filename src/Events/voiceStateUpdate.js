import { Events } from 'discord.js';

// Track self-muted users
const selfMutedUsers = new Map(); // userId => { channelId, mutedAt }
const CHECK_INTERVAL_MS = 30_000;
const MUTE_LIMIT_MS = 1_200_000;

let interval;

export default {
  name: Events.VoiceStateUpdate,
  once: false,

  execute(oldState, newState) {
    if (newState.channelId == newState.guild.afkChannel.id) return;

    const client = newState.client;
    const userId = newState.id;
    const isSelfMuted = newState.selfMute || newState.selfDead;

    const currentlyHasUsers = selfMutedUsers.size > 0;

    if (isSelfMuted && newState.channelId) {
      const previous = selfMutedUsers.get(userId);

      selfMutedUsers.set(userId, {
        channelId: newState.channelId,
        mutedAt: previous?.mutedAt ?? Date.now(),
      });
    } else {

      selfMutedUsers.delete(userId);
    }

    // Start the interval only once (on first voice state update)
    if (selfMutedUsers.size > 0 && !interval) {
      interval = setInterval(() => {
        const now = Date.now();

        for (const [userId, info] of selfMutedUsers.entries()) {
          const guild = client.guilds.cache.find(g => g.channels.cache.has(info.channelId));
          const member = guild?.members.cache.get(userId);
          const afkChannel = guild?.afkChannel;

          if (
            member && afkChannel &&
            member.voice.channelId === info.channelId &&
            now - info.mutedAt >= MUTE_LIMIT_MS
          ) {
            member.voice.setChannel(afkChannel).catch(console.error);
            console.log(`[AFK-Kicker] Moved ${member.user.tag} to AFK for being muted too long.`);
            selfMutedUsers.delete(userId);

            if (selfMutedUsers.size == 0) {
              clearInterval(interval);
              interval = undefined;
              console.log("[AFK-Kicker] No more muted users.")
            }
          }
        }
      }, CHECK_INTERVAL_MS);
    }

    if (selfMutedUsers.size == 0) {
      clearInterval(interval);
      interval = undefined;
      if (currentlyHasUsers) console.log("[AFK-Kicker] No more muted users.")
    } else {
      console.log(`[AFK-Kicker] Currently ${selfMutedUsers.size} muted users.`)
    }
  },
};