class StateTracker {
  constructor() {
    this.selfMutedUsers = new Map();  // userId -> { channelId, mutedAt }
    this.interval = null;
    this.counter = 1;
  }

  increment() {
    return this.counter++;
  }

  startInterval(client, afkCheckCallback, intervalMs = 30_000) {
    if (this.interval) return;

    this.interval = setInterval(() => {
      afkCheckCallback(client, this.selfMutedUsers);
      if (this.selfMutedUsers.size === 0) {
        this.clearInterval();
      }
    }, intervalMs);
  }

  clearInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

const globalState = new StateTracker();
export default globalState;
