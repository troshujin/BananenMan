import { Collection, Events, InteractionType, ChatInputCommandInteraction } from "discord.js";
import config from "../Base/config.js";
import { pokemonNamesAsChoices } from "../Lib/pokemon.js";
import fs from "fs/promises";
import path from "path";
import { loadRun } from "../Commands/fun/soullink.js";

const cooldown = new Collection();

export default {
  name: Events.InteractionCreate,

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (interaction.isAutocomplete()) {
      const focusedOption = interaction.options.getFocused(true); // returns { name, value }
      const query = focusedOption?.value ?? "";

      if (focusedOption.name === "command") {
        const allCommands = [...interaction.client.slashCommands.keys()];
        const filtered = allCommands
          .filter(f => f.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 25);

        await interaction.respond(
          filtered.map(f => ({ name: f, value: f }))
        );
      }

      if (focusedOption.name === "location") {
        const runname = interaction.options.getString("runname")
        if (runname) {
          const run = await loadRun(runname)
          if (run) {
            const choices = [...new Set(run.encounters.map(e => e.location))];
            const filtered = choices
              .filter(f => f.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 25);
  
            await interaction.respond(
              filtered.map(f => ({ name: f, value: f }))
            );
          }
        }
      }

      if (focusedOption.name === "nickname") {
        const runname = interaction.options.getString("runname")
        if (runname) {
          const run = await loadRun(runname)
          if (run) {
            const playerId = interaction.user.id;
            const choices = [...new Set(run.encounters.filter(e => e.playerId == playerId).map(e => e.nickname))];
            const filtered = choices
              .filter(f => f.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 25);
  
            await interaction.respond(
              filtered.map(f => ({ name: f, value: f }))
            );
          }
        }
      }

      if (focusedOption.name === "runname") {
        const files = await fs.readdir(config.soullinkDataDir);
        const choices = files.filter(f => f.endsWith(".json")).map(file => path.basename(file, ".json"));

        const filtered = choices
          .filter(f => f.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 25);

        await interaction.respond(
          filtered.map(f => ({ name: f, value: f }))
        );
      }

      if (focusedOption.name === "pokemon") {
        const choices = await pokemonNamesAsChoices();
        const filtered = choices
          .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 25);

        await interaction.respond(
          filtered.map(p => ({ name: p.name, value: p.name }))
        );
      }
    }

    const { client } = interaction;
    if (interaction.type === InteractionType.ApplicationCommand) {
      if (interaction.user.bot) {
        return;
      }

      try {
        const command = client.slashCommands.get(interaction.commandName);
        if (command) {
          if (
            command.ownerOnly &&
            !config.owners.includes(interaction.user.id)
          ) {
            return interaction.reply({
              content: "Only my **developers** can use this command.",
              flags: "Ephemeral",
            });
          }

          if (command.cooldown) {
            if (cooldown.has(`${command.name}-${interaction.user.id}`)) {
              const nowDate = interaction.createdTimestamp;
              const waitedDate =
                cooldown.get(`${command.name}-${interaction.user.id}`) -
                nowDate;
              return interaction
                .reply({
                  content: `Cooldown is currently active, please try again <t:${Math.floor(
                    new Date(nowDate + waitedDate).getTime() / 1000
                  )}:R>.`,
                  flags: "Ephemeral",
                })
                .then(() =>
                  setTimeout(
                    () => interaction.deleteReply(),
                    cooldown.get(`${command.name}-${interaction.user.id}`) -
                    Date.now() +
                    1000
                  )
                );
            }

            command.slashRun(client, interaction);

            cooldown.set(
              `${command.name}-${interaction.user.id}`,
              Date.now() + command.cooldown
            );

            setTimeout(() => {
              cooldown.delete(`${command.name}-${interaction.user.id}`);
            }, command.cooldown + 1000);
          } else {
            command.slashRun(client, interaction);
          }
        }
      } catch (e) {
        console.error(e);
        interaction.reply({
          content: "An error occurred while executing the command! Please try again.",
          flags: "Ephemeral",
        });
      }
    }
  },
};
