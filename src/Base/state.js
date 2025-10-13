class StateTracker {
  constructor() {
    /** @type {Map<string, any>} */
    this.states = new Map();

    /** @type {Map<string, { value: any, expires: number }>} */
    this.cache = new Map();

    /** @type {Map<string, Function>} */
    this.intervalFunctions = new Map();

    this.interval = undefined;
    this.intervalMs = 5_000;

    this.isActive = true;
  }

  setInactive() {
    this.isActive = false;
  }

  /**
   * 
   * @returns {import("discord.js").Client}
   */
  getClient() {
    return this.states.get("client");
  }

  // ========== State ==========
  setState(key, value) {
    this.states.set(key, value);
  }

  setStateIfNotSet(key, value) {
    if (!this.states.has(key)) this.states.set(key, value);
  }

  getState(key) {
    return this.states.get(key);
  }

  removeState(key) {
    this.states.delete(key);
  }

  // ========== Cache ==========
  /**
   * Set a cached value with optional TTL (ms)
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs=60000] - Defaults to 1 minute
   */
  setCache(key, value, ttlMs = 60_000) {
    const expires = Date.now() + ttlMs;
    this.cache.set(key, { value, expires });
  }

  /**
   * Get a cached value, returns null if expired or not found
   * @param {string} key
   */
  getCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Delete a cached value
   * @param {string} key
   */
  removeCache(key) {
    this.cache.delete(key);
  }

  /**
   * Clean expired cache entries (runs automatically via interval)
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, { expires }] of this.cache.entries()) {
      if (now > expires) this.cache.delete(key);
    }
  }

  // ========== Interval Functions ==========
  setIntervalMs(ms) {
    this.intervalMs = ms;
  }

  setIntervalFunction(key, func) {
    this.intervalFunctions.set(key, func);

    if (!this.interval) {
      this.interval = setInterval(() => {
        this.cleanCache();

        if (this.intervalFunctions.size === 0) {
          clearInterval(this.interval);
          this.interval = undefined;
          return;
        }

        console.log(`[IntervalFunctions] Running ${this.intervalFunctions.size} functions.`);
        for (const [key, func] of this.intervalFunctions.entries()) {
          console.log(`[IntervalFunctions] Running ${key}.`);
          func();
        }
      }, this.intervalMs);
    }
  }

  removeIntervalFunction(key) {
    this.intervalFunctions.delete(key);

    if (this.intervalFunctions.size === 0) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
}

const globalState = new StateTracker();
export default globalState;
