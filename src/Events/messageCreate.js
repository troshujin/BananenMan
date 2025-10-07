import { ChannelType, Collection, EmbedBuilder, Events, Message } from "discord.js";
import config from "../Base/config.js";
const cooldown = new Collection();

export default {
  name: Events.MessageCreate,
  /**
   * @param {import("discord.js").Message} message
   */
  async execute(message) {
    const { client } = message;

    if (message.author.bot) {
      return;
    }

    if (message.channel.type === ChannelType.DM) {
      return await message.channel.send("Hi! I don't work in DM's. Thank you.");
    }

    const { prefix } = config;
    if (!message.content.startsWith(prefix)) {
      return;
    }

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if (cmd.length === 0) {
      return;
    }

    let command = client.commands.get(cmd);

    if (command) {
      if (command.adminOnly && !getAdmins().some(x => x.id == message.author.id)) {
        return await message.reply({
          embeds: [new EmbedBuilder()
            .setTitle("Only **admins** can use this command.")
            .setTimestamp()],
          flags: "Ephemeral",
        });
      }

      if (command.cooldown) {
        if (cooldown.has(`${command.name}-${message.author.id}`)) {
          const nowDate = message.createdTimestamp;
          const waitedDate = cooldown.get(`${command.name}-${message.author.id}`) - nowDate;
          return message.reply({
            content: `Cooldown is currently active, please try again <t:${Math.floor(
              new Date(nowDate + waitedDate).getTime() / 1000
            )}:R>.`,
          })
            .then((msg) =>
              setTimeout(
                () => msg.delete(),
                cooldown.get(`${command.name}-${message.author.id}`) - Date.now() + 1000
              )
            );
        }

        command.prefixRun(client, message, args);

        cooldown.set(
          `${command.name}-${message.author.id}`,
          Date.now() + command.cooldown
        );

        setTimeout(() => {
          cooldown.delete(`${command.name}-${message.author.id}`);
        }, command.cooldown);
      } else {
        command.prefixRun(client, message, args);
      }
    }
  },
};
