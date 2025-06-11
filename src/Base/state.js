class StateTracker {
  constructor() {
    this.states = new Map();
    /** @type {Map<string, Function>} */
    this.intervalFunctions = new Map();
    this.interval = undefined;
    this.intervalMs = 20_000;
  }

  setIntervalMs(ms) {
    this.intervalMs = ms;
  }

  setState(key, value) {
    this.states.set(key, value);
  }

  setStateIfNotSet(key, value) {
    if (this.states.get(key)) return;
    this.states.set(key, value);
  }

  getState(key) {
    return this.states.get(key);
  }

  removeState(key) {
    this.states.delete(key);
  }

  /**
   * @param {string} key 
   * @param {Function} func 
   */
  setIntervalFunction(key, func) {
    this.intervalFunctions.set(key, func);
    if (!this.interval) {
      this.interval = setInterval(() => {
        if (this.intervalFunctions.size === 0) {
          clearInterval(this.interval);
          this.interval = undefined;
          return;
        }

        console.log(`[IntervalFunctions] Running ${this.intervalFunctions.size} functions.`);

        for (const [key, func] of this.intervalFunctions.entries()) {
          console.log(`[IntervalFunctions] Running ${func.name}.`)
          func()
        }
      }, this.intervalMs);
    }
  }

  /**
   * @param {string} key 
   */
  removeIntervalFunction(key) {
    this.intervalFunctions.delete(key);

    if (this.intervalFunctions.size === 0) {
      clearInterval(this.interval);
      this.interval = undefined;
      return;
    }
  }
}

const globalState = new StateTracker();
export default globalState;
