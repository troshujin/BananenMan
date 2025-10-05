import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get the bot's invite link."),

  cooldown: 5000,
  adminOnly: false,

  async slashRun(client, interaction) {
    // build the OAuth2 URL
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=${PermissionFlagsBits.Administrator}&scope=bot%20applications.commands`;

    await interaction.reply({
      content: `Here's my invite link:\n${inviteUrl}`,
      ephemeral: true,
    });
  },
};
