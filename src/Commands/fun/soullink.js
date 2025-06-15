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
import { capitalize } from '../../Lib/utils.js';
import { saveRun, loadRun, getRuns } from '../../Lib/files.js';

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

// End






















// --------------------------------------------------------- //
//     ______                     __   _                     //
//    / ____/__  __ ____   _____ / /_ (_)____   ____   _____ //
//   / /_   / / / // __ \ / ___// __// // __ \ / __ \ / ___/ //
//  / __/  / /_/ // / / // /__ / /_ / // /_/ // / / /(__  )  //
// /_/     \__,_//_/ /_/ \___/ \__//_/ \____//_/ /_//____/   //
//                                                           //
// --------------------------------------------------------- //

// End






















// --------------------------------------------------------- //
//     ______                     __   _                     //
//    / ____/__  __ ____   _____ / /_ (_)____   ____   _____ //
//   / /_   / / / // __ \ / ___// __// // __ \ / __ \ / ___/ //
//  / __/  / /_/ // / / // /__ / /_ / // /_/ // / / /(__  )  //
// /_/     \__,_//_/ /_/ \___/ \__//_/ \____//_/ /_//____/   //
//                                                           //
// --------------------------------------------------------- //

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

// End














// ------------------------ //
//     ______     __ _  __  //
//    / ____/____/ /(_)/ /_ //
//   / __/  / __  // // __/ //
//  / /___ / /_/ // // /_   //
// /_____/ \__,_//_/ \__/   //
//                          //
// ------------------------ //

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

  const usedNicknames = run.encounters.filter((e) => e.nickname === nickname && e.playerId === interaction.user.id);

  if (usedNicknames.length > 0) {
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`❌ Nickname already used.`);
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
  const nickname = interaction.options.getString("nickname");
  const to = interaction.options.getString("to");
  const reason = interaction.options.getString("reason") || "";

  if (!SOULLINK.MOVE_TO_TYPES.includes(to)) {
    const errorEmbed = new EmbedBuilder()
      .setColor("Red")
      .setDescription(`❌ Invalid destination. Must be one of: ${SOULLINK.MOVE_TO_TYPES.join(", ")}.`);
    return await interaction.reply({ embeds: [errorEmbed], flags: "Ephemeral" });
  }

  const encounters = run.encounters.filter((e) => e.nickname === nickname);
  if (encounters.length === 0) {
    const infoEmbed = new EmbedBuilder()
      .setColor("Yellow")
      .setDescription(`ℹ️ No encounters found for nickname **${nickname}** in run **${run.runname}**.`);
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

// End














// ------------------------- //
//     ____        ____      //
//    /  _/____   / __/____  //
//    / / / __ \ / /_ / __ \ //
//  _/ / / / / // __// /_/ / //
// /___//_/ /_//_/   \____/  //
//                           //
// ------------------------- //

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
        content: `I got an error :( ${error}`
      });
      return;
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
    const runFiles = await getRuns();

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

  const encounters = run.encounters.filter(e => e.nickname?.toLowerCase() === nickname.toLowerCase());
  if (encounters.length == 0) {
    return await interaction.reply({
      embeds: [new EmbedBuilder().setColor("Red").setDescription(`❌ No Pokémon found with nickname **${nickname}**.`)],
      flags: "Ephemeral",
    });
  }

  await interaction.deferReply()

  /** @type {GroupedEncounter} */
  let groupedEncounter = {};
  for (const e of encounters) {
    if (!groupedEncounter.location) {
      groupedEncounter = {
        location: e.location,
        status: e.status,
        reason: e.reason,
        nickname: e.nickname,
        encounters: [],
      };
    }
    groupedEncounter.encounters.push({
      id: e.id,
      player: e.playerName,
      pokemon: e.pokemon,
      captured: e.captured,
    });
  }

  // Generate image buffer
  let imageBuffer;
  try {
    imageBuffer = await singlePokemonGroup(groupedEncounter);
  } catch (error) {
    await interaction.editReply({
      content: `I got an error :( ${error}`
    });
    throw error;
  }

  // Create attachment
  const attachment = new AttachmentBuilder(imageBuffer, { name: `img.png` });

  // Embed referencing the attachment
  const embed = new EmbedBuilder()
    .setTitle(`🔍 Pokémon Overview: ${nickname}`)
    .setColor("Blue")
    .setImage(`attachment://img.png`);

  for (const enc of encounters) {
    embed.addFields({
      name: `${enc.playerName}'s Pokemon`,
      value: formatEncounter(enc),
      inline: true
    });
  }

  return interaction.editReply({ embeds: [embed], files: [attachment] });
}

