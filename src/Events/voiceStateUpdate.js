import { Events } from 'discord.js';
import globalState from "./../Base/state.js";

const CHECK_INTERVAL_MS = 30_000;
const MUTE_LIMIT_MS = 1_200_000;

export default {
  name: Events.VoiceStateUpdate,
  once: false,

  execute(oldState, newState) {
    if (newState.channelId === newState.guild.afkChannel?.id) return;

    const client = newState.client;
    const userId = newState.id;
    const isSelfMuted = newState.selfMute || newState.selfDeaf;

    const mutedUsers = globalState.selfMutedUsers;

    if (isSelfMuted && newState.channelId) {
      const prev = mutedUsers.get(userId);

      mutedUsers.set(userId, {
        channelId: newState.channelId,
        mutedAt: prev?.mutedAt ?? Date.now(),
      });
    } else {
      mutedUsers.delete(userId);
    }

    if (mutedUsers.size > 0 && !globalState.interval) {
      globalState.startInterval(client, checkMutedUsers, CHECK_INTERVAL_MS);
    }

    if (mutedUsers.size === 0 && globalState.interval) {
      globalState.clearInterval();
      console.log("[AFK-Kicker] No more muted users.");
    } else {
      console.log(`[AFK-Kicker] Currently ${mutedUsers.size} muted users.`);
    }
  },
};

function checkMutedUsers(client, selfMutedUsers) {
  const now = Date.now();

  for (const [userId, info] of selfMutedUsers.entries()) {
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
      console.log(
        `[AFK-Kicker] Moved ${member.user.tag} to AFK for being muted too long.`
      );
      selfMutedUsers.delete(userId);
    }
  }
}
