import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import fs from "fs/promises";
import path from "path";
import config from '../../Base/config.js';
import { getNextEvolution } from '../../Lib/pokemon.js';

const SOULLINK = {
  NAME: "soullink",
  SUBCOMMAND_GROUPS: {
    RUN: "run",
    EDIT: "actions",
    OVERVIEW: "overview",
  },
  RUN_SUBCOMMANDS: {
    CREATE: "create",
    JOIN: "join",
    START: "start",
  },
  EDIT_SUBCOMMANDS: {
    ADD: "encounter",
    MOVE: "move",
    EVOLVE: "evolve",
  },
  OVERVIEW_SUBCOMMANDS: {
    SHOW: "view",
    LIST: "all",
  },
  MOVE_TO_TYPES: ["box", "team", "defeated"],
  ALL_TYPES: ["box", "team", "defeated", "missed"],
};

export const commandBase = {
  prefixData: {
    name: "soullink",
    aliases: [],
  },
  slashData: new SlashCommandBuilder()
    .setName(SOULLINK.NAME)
    .setDescription("Pokemon Soullink!")
    .addSubcommandGroup((group) =>
      group
        .setName(SOULLINK.SUBCOMMAND_GROUPS.RUN)
        .setDescription("Run-related commands")
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.RUN_SUBCOMMANDS.CREATE)
            .setDescription("Create a new soullink run")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Name of the run")
                .setRequired(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.RUN_SUBCOMMANDS.JOIN)
            .setDescription("Join an open soullink run")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Name of the run")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.RUN_SUBCOMMANDS.START)
            .setDescription("Start the run and lock further joins")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Name of the run")
                .setRequired(true)
                .setAutocomplete(true)
            )
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName(SOULLINK.SUBCOMMAND_GROUPS.EDIT)
        .setDescription("Encounter-related commands")
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.EDIT_SUBCOMMANDS.ADD)
            .setDescription("Add an encounter to a run")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Run name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt.setName("location").setDescription("Location info").setRequired(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("pokemon")
                .setDescription("Encountered Pokémon")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addBooleanOption((opt) =>
              opt.setName("captured").setDescription("Captured or not").setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("nickname").setDescription("Encounter nickname").setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.EDIT_SUBCOMMANDS.MOVE)
            .setDescription("Move encounter")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Run name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt.setName("location").setDescription("The location where you caught this encounter.").setRequired(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("to")
                .setDescription("Where to move it")
                .addChoices(
                  { name: "box", value: "box" },
                  { name: "team", value: "team" },
                  { name: "defeated", value: "defeated" }
                )
                .setRequired(true)
            )
            .addStringOption((opt) =>
              opt.setName("reason").setDescription("Reason for moving (for defeated)").setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.EDIT_SUBCOMMANDS.EVOLVE)
            .setDescription("Evolve a Pokémon in a run")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Run name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt.setName("location").setDescription("Location where the Pokémon has evolved").setRequired(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("pokemon")
                .setDescription("The new Pokemon")
                .setRequired(false)
                .setAutocomplete(true)
            )
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName(SOULLINK.SUBCOMMAND_GROUPS.OVERVIEW)
        .setDescription("View run overview")
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.OVERVIEW_SUBCOMMANDS.SHOW)
            .setDescription("Show overview of a run")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Run name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("type")
                .setDescription("Filter by type")
                .addChoices(
                  { name: "box", value: "box" },
                  { name: "team", value: "team" },
                  { name: "defeated", value: "defeated" }
                )
                .setRequired(false)
            )
        )
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.OVERVIEW_SUBCOMMANDS.LIST)
            .setDescription("List all soullink runs")
        )
    ),

  cooldown: 1000,
  ownerOnly: false,
  async prefixRun(client, message, args) {
    message.reply("Use the slash command");
  },

  /**
   * @param {CommandInteraction} interaction
   */
  async slashRun(client, interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

    if (!group) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription("❌ Please specify a subcommand group.");
      return await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
    }

    switch (group) {
      case SOULLINK.SUBCOMMAND_GROUPS.RUN:
        if (sub === SOULLINK.RUN_SUBCOMMANDS.START) {
          const runname = interaction.options.getString("runname");
          const run = await requireAuthorizedPlayer(runname, interaction, true);
          if (!run) return;

          return await handleStartRun(interaction, run);
        }

        if (sub === SOULLINK.RUN_SUBCOMMANDS.JOIN)
          return await handleJoinRun(interaction);

        if (sub === SOULLINK.RUN_SUBCOMMANDS.CREATE)
          return await handleCreateRun(interaction);

      case SOULLINK.SUBCOMMAND_GROUPS.EDIT:
        const runname = interaction.options.getString("runname");
        const run = await requireAuthorizedPlayer(runname, interaction);
        if (!run) return;

        if (sub === SOULLINK.EDIT_SUBCOMMANDS.ADD)
          return await handleAddEncounter(interaction, run);

        if (sub === SOULLINK.EDIT_SUBCOMMANDS.MOVE)
          return await handleMoveEncounter(interaction, run);

        if (sub === SOULLINK.EDIT_SUBCOMMANDS.EVOLVE)
          return await handleEvolveEncounter(interaction, run);

      case SOULLINK.SUBCOMMAND_GROUPS.MOVE:

      case SOULLINK.SUBCOMMAND_GROUPS.OVERVIEW:
        if (sub === SOULLINK.OVERVIEW_SUBCOMMANDS.SHOW)
          return await handleOverview(interaction);

        if (sub === SOULLINK.OVERVIEW_SUBCOMMANDS.LIST)
          return await handleListRuns(interaction);

      default:
        const unknownEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("❌ Unknown command group or subcommand.");
        return await interaction.reply({ embeds: [unknownEmbed], flags: "Ephemeral" });
    }
  },
};


