// src/Events/voiceCleanup.js
import globalState from "../Base/state.js";

const MAX_IDLE_MS = 3 * 60 * 1000; // 3 minutes

export default {
  name: "soundCleanup",
  once: false,
};

/**
 * This runs periodically via globalState.setIntervalFunction("soundMonitor", ...);
 */
export function checkIdleVoiceConnections() {
  const now = Date.now();

  for (const [key, data] of globalState.states.entries()) {
    if (!key.startsWith("vc_")) continue;
    const { connection, lastPlayed } = data || {};

    if (connection && lastPlayed && now - lastPlayed > MAX_IDLE_MS) {
      try {
        connection.destroy();
        console.log(`[VoiceCleanup] Disconnected idle VC for ${key}`);
      } catch (e) {
        console.error("[VoiceCleanup] Error while disconnecting:", e);
      }
      globalState.removeState(key);
    }
  }

  // Stop loop if no voice connections left
  const hasConnections = [...globalState.states.keys()].some(k => k.startsWith("vc_"));
  if (!hasConnections) {
    globalState.removeIntervalFunction("soundMonitor");
    globalState.setState("soundMonitorRunning", false);
    console.log("[VoiceCleanup] No active connections, monitor stopped.");
  }
}