// End














// ---------------------- //
//     ____               //
//    / __ \ __  __ ____  //
//   / /_/ // / / // __ \ //
//  / _, _// /_/ // / / / //
// /_/ |_| \__,_//_/ /_/  //
//                        //
// ---------------------- //

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

// End






















// ------------------------------------------------------------------- //
//     ____          __                                        _       //
//    / __ \ ____   / /__ ___   ____ ___   ____   ____        (_)_____ //
//   / /_/ // __ \ / //_// _ \ / __ `__ \ / __ \ / __ \      / // ___/ //
//  / ____// /_/ // ,<  /  __// / / / / // /_/ // / / /_    / /(__  )  //
// /_/     \____//_/|_| \___//_/ /_/ /_/ \____//_/ /_/(_)__/ //____/   //
//                                                     /___/           //
// ------------------------------------------------------------------- //

import globalState from "../../Base/state.js";

const KEYS = {
  pokemon: "pokemonList",
  data: "pokemonData",
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<Pokemon>}
 */
export async function getPokemonData(pokemonName) {
  /** @type {Pokemon[]} */
  let pokemon = globalState.getState(KEYS.data) ?? [];
  if (pokemon.length == 0) {
    await fetchAllPokemon();
  }

  let pkmnData = pokemon.find(p => p.name == pokemonName);
  if (pkmnData) return pkmnData;

  if (pokemonName.toLowerCase() == "meowstic") {
    pkmnData = {
      id: 678,
      name: "meowstic",
      types: [],
      sprites: { front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/678.png" },
      height: -1,
      weight: -1,
      stats: {},
    }
    return pkmnData
  } else {
    console.log(`[Pokemon] Fetching pokemon data: ${pokemonName}.`)
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!response.ok) throw new Error(`Pokémon ${pokemonName} not found`);
    pkmnData = await response.json();
  }

  pokemon.push(pkmnData);
  globalState.setState(KEYS.data, pokemon);

  return pkmnData;
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<string>}
 */
export async function getPokemonSprite(pokemonName) {
  let pokemon = await getPokemonData(pokemonName)

  return pokemon.sprites.front_default;
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<PokemonBulk[]>}
 */
export async function fetchAllPokemon() {
  let pokemon = globalState.getState(KEYS.pokemon) ?? [];
  if (pokemon.length != 0) return pokemon;

  console.log("[Pokemon] Fetching pokemon.")
  let response;
  try {
    response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0");
  } catch (error) {
    console.error(error)
    return [];
  }
  pokemon = (await response.json()).results;
  globalState.setState(KEYS.pokemon, pokemon);

  return pokemon;
}

/**
 * @returns {Promise<{name: string, value: string}[]>}
 */
export async function pokemonNamesAsChoices() {
  const list = await fetchAllPokemon();
  return list.map(p => ({ name: p.name, value: p.name }));
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<string[]>}
 */
export async function getEvolutionChain(pokemonName) {
  const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
  const speciesData = await speciesRes.json();

  const evoUrl = speciesData.evolution_chain.url;
  const evoRes = await fetch(evoUrl);
  const evoData = await evoRes.json();

  const evolutions = [];
  let current = evoData.chain;

  // Traverse chain
  while (current) {
    evolutions.push(current.species.name);
    current = current.evolves_to?.[0]; // assuming linear evolution
  }

  return evolutions;
}

/**
 * @param {string} pokemonName 
 * @returns {Promise<string?>}
 */
export async function getNextEvolution(pokemonName) {
  const evolutions = await getEvolutionChain(pokemonName);

  const index = evolutions.indexOf(pokemonName);

  if (index < evolutions.length - 1)
    return evolutions[index + 1];
}

// End






















// ----------------------------------------------------- //
//     ____                                     _        //
//    /  _/____ ___   ____ _ ____ _ ___        (_)_____  //
//    / / / __ `__ \ / __ `// __ `// _ \      / // ___/  //
//  _/ / / / / / / // /_/ // /_/ //  __/_    / /(__  )   //
// /___//_/ /_/ /_/ \__,_/ \__, / \___/(_)__/ //____/    //
//                        /____/         /___/           //
// ----------------------------------------------------- //


import { createCanvas, loadImage, registerFont } from 'canvas';

// registerFont('./src/assets/PressStart2p-Regular.ttf', { family: 'PressStart2P' });

/**
 * @param {GroupedEncounter[]} groups
 * @returns {Promise<Buffer>}
 */