/**
 * @typedef {Object} Player
 * @property {string} id - Discord user ID
 * @property {string} username - Discord username
 */

/**
 * @typedef {Object} pokemonHistory
 * @property {string} pokemon
 * @property {string} location
 */

/**
 * @typedef {Object} statusHistory
 * @property {string} status
 * @property {string} location
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
 * @property {pokemonHistory[]} pokemonHistory
 * @property {pokemonHistory[]} statusHistory
 */

/**
 * @typedef {Object} Run
 * @property {string} runname
 * @property {boolean} started
 * @property {number} startedOn
 * @property {Player[]} players
 * @property {Encounter[]} encounters
 * @property {number} encounterCounter
 */


async function ensureDataDir() {
  try {
    await fs.mkdir(config.soullinkDataDir, { recursive: true });
  } catch {
    // ignore errors
  }
}

function getRunFilePath(runname) {
  return path.join(config.soullinkDataDir, `${runname}.json`);
}

/**
 * @param {string} runname
 * @returns {Promise<Run>}
 */
async function loadRun(runname) {
  const file = getRunFilePath(runname);
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveRun(runname, data) {
  await ensureDataDir();
  const file = getRunFilePath(runname);
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

/**
 * @param {CommandInteraction} interaction
 * @param {Run} run
 */
async function handleAddEncounter(interaction, run) {
  if (!run.started) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`ℹ️ Run '${run.runname}' has not yet started.`)],
      flags: "Ephemeral",
    });
  }

  const location = interaction.options.getString("location");
  const pokemon = interaction.options.getString("pokemon");
  const captured = interaction.options.getBoolean("captured");
  const nickname = interaction.options.getString("nickname") || "";
  const player = interaction.user.globalName;

  if (captured && !nickname) {
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`❌ Must include nickname.`);
    return await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
  }

  const exists = run.encounters.find(
    (e) => e.location === location && e.playerId === interaction.user.id
  );

  if (exists) {
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`❌ You already have an encounter here.`);
    return await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
  }

  /** @type {Encounter} */
  const encounter = {
    id: run.encounterCounter++,
    playerId: interaction.user.id,
    playerName: player,
    location: location,
    status: "box",
    reason: "",
    pokemon: pokemon,
    captured: captured,
    nickname: nickname,
    pokemonHistory: [],
    statusHistory: [],
  }

  run.encounters.push(encounter);
  await saveRun(run.runname, run);

  const successEmbed = new EmbedBuilder()
    .setColor("Blue")
    .setTitle("Encounter Added")
    .setDescription(`✅ Added encounter for **${player}** to run **${run.runname}** on location **${location}**.`)
    .addFields(
      { name: "Pokémon", value: String(pokemon), inline: true },
      { name: "Nickname", value: nickname ? String(nickname) : "_None_", inline: true },
      { name: "Captured", value: String(captured), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [successEmbed] });
}

