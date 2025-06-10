import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponseType
} from "discord.js";

export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all commands or get info about a specific command")
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to get help with")
        .setRequired(false)
        .setAutocomplete(true)
    ),

  /**
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async slashRun(client, interaction) {
    const commandName = interaction.options.getString("command");

    const getSubcommands = (data) => {
      const subs = [];
      for (const option of data.options ?? []) {
        if (option.type === 1) {
          // Subcommand
          subs.push({
            name: option.name,
            description: option.description ?? "No description",
          });
        } else if (option.type === 2) {
          // Subcommand group
          for (const sub of option.options ?? []) {
            subs.push({
              name: `${option.name} ${sub.name}`,
              description: sub.description ?? "No description",
            });
          }
        }
      }
      return subs;
    };

    // If specific command requested
    if (commandName) {
      const command =
        client.slashCommands.get(commandName) ||
        client.commands.get(commandName) ||
        client.commands.get(client.commandAliases.get(commandName));

      if (!command) {
        return interaction.reply({
          content: `❌ Command \`${commandName}\` not found.`,
          flags: "Ephemeral",
        });
      }

      const name = command.slashData?.name || command.prefixData?.name || commandName;
      const description = command.slashData?.description || command.prefixData?.description;
      const aliases = command.prefixData?.aliases?.join(", ") || "None";

      const subcommands = getSubcommands(command.slashData?.toJSON?.());

      const embed = new EmbedBuilder()
        .setTitle(`Help: /${name}`)
        .addFields(
          { name: "Description", value: description || "No description" },
          { name: "Aliases", value: aliases }
        )
        .setColor("Blue");

      if (subcommands.length) {
        embed.addFields({
          name: "Subcommands",
          value: subcommands.map((s) => `• \`${s.name}\` — ${s.description}`).join("\n"),
        });
      }

      return interaction.reply({ embeds: [embed], flags: "Ephemeral" });
    }

    // Otherwise, list all commands
    const allCommands = [...client.slashCommands.values()]
      .map((cmd) => {
        const json = cmd.slashData?.toJSON?.() ?? {};
        const subs = getSubcommands(json);
        return {
          name: `/${json.name}${subs.length ? ` (+${subs.length})` : ""}`,
          description: json.description || "No description",
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const commandsPerPage = 5;
    const totalPages = Math.ceil(allCommands.length / commandsPerPage);
    let currentPage = 0;

    const generateEmbed = (page) => {
      const embed = new EmbedBuilder()
        .setTitle("📘 Help Menu")
        .setDescription(
          `Use \`/help <command>\` for more info.\nPage ${page + 1} of ${totalPages}`
        )
        .setColor("Blue");

      const start = page * commandsPerPage;
      const pageCommands = allCommands.slice(start, start + commandsPerPage);

      for (const cmd of pageCommands) {
        embed.addFields({ name: cmd.name, value: cmd.description });
      }

      return embed;
    };

    const getActionRow = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(currentPage === totalPages - 1)
      );

    // You still need to call reply to send the initial message
    // However, the collector is created on the interaction itself for component interactions
    await interaction.reply({
      embeds: [generateEmbed(currentPage)],
      components: [getActionRow()],
      flags: "Ephemeral",
      // No need for type or withResponse here if you're going to create a collector on the interaction
      // If you needed the Message object for other reasons, you could use interaction.fetchReply() AFTER the reply
    });

    // Create the collector on the interaction itself
    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id, // Ensure only the original user can interact
      componentType: ComponentType.Button,
      time: 60_000, // 1 minute
    });

    collector.on("collect", async (i) => {
      if (i.customId === "prev") currentPage--;
      if (i.customId === "next") currentPage++;

      await i.update({
        embeds: [generateEmbed(currentPage)],
        components: [getActionRow()],
      });
    });

    collector.on("end", async () => {
      // Fetch the reply to edit its components after the collector ends
      // This is necessary because interaction.reply() doesn't return the Message object directly for collectors
      const message = await interaction.fetchReply();
      if (message.editable) {
        message.edit({ components: [] }).catch(() => {});
      }
    });
  },
};