async function generateBoxImageFromGroups(groups) {
  const spriteSize = 64;
  const scale = 4;
  const spriteScale = 2;
  const spacing = 10;
  const cols = 4;

  const rows = Math.ceil(groups.length / cols);

  const boxSize = spriteSize * 2.8;
  const canvasWidth = (boxSize * cols + spacing * (cols - 1)) * scale;
  const canvasHeight = (boxSize + spacing) * rows * scale;

  const actualSpriteSize = spriteSize * scale * spriteScale

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0B1A2E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const radius = boxSize;

  const globalRotationDegrees = 150;
  const globalRotationRadians = globalRotationDegrees * (Math.PI / 180);

  ctx.font = `bold ${8 * scale * spriteScale}px 'Courier New'`; // Slightly larger font for the header
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];

    const offsetX = (boxSize + spacing) * (i % cols) * scale;
    const offsetY = (boxSize + spacing) * Math.floor(i / cols) * scale;

    const centerX = boxSize * scale / 2 + offsetX;
    const centerY = boxSize * scale / 2 + offsetY;

    drawPokeball(ctx, { topLeft: [offsetX, offsetY], bottomRight: [offsetX + boxSize * scale, offsetY + boxSize * scale] }, radius * scale * 4 / 5);

    const pokemonCount = group.encounters.length;
    ctx.fillText("#", centerX, centerY)

    if (pokemonCount === 1) {
      const encounter = group.encounters[0];
      const { pokemon } = encounter;

      const spriteUrl = await getPokemonSprite(pokemon);
      const sprite = await loadImage(spriteUrl);

      const spriteX = centerX - (actualSpriteSize) / 2;
      const spriteY = centerY - (actualSpriteSize) / 2;

      ctx.drawImage(sprite, spriteX, spriteY, actualSpriteSize, actualSpriteSize);
    } else if (pokemonCount > 1) {
      const angleStep = (2 * Math.PI) / pokemonCount;
      const spritesToDraw = [];

      for (let j = 0; j < pokemonCount; j++) {
        const encounter = group.encounters[j];
        const { pokemon } = encounter;

        const spriteUrl = await getPokemonSprite(pokemon);
        const sprite = await loadImage(spriteUrl);

        const angle = (j * angleStep) + globalRotationRadians;

        const spriteX = (centerX + radius * Math.cos(angle)) - (actualSpriteSize) / 2;
        const spriteY = (centerY + radius * Math.sin(angle)) - (actualSpriteSize) / 2;

        spritesToDraw.push({
          sprite,
          x: spriteX,
          y: spriteY,
          width: actualSpriteSize,
          height: actualSpriteSize,
        });
      }

      // Draw sprites in order so that lowest Y value is drawn last (on top)
      spritesToDraw.sort((a, b) => a.y - b.y);

      for (const spriteData of spritesToDraw) {
        ctx.drawImage(spriteData.sprite, spriteData.x, spriteData.y, spriteData.width, spriteData.height);
      }
    }
    // Measure actual text width
    const textMetrics = ctx.measureText(group.nickname);
    const textWidth = textMetrics.width;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(group.nickname, centerX - textWidth / 2, offsetY + boxSize * scale);
  }

  return canvas.toBuffer('image/png');
}

/**
 * @param {GroupedEncounter} group
 * @returns {Promise<Buffer>}
 */
async function singlePokemonGroup(group) {
  const boxSize = 64;
  const scale = 4;
  const radius = boxSize;

  const centerX = boxSize * scale / 2;
  const centerY = boxSize * scale / 2;
  
  const actualSpriteSize = boxSize * scale;

  const canvas = createCanvas(boxSize * scale, boxSize * scale);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0B1A2E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawPokeball(ctx, { topLeft: [0, 0], bottomRight: [boxSize * scale, boxSize * scale] }, radius * scale * 4 / 5);

  const pokemonCount = group.encounters.length;
  ctx.fillText("#", centerX, centerY)

  if (pokemonCount === 1) {
    const encounter = group.encounters[0];
    const { pokemon } = encounter;

    const spriteUrl = await getPokemonSprite(pokemon);
    const sprite = await loadImage(spriteUrl);

    const spriteX = centerX - (actualSpriteSize) / 2;
    const spriteY = centerY - (actualSpriteSize) / 2;

    ctx.drawImage(sprite, spriteX, spriteY, actualSpriteSize, actualSpriteSize);
  } else if (pokemonCount > 1) {
    const angleStep = (2 * Math.PI) / pokemonCount;
    const spritesToDraw = [];

    const globalRotationDegrees = 150;
    const globalRotationRadians = globalRotationDegrees * (Math.PI / 180);

    for (let j = 0; j < pokemonCount; j++) {
      const encounter = group.encounters[j];
      const { pokemon } = encounter;

      const spriteUrl = await getPokemonSprite(pokemon);
      const sprite = await loadImage(spriteUrl);

      const angle = (j * angleStep) + globalRotationRadians;

      const spriteX = (centerX + radius * Math.cos(angle)) - (actualSpriteSize) / 2;
      const spriteY = (centerY + radius * Math.sin(angle)) - (actualSpriteSize) / 2;

      spritesToDraw.push({
        sprite,
        x: spriteX,
        y: spriteY,
        width: actualSpriteSize,
        height: actualSpriteSize,
      });
    }

    // Draw sprites in order so that lowest Y value is drawn last (on top)
    spritesToDraw.sort((a, b) => a.y - b.y);

    for (const spriteData of spritesToDraw) {
      ctx.drawImage(spriteData.sprite, spriteData.x, spriteData.y, spriteData.width, spriteData.height);
    }
  }
  // Measure actual text width
  const textMetrics = ctx.measureText(group.nickname);
  const textWidth = textMetrics.width;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(group.nickname, centerX - textWidth / 2, boxSize * scale);

  return canvas.toBuffer('image/png');
}

