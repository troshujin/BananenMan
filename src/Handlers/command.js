import { Collection } from "discord.js";
import { readdirSync } from "node:fs";

export default {
  /**
   * @param {import("discord.js").Client} client 
   */
  async execute(client) {
    client.commands = new Collection();
    client.slashCommands = new Collection();
    client.slashDatas = [];

    // - Handlers -
    const commandFolders = readdirSync("./src/Commands");

    await Promise.all(
      commandFolders.map(async (category) => {
        const commandFiles = readdirSync(`./src/Commands/${category}`);

        await Promise.all(
          commandFiles.map(async (file) => {
            const commands = await import(`../Commands/${category}/${file}`);

            if (commands) {
              if (commands.commandBase && commands.commandBase.slashData) {
                // Slash Command
                const slashCommand = commands.commandBase;
                client.slashDatas.push(slashCommand.slashData.toJSON());
                client.slashCommands.set(
                  slashCommand.slashData.name,
                  slashCommand
                );
                console.log(`[CommandLoader] Loaded slash command: ${slashCommand.slashData.name}`)
              }
            }
          })
        );
      })
    );
  },
};
