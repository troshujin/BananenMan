class StateTracker {
  constructor() {
    this.states = new Map();
    /** @type {Map<string, Function>} */
    this.minuteFunctions = new Map();
    this.interval = undefined;
  }

  setState(key, value) {
    this.states.set(key, value);
  }

  setStateIfNotSet(key, value) {
    if (this.states.get(key)) return;
    this.states.set(key, value);
  }

  getState(key) {
    this.states.get(key);
  }

  removeState(key) {
    this.states.delete(key);
  }

  /**
   * @param {string} key 
   * @param {Function} func 
   */
  setMinuteFunction(key, func) {
    this.minuteFunctions.set(key, func);
    if (this.minuteFunctions.size === 1) {
      this.interval = setInterval(() => {
        for (const [key, func] of this.minuteFunctions.entries()) {
          func()
        }
      }, 60_000);
    }
  }

  /**
   * @param {string} key 
   */
  removeMinuteFunction(key) {
    this.minuteFunctions.delete(key);
  }
}

const globalState = new StateTracker();
export default globalState;
