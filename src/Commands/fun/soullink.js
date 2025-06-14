import {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AttachmentBuilder,
} from 'discord.js';
import path from "path";
import { getNextEvolution } from '../../Lib/pokemon.js';
import { capitalize } from '../../Lib/utils.js';
import { saveRun, loadRun } from '../../Lib/files.js';
import { generateBoxImageFromGroups } from '../../Lib/image.js';

const SOULLINK = {
  NAME: "soullink",
  SUBCOMMAND_GROUPS: {
    RUN: "run",
    EDIT: "actions",
    INFO: "info",
    UI: "ui",
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
  INFO_SUBCOMMANDS: {
    SHOW: "view",
    LIST: "all",
    POKEMON: "pokemon",
    ROUTE: "route",
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
    .addSubcommand((sub) =>
      sub
        .setName(SOULLINK.SUBCOMMAND_GROUPS.UI)
        .setDescription("Open an interactive UI to apply all actions.")
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
              opt
                .setName("location")
                .setDescription("Location info")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("pokemon")
                .setDescription("Encountered Pokémon")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addBooleanOption((opt) =>
              opt
                .setName("captured")
                .setDescription("Captured or not")
                .setRequired(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("nickname")
                .setDescription("Encounter nickname, required if captured.")
                .setRequired(false)
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
              opt
                .setName("location")
                .setDescription("The location where you moved the pokemon (where you are right now).")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("nickname")
                .setDescription("The pokemon to be moved.")
                .setRequired(true)
                .setAutocomplete(true)
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
              opt
                .setName("reason")
                .setDescription("Reason for moving (required for defeated)")
                .setRequired(false)
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
              opt
                .setName("location")
                .setDescription("Location where the Pokémon has evolved")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption((opt) =>
              opt
                .setName("nickname")
                .setDescription("The nickname of the pokemon you want to evolve")
                .setRequired(true)
                .setAutocomplete(true)
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
        .setName(SOULLINK.SUBCOMMAND_GROUPS.INFO)
        .setDescription("View run overview")
        .addSubcommand((sub) =>
          sub
            .setName(SOULLINK.INFO_SUBCOMMANDS.SHOW)
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
            .setName(SOULLINK.INFO_SUBCOMMANDS.LIST)
            .setDescription("List all soullink runs")
        )
        .addSubcommand(sub =>
          sub
            .setName(SOULLINK.INFO_SUBCOMMANDS.ROUTE)
            .setDescription("View all encounters from a route")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Run name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption(opt =>
              opt
                .setName("location")
                .setDescription("The route/location").setRequired(true)
            )
        )
        .addSubcommand(sub =>
          sub
            .setName(SOULLINK.INFO_SUBCOMMANDS.POKEMON)
            .setDescription("Get info on a specific Pokémon")
            .addStringOption((opt) =>
              opt
                .setName("runname")
                .setDescription("Run name")
                .setRequired(true)
                .setAutocomplete(true)
            )
            .addStringOption(opt =>
              opt.setName("nickname").setDescription("Pokémon nickname").setRequired(true)
            )
        )
    ),

  cooldown: 1000,
  adminOnly: false,
  async prefixRun(client, message, args) {
    message.reply("Use the slash command");
  },

  /**
   * @param {CommandInteraction} interaction
   */
  async slashRun(client, interaction) {
    const group = interaction.options.getSubcommandGroup(false);
    const sub = interaction.options.getSubcommand();

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

      case SOULLINK.SUBCOMMAND_GROUPS.INFO:
        if (sub === SOULLINK.INFO_SUBCOMMANDS.SHOW)
          return await handleOverview(interaction);

        if (sub === SOULLINK.INFO_SUBCOMMANDS.LIST)
          return await handleListRuns(interaction);

        if (sub === SOULLINK.INFO_SUBCOMMANDS.ROUTE)
          return await handleViewRoute(interaction);

        if (sub === SOULLINK.INFO_SUBCOMMANDS.POKEMON)
          return await handleViewPokemon(interaction);

      default:
        if (sub === SOULLINK.SUBCOMMAND_GROUPS.UI) {
          return await handleUI(interaction)
        }

        const unknownEmbed = new EmbedBuilder()
          .setColor("Red")
          .setDescription("❌ Unknown command group or subcommand.");
        return await interaction.reply({ embeds: [unknownEmbed], flags: "Ephemeral" });
    }
  },
};


/**
 * @param {CommandInteraction} interaction
 */
async function handleUI(interaction) {
  const runName = "Hello";
  const userId = interaction.user.id;

  // Fake data — in real use, you'd pull from a DB
  const fakePlayerData = {
    team: ['Charmander', 'Pidgey', 'Rattata'],
  };

  const embed = new EmbedBuilder()
    .setTitle(`Your Team in "${runName}"`)
    .setDescription(fakePlayerData.team.join('\n'))
    .setColor(0x00AE86);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`soullink_${SOULLINK.EDIT_SUBCOMMANDS.ADD}_${runName}`)
      .setLabel('Add Encounter')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`soullink_${SOULLINK.EDIT_SUBCOMMANDS.MOVE}_${runName}`)
      .setLabel('Move Pokémon')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`soullink_${SOULLINK.EDIT_SUBCOMMANDS.EVOLVE}_${runName}`)
      .setLabel('Evolve Pokémon')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.reply({ embeds: [embed], components: [row], flags: "Ephemeral" });
}

/**
 * @param {CommandInteraction} interaction
 */
export async function soullinkHandleButton(interaction) {
  const buttonMetaData = interaction.customId.split('_');
  const action = buttonMetaData[1];

  switch (action) {
    case SOULLINK.EDIT_SUBCOMMANDS.ADD:
      return await handleAddEncounterButton(interaction);

    case SOULLINK.EDIT_SUBCOMMANDS.MOVE:
      return;

    case SOULLINK.EDIT_SUBCOMMANDS.EVOLVE:
      return;

    default:
      break;
  }
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleAddEncounterButton(interaction) {
  const buttonMetaData = interaction.customId.split('_');
  const action = buttonMetaData[1];

  const modal = new ModalBuilder()
    .setCustomId('add_encounter_modal')
    .setTitle('Add a New Encounter');

  const pokemonName = new TextInputBuilder()
    .setCustomId('pokemon_name')
    .setLabel('Pokémon Name')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const location = new TextInputBuilder()
    .setCustomId('location')
    .setLabel('Encounter Location')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row1 = new ActionRowBuilder().addComponents(pokemonName);
  const row2 = new ActionRowBuilder().addComponents(location);

  modal.addComponents(row1, row2);

  await interaction.showModal(modal);
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
    history: [],
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
    encounter.history.push({
      type: "location",
      oldValue: encounter.status,
      newValue: to,
      location: location,
      createdOn: Date.now()
    })

    encounter.status = to;
    encounter.reason = to === "defeated" ? reason : "";
  }

  await saveRun(run.runname, run);

  const successEmbed = new EmbedBuilder()
    .setColor("Green")
    .setTitle("Encounter(s) Updated")
    .setDescription(`✅ Moved ${encounters.length} encounter(s) at **${location}** to **${capitalize(to)}**${to === "defeated" && reason ? ` with reason: _${reason}_` : ""}.`)
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
  const nickname = interaction.options.getString("nickname");
  let newSpecies = interaction.options.getString("pokemon");
  const player = interaction.user.globalName;

  const encounter = run.encounters.find(
    (e) => e.nickname === nickname && e.playerId === interaction.user.id
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
  if (!newSpecies) {
    newSpecies = await getNextEvolution(oldSpecies);
    if (!newSpecies) {
      return await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(`❌ Couldn't auto evolve **${capitalize(oldSpecies)}**. Please manually provide a pokemon.`),
        ],
        flags: "Ephemeral",
      });
    }
  }
  encounter.pokemon = newSpecies;
  encounter.history.push({
    type: "pokemon",
    oldValue: oldSpecies,
    newValue: newSpecies,
    location: location,
    createdOn: Date.now(),
  })

  await saveRun(run.runname, run);

  return await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Green")
        .setTitle("✨ Evolution Successful")
        .setDescription(`✅ **${encounter.nickname}** (${capitalize(oldSpecies)}) has evolved into **${capitalize(newSpecies)}** for **${player}** on location **${location}**.`)
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
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`ℹ️ No encounters found${filterType ? ` in **${capitalize(filterType)}**` : ""} for run **${runname}**.`)],
    });
  }

  await interaction.deferReply();

  const groupedByLocation = {};
  for (const e of encounters) {
    if (!groupedByLocation[e.location]) {
      groupedByLocation[e.location] = {
        location: e.location,
        status: e.status,
        reason: e.reason,
        nickname: e.nickname,
        encounters: [],
      };
    }
    groupedByLocation[e.location].encounters.push({
      id: e.id,
      player: e.playerName,
      pokemon: e.pokemon,
      captured: e.captured,
    });
  }

  const titles = {
    box: "📦 Pokémon in the box",
    team: "🧢 Pokémon on the team",
    defeated: "💀 Defeated Pokémon",
    missed: "❌ Missed encounters",
  };
  const colors = {
    box: "Blue",
    team: "Red",
    defeated: "Grey",
    missed: "DarkerGrey",
  };
  const statusesToShow = filterType ? [filterType] : SOULLINK.ALL_TYPES;
  const groupedByStatus = { box: [], team: [], defeated: [], missed: [] };
  for (const e of Object.values(groupedByLocation)) {
    groupedByStatus[e.status].push(e);
  }

  const embeds = [];
  const attachments = [];

  let id = 1;
  for (const status of statusesToShow) {
    const encounters = groupedByStatus[status];
    const tempId = id++;

    if (encounters.length == 0) continue;

    // Generate image buffer
    let imageBuffer;
    try {
      imageBuffer = await generateBoxImageFromGroups(encounters);
    } catch (error) {
      await interaction.editReply({
        content: `I got an error :(`
      });
    }

    // Create attachment
    const attachment = new AttachmentBuilder(imageBuffer, { name: `img${tempId}.png` });

    // Embed referencing the attachment
    const embed = new EmbedBuilder()
      .setTitle(titles[status])
      .setColor(colors[status])
      .setImage(`attachment://img${tempId}.png`);

    embeds.push(embed);
    attachments.push(attachment);
  }

  await interaction.editReply({
    embeds: embeds,
    files: attachments
  });
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
      const nameTxt = run.started
        ? `${run.runname} - Started on ${(new Date(run.startedOn)).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}`
        : `${run.runname} - Run has not started.`
      embed.addFields({
        name: nameTxt,
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
 * @param {Encounter} encounter
 * @returns {string}
 */
function formatEncounter(encounter) {
  const {
    location,
    status,
    reason,
    playerId,
    playerName,
    pokemon,
    nickname,
    captured,
    history } = encounter;

  const lines = [];

  lines.push(`${nickname} (${capitalize(pokemon)})`);
  lines.push(``);
  lines.push(`**History**`);
  const emoji = { box: "📦", team: "🧢", defeated: "💀", missed: "❌" }

  for (const hist of history) {
    const date = new Date(hist.createdOn).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
    const text = hist.type == "location"
      ? `${emoji[hist.oldValue]} ➡️ ${emoji[hist.newValue]} Moved to ${capitalize(hist.newValue)} (${hist.location} on ${date})`
      : `✨ ➡️ Evolved into ${capitalize(hist.newValue)} (${hist.location} on ${date})`
    lines.push(text);
  }


  return lines.join("\n")
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleViewRoute(interaction) {
  const runname = interaction.options.getString("runname");
  const location = interaction.options.getString("location");

  const run = await loadRun(runname);
  if (!run) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Run '${runname}' not found.`)],
      flags: "Ephemeral",
    });
  }

  const routeEncounters = run.encounters.filter(e => e.location.toLowerCase() === location.toLowerCase());

  if (routeEncounters.length === 0) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Yellow").setDescription(`ℹ️ No encounters found for run **${runname}**.`)],
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🧭 Route Overview: ${location}`)
    .setDescription(`${routeEncounters.length} encounter(s) found.`)
    .setColor("Green");

  for (const enc of routeEncounters) {
    embed.addFields({
      name: `${enc.playerName}'s Pokemon`,
      value: formatEncounter(enc),
      inline: true
    });
  }

  return interaction.reply({ embeds: [embed] });
}

/**
 * @param {CommandInteraction} interaction
 */
async function handleViewPokemon(interaction) {
  const runname = interaction.options.getString("runname");
  const nickname = interaction.options.getString("nickname");

  const run = await loadRun(runname);
  if (!run) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ Run '${runname}' not found.`)],
      flags: "Ephemeral",
    });
  }

  const match = run.encounters.find(e => e.nickname?.toLowerCase() === nickname.toLowerCase());

  if (!match) {
    return interaction.reply({ content: `❌ No Pokémon found with nickname **${nickname}**.`, flags: "Ephemeral" });
  }

  const embed = new EmbedBuilder()
    .setTitle(`🔍 Pokémon Overview: ${match.nickname}`)
    .setColor("Blue")
    .setDescription(formatEncounter(match));

  return interaction.reply({ embeds: [embed] });
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

  /** @type {Run} */
  const run = {
    runname,
    players: [{
      id: interaction.user.id,
      username: interaction.user.globalName
    }],
    encounters: [],
    encounterCounter: 1,
    started: false,
  };

  await saveRun(runname, run);

  return await interaction.reply({
    embeds: [new EmbedBuilder().setColor("Green").setDescription(`✅ Run '${runname}' created. Others can now join.`)],
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