/**
 * @param {CommandInteraction} interaction
 * @param {Run} run
 */
async function handleMoveEncounter(interaction, run) {
  if (!run.started) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`ℹ️ Run '${run.runname}' has not yet started.`)],
      flags: "Ephemeral",
    });
  }

  const location = interaction.options.getString("location");
  const to = interaction.options.getString("to");
  const reason = interaction.options.getString("reason") || "";

  if (!SOULLINK.MOVE_TO_TYPES.includes(to)) {
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`❌ Invalid destination. Must be one of: ${SOULLINK.MOVE_TO_TYPES.join(", ")}.`);
    return await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
  }

  const encounters = run.encounters.filter((e) => e.location === location);
  if (encounters.length === 0) {
    const infoEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setDescription(`ℹ️ No encounters found for location **${location}** in run **${run.runname}**.`);
    return await interaction.reply({ embeds: [infoEmbed], flags: "Ephemeral" });
  }

  for (const encounter of encounters) {
    encounter.statusHistory.push({
      status: encounter.status,
      location: location,
    })

    encounter.status = to;
    encounter.reason = to === "defeated" ? reason : "";
  }

  await saveRun(run.runname, run);

  const successEmbed = new EmbedBuilder()
    .setColor(to === "box" ? "Blue" : to === "team" ? "Red" : "Grey")
    .setTitle("Encounter(s) Updated")
    .setDescription(`✅ Moved ${encounters.length} encounter(s) at **${location}** to **${to}**${to === "defeated" && reason ? ` with reason: _${reason}_` : ""}.`)
    .setTimestamp();

  return await interaction.reply({ embeds: [successEmbed] });
}

/**
 * @param {CommandInteraction} interaction
 * @param {Run} run
 */