/**
 * Helper to draw rounded rectangle
 */
/**
 * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
 * @param {{topLeft: [number, number], bottomRight: [number, number]}} pos - X coordinate of the center
 * @param {number} size - Diameter of the large circle
 */
function drawPokeball(ctx, pos, size) {
  const radius = size / 2;

  const bgBlue = '#0B1A2E';
  const blue = "#1E3A5F";

  const centerX = (pos.topLeft[0] + pos.bottomRight[0]) / 2;
  const centerY = (pos.topLeft[1] + pos.bottomRight[1]) / 2;

  const width = pos.bottomRight[0] - pos.topLeft[0];
  const height = pos.bottomRight[1] - pos.topLeft[1];

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = blue;
  ctx.fill();

  ctx.fillStyle = bgBlue;
  ctx.beginPath();
  ctx.rect(pos.topLeft[0], pos.topLeft[1] + height * 9 / 20, width, height * 1 / 10)
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 2 / 5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = bgBlue;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1 / 5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = blue;
  ctx.fill();
}




function drawRuler(ctx, canvasWidth, canvasHeight, options = {}) {
  // drawRuler(ctx, canvas.width, canvas.height, {
  //   spacing: 50,       // Major tick every 50 pixels
  //   minorTickCount: 5, // 4 minor ticks between major ticks (total 5 segments)
  //   lineColor: '#bbb', // Lighter lines
  //   textColor: '#555', // Darker text
  //   font: '12px Arial',
  //   rulerSize: 25      // Slightly thicker ruler
  // });

  const {
    spacing = 50,
    minorTickCount = 5,
    lineColor = '#999',
    textColor = '#333',
    font = '10px Arial',
    rulerSize = 20
  } = options;

  ctx.save(); // Save the current state of the context

  ctx.strokeStyle = lineColor;
  ctx.fillStyle = textColor;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // --- Draw Horizontal Ruler ---
  for (let i = 0; i <= canvasWidth; i += spacing) {
    // Major ticks
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, rulerSize);
    ctx.stroke();

    // Labels
    if (i > 0) { // Don't label 0 twice if drawing vertical ruler too
      ctx.fillText(i.toString(), i, rulerSize / 2);
    }

    // Minor ticks
    for (let j = 1; j < minorTickCount; j++) {
      const minorTickPos = i + (spacing / minorTickCount) * j;
      if (minorTickPos < canvasWidth) {
        ctx.beginPath();
        ctx.moveTo(minorTickPos, 0);
        ctx.lineTo(minorTickPos, rulerSize / 2); // Half length for minor ticks
        ctx.stroke();
      }
    }
  }

  // --- Draw Vertical Ruler ---
  // Adjust text alignment for vertical labels
  ctx.textAlign = 'left';
  for (let i = 0; i <= canvasHeight; i += spacing) {
    // Major ticks
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(rulerSize, i);
    ctx.stroke();

    // Labels
    if (i > 0) {
      ctx.fillText(i.toString(), rulerSize / 2, i);
    }

    for (let j = 1; j < minorTickCount; j++) {
      const minorTickPos = i + (spacing / minorTickCount) * j;
      if (minorTickPos < canvasHeight) {
        ctx.beginPath();
        ctx.moveTo(0, minorTickPos);
        ctx.lineTo(rulerSize / 2, minorTickPos);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}
