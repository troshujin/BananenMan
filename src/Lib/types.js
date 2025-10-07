/**
 * @typedef {Object} CommandBase
 * @property {import("discord.js").SlashCommandBuilder} slashData - info for slash command
 * @property {number} cooldown - cooldown in ms
 * @property {boolean} adminOnly - whether only admins can run
 * @property {boolean} ownerOnly - whether only owners can run
 * @property {(client: import("discord.js").Client, interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void>} slashRun
 */

/**
 * @typedef {Object} ShortUser
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
 * @property {ShortUser[]} players
 * @property {Encounter[]} encounters
 * @property {number} encounterCounter
 */

/**
 * @typedef {Object} Settings
 * @property {string} motd
 * @property {ShortUser[]} admin
 */

/**
 * @typedef {Object} SimpleEncounter
 * @property {string} id
 * @property {string} player
 * @property {string} pokemon
 * @property {boolean} captured
 */

/**
 * @typedef {Object} GroupedEncounter
 * @property {string} location
 * @property {string} nickname
 * @property {string} status
 * @property {string} [reason]
 * @property {SimpleEncounter[]} encounters
 */

/**
 * @typedef {Object} PokemonTypeSlot
 * @property {number} slot
 * @property {{ name: string, url: string }} type
 * 
 */

/**
 * @typedef {Object} PokemonSprites
 * @property {string|null} front_default
 * @property {string|null} front_shiny 
 * @property {string|null} front_female 
 * @property {string|null} front_shiny_female
 * @property {string|null} back_default
 * @property {string|null} back_shiny 
 */

/**
 * @typedef {Object} Pokemon
 * @property {number} id
 * @property {string} name
 * @property {PokemonTypeSlot[]} types
 * @property {PokemonSprites} sprites 
 * @property {number} height
 * @property {number} weight
 * @property {{ base_stat: number, stat: { name: string } }[]} stats
 */

/**
 * @typedef {Object} PokemonBulk
 * @property {string} name
 * @property {string} url
 */