async function handleEvolveEncounter(interaction, run) {
  if (!run.started) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`ℹ️ Run '${run.runname}' has not yet started.`)],
      flags: "Ephemeral",
    });
  }

  const location = interaction.options.getString("location");
  let newSpecies = interaction.options.getString("pokemon");
  const player = interaction.user.globalName;

  const encounter = run.encounters.find(
    (e) => e.location === location && e.playerId === interaction.user.id
  );

  if (!encounter) {
    return await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setDescription(`❌ No encounter found for **${player}** on location **${location}**.`),
      ],
      flags: "Ephemeral",
    });
  }

  const oldSpecies = encounter.pokemon;
  encounter.pokemonHistory.push({
    pokemon: oldSpecies,
    location: location,
  })
  if (!newSpecies) {
    newSpecies = await getNextEvolution(oldSpecies);
    if (!newSpecies) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`❌ Couldn't auto evolve **${oldSpecies}**. Please manually provide a pokemon.`),
        ],
        flags: "Ephemeral",
      });
    }
  }
  encounter.pokemon = newSpecies;

  await saveRun(run.runname, run);

  return await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setTitle("✨ Evolution Successful")
        .setDescription(`✅ **${oldSpecies}** has evolved into **${newSpecies}** for **${player}** on location **${location}**.`)
        .setTimestamp(),
    ],
  });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleOverview(interaction) {
  const runname = interaction.options.getString("runname");
  const filterType = interaction.options.getString("type");

  const run = await loadRun(runname);
  if (!run) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Run '${runname}' not found.`)],
      flags: "Ephemeral",
    });
  }

  let encounters = run.encounters;
  if (filterType) {
    if (!SOULLINK.MOVE_TO_TYPES.includes(filterType)) {
      return await interaction.reply({
        embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Invalid type filter. Must be one of: \`${SOULLINK.MOVE_TO_TYPES.join(", ")}\`.`)],
        flags: "Ephemeral",
      });
    }
    encounters = encounters.filter((e) => e.status === filterType);
  }

  if (encounters.length === 0) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`ℹ️ No encounters found${filterType ? ` in **${filterType}**` : ""} for run **${runname}**.`)],
    });
  }

  /**
   * @typedef {Object} SimpleEncounter
   * @property {string} id
   * @property {string} player
   * @property {string} pokemon
   * @property {boolean} captured
   * @property {string} [nickname]
   */

  /**
   * @typedef {Object} GroupedEncounter
   * @property {string} location
   * @property {string} status
   * @property {string} [reason]
   * @property {SimpleEncounter[]} encounters
   */

  /** @type {{ [key: string]: GroupedEncounter }} */
  const groupedByLocation = {};
  for (const e of encounters) {
    if (groupedByLocation[e.location]) {
      groupedByLocation[e.location].encounters.push({
        id: e.id,
        player: e.playerName,
        pokemon: e.pokemon,
        captured: e.captured,
        nickname: e.nickname
      })
      continue;
    }

    const encounter = {
      location: e.location,
      status: e.status,
      reason: e.reason,
      encounters: [
        {
          id: e.id,
          player: e.playerName,
          pokemon: e.pokemon,
          captured: e.captured,
          nickname: e.nickname
        }
      ],

    }
    groupedByLocation[e.location] = encounter;
  }

  // Format output nicely
  /** @type {{ box: GroupedEncounter[], team: GroupedEncounter[], defeated: GroupedEncounter[], missed: GroupedEncounter[], }} */
  const groupedByStatus = { box: [], team: [], defeated: [], missed: [] };
  for (const [_, e] of Object.entries(groupedByLocation)) {
    groupedByStatus[e.status].push(e);
  }

  const pkmnNameLen = Math.max(...run.encounters.map(enc => enc.pokemon.length));
  const pkmnNickLen = Math.max(...run.encounters.map(enc => enc.nickname.length));

  const titles = { box: "📦 Pokémon in the box", team: "🧢 Pokemon on the team", defeated: "💀 Defeated Pokémon", missed: "❌ Missed encounters" }
  const colors = { box: "Blue", team: "Red", defeated: "Grey", missed: "DarkerGrey" }
  const embeds = [];

  // Build embed(s)
  embeds.push(new EmbedBuilder()
    .setTitle(`📜 Soullink Overview: ${runname}`)
    .setColor("DarkGold"));

  /** @type {"box" | "team" | "defeated" | "missed"} */
  const statusesToShow = filterType ? [filterType] : SOULLINK.ALL_TYPES;
  const players = run.players.map(p => p.username);

  for (const status of statusesToShow) {
    /** @type {GroupedEncounter[]} */
    const locations = groupedByStatus[status];
    if (locations.length === 0) continue;

    const embed = new EmbedBuilder()
      .setTitle(titles[status])
      .setColor(colors[status])
    const lines = [];

    players.forEach(player => {
      lines.push(`[ ${player.padEnd(pkmnNameLen + pkmnNickLen + 3)} ]`)
    });

    embed.addFields({
      name: `Players`,
      value: `\`${lines.join(" - ")}\``,
      inline: false,
    });

    for (const locationGroup of locations) {
      const lines = [];

      players.forEach(player => {
        const pkmn = locationGroup.encounters.find(enc => enc.player == player);

        if (!pkmn) {
          lines.push(`[ ${'Pokemon not found.'.padEnd(pkmnNameLen + pkmnNickLen + 3)} ]`)
          return;
        }

        lines.push(`[ ${pkmn.nickname.padEnd(pkmnNickLen)} ${`(${pkmn.pokemon})`.padEnd(pkmnNameLen + 2)} ]`)
      });

      embed.addFields({
        name: `📍 ${locationGroup.location}${locationGroup.status === "defeated" ? ` - ${locationGroup.reason}` : ''}`,
        value: `\`${lines.join(" - ")}\``,
        inline: false,
      });
    }

    embeds.push(embed)
  }

  embeds.push(new EmbedBuilder()
    .setColor("DarkGold")
    .setTimestamp()
    .setFooter({ text: "Soullink overview powered by your BananenMan" }));

  return await interaction.reply({ embeds: embeds });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleListRuns(interaction) {
  try {
    await ensureDataDir();
    const files = await fs.readdir(config.soullinkDataDir);
    const runFiles = files.filter(f => f.endsWith(".json"));

    if (runFiles.length === 0) {
      const noRunsEmbed = new EmbedBuilder()
        .setColor("Yellow")
        .setDescription("ℹ️ No soullink runs found.");
      return await interaction.reply({ embeds: [noRunsEmbed] });
    }

    /** @type {Run[]} */
    const runs = [];
    for (const file of runFiles) {
      const runname = path.basename(file, ".json");
      const run = await loadRun(runname);
      if (run) {
        runs.push(run);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle("📋 All Soullink Runs")
      .setColor("Blue")
      .setDescription(`Found **${runs.length}** run(s):`)
      .setTimestamp();


    for (const run of runs) {
      embed.addFields({
        name: `${run.runname} - Started on ${(new Date(run.startedOn)).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })
          }`,
        value: `Players: ${run.players.map(p => p.username).join(", ")}`,
        inline: false,
      });
    }

    return await interaction.reply({ embeds: [embed] });
  } catch (err) {
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`❌ Error loading runs: ${err.message}`);
    return await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
  }
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleCreateRun(interaction) {
  const runname = interaction.options.getString("runname");
  const existing = await loadRun(runname);

  if (existing) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Run '${runname}' already exists.`)],
      flags: "Ephemeral",
    });
  }

  const run = {
    runname,
    players: [],
    encounters: [],
    encounterCounter: 1,
    started: false,
  };

  await saveRun(runname, run);

  return await interaction.reply({
    embeds: [new EmbedBuilder().setColor("Green").setDescription(`✅ Run '${runname}' created.Others can now join.`)],
  });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleJoinRun(interaction) {
  const runname = interaction.options.getString("runname");
  const run = await loadRun(runname);

  if (!run) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Run '${runname}' does not exist.`)],
      flags: "Ephemeral",
    });
  }

  if (run.started) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`🚫 Run '${runname}' has already started.`)],
      flags: "Ephemeral",
    });
  }

  const userId = interaction.user.id;
  const username = interaction.user.globalName;

  if (run.players.find((p) => p.id === userId)) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`ℹ️ You already joined '${runname}'.`)],
      flags: "Ephemeral",
    });
  }

  run.players.push({ id: userId, username });
  await saveRun(runname, run);

  return await interaction.reply({
    embeds: [new EmbedBuilder().setColor("Green").setDescription(`✅ You joined '${runname}' as ${username}.`)],
  });
}

