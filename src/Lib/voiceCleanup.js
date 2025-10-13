// src/Events/voiceCleanup.js
import globalState from "../Base/state.js";

const MAX_IDLE_MS = 30 * 1000; // 30 seconds

export const BOT_VOICE_ACTIVITY_KEY = (guildId) => `${guildId}_noiseMade`
export const BOT_VOICE_STATE_KEY = (guildId) => `${guildId}_vcState`


export function checkIdleVoiceConnections(guildId) {
  const now = Date.now();
  
  const noiseKey = BOT_VOICE_ACTIVITY_KEY(guildId);
  const lastNoise = globalState.getState(noiseKey);
  if (!lastNoise) return;

  if (lastNoise < now + MAX_IDLE_MS) {
    const key = BOT_VOICE_STATE_KEY(guildId)
    const { connection, lastPlayed } = globalState.getState(key);

    if (connection && lastPlayed && now - lastPlayed > MAX_IDLE_MS) {
      try {
        connection.destroy();
        console.log(`[VoiceCleanup] Disconnected idle VC for ${guildId}`);
      } catch (e) {
        console.error("[VoiceCleanup] Error while disconnecting:", e);
      }
      globalState.removeState(noiseKey);
      globalState.removeState(key);
    }
  }
}
