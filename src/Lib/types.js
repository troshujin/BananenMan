


/**
 * @typedef {Object} User
 * @property {string} id - Discord user ID
 * @property {string} username - Discord username
 */

/**
 * @typedef {Object} History
 * @property {"pokemon" | "location"} type
 * @property {string} oldValue
 * @property {string} newValue
 * @property {string} location
 * @property {number} createdOn
 */

/**
 * @typedef {Object} Encounter
 * @property {number} id
 * @property {string} location
 * @property {string} status
 * @property {string} [reason]
 * @property {string} playerId
 * @property {string} playerName
 * @property {string} pokemon
 * @property {string} nickname
 * @property {boolean} captured
 * @property {History[]} history
 */

/**
 * @typedef {Object} Run
 * @property {string} runname
 * @property {boolean} started
 * @property {number} startedOn
 * @property {User[]} players
 * @property {Encounter[]} encounters
 * @property {number} encounterCounter
 */

/**
 * @typedef {Object} Settings
 * @property {string} motd
 * @property {User[]} admin
 */