/**
 * @param {CommandInteraction} interaction
 * @param {Run} run
 */
async function handleStartRun(interaction, run) {
  if (run.started) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`ℹ️ Run '${run.runname}' is already started.`)],
      flags: "Ephemeral",
    });
  }

  if (run.players.length === 0) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Cannot start.No players joined yet.`)],
      flags: "Ephemeral",
    });
  }

  run.started = true;
  run.startedOn = Date.now();
  await saveRun(run.runname, run);

  return await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setTitle(`🚀 Run '${run.runname}' Started!`)
        .setDescription("No more players can join.")
        .addFields({
          name: "Players",
          value: run.players.map((p) => p.username).join(", "),
        }),
    ],
  });
}

/**
 * @param {string} runname
 * @param {CommandInteraction} interaction
 * @param {boolean} bypassNotStarted
 */
async function requireAuthorizedPlayer(runname, interaction, bypassNotStarted = false) {
  const run = await loadRun(runname);
  const userId = interaction.user.id;

  if (!run) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Run '${runname}' does not exist.`)],
      flags: "Ephemeral",
    });
    return null;
  }

  if (!run.started && !bypassNotStarted) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`🚫 Run '${runname}' hasn't started yet.`)],
      flags: "Ephemeral",
    });
    return null;
  }

  const isPlayer = run.players.some((p) => p.id === userId);
  if (!isPlayer) {
    await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ You are not a participant in '${runname}'.`)],
      flags: "Ephemeral",
    });
    return null;
  }

  return run;
}
