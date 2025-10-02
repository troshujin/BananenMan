import {
	SlashCommandBuilder,
	ChannelType,
	PermissionsBitField,
	CommandInteraction,
} from 'discord.js';

const defaultLimit = 24;

export const commandBase = {
	prefixData: {
		name: "get-starred-files",
		aliases: [],
	},

	slashData: new SlashCommandBuilder()
		.setName("get-starred-files")
		.setDescription("Reads all submissions in a channel.")
		.addChannelOption((option) =>
			option.setName("channel").setDescription("The channel to scan")
		)
		.addIntegerOption((option) =>
			option
				.setName("top")
				.setDescription(`Amount of submissions to show; defaults to ${defaultLimit}; -1 for all`)
		),

	cooldown: 15000,
	adminOnly: false,

	async prefixRun(client, message, args) {
		message.reply("Nah, I only do it with the slash command.");
	},

	async slashRun(client, interaction) {
		await commandBase.execute(interaction);
	},

	/**
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		const startTime = Date.now();
		const channel =
			interaction.options.getChannel("channel") ?? interaction.channel;
		const limit = interaction.options.getInteger("top") ?? defaultLimit;

		const ignoreLimit = limit < 0

		if (
			!channel ||
			!channel.isTextBased?.() ||
			!channel.viewable ||
			channel.type === ChannelType.Voice
		) {
			return interaction.reply({
				content: "Please provide a valid text channel.",
			});
		}

		if (
			!channel
				.permissionsFor(interaction.client.user)
				?.has(PermissionsBitField.Flags.ReadMessageHistory)
		) {
			return await interaction.reply({
				content: "I do not have permission to read message history in that channel.",
				flags: "Ephemeral",
			});
		}

		let messages = [];
		let lastMessageId;
		let hasReplied = false;
		let sendUpdates = false;
		let lastUpdate = 0;

		while (true) {
			const timeSpent = (Date.now() - startTime) / 1000;

			if (!hasReplied) {
				await interaction.reply({
					content: "Processing...",
					flags: "Ephemeral",
				});
				hasReplied = true;
			} else if (timeSpent > 2) {
				await interaction.editReply({
					content: "Request is taking a bit long...",
					flags: "Ephemeral",
				});
				hasReplied = true;
			} else if (sendUpdates && timeSpent - lastUpdate > 4) {
				await interaction.followUp({
					content: `Checked ${messages.length} messages so far... (${timeSpent.toFixed(1)}s)`,
					flags: "Ephemeral",
				});
				lastUpdate = timeSpent;
			} else if (!sendUpdates && timeSpent > 5) {
				await interaction.followUp({
					content: "This might take a while, I'll send progress updates.",
					flags: "Ephemeral",
				});
				sendUpdates = true;
				lastUpdate = timeSpent;
			}

			const options = { limit: 100 };
			if (lastMessageId) options.before = lastMessageId;

			const fetchedMessages = await channel.messages.fetch(options);
			if (fetchedMessages.size === 0) break;

			messages.push(...fetchedMessages.values());
			lastMessageId = fetchedMessages.last().id;
		}

		const star = "⭐";
		const down = "❌";

		const stars = {};

		for (const msg of messages) {
			if (msg.attachments.size !== 1) continue;

			// Count stars and downs separately, ignoring bot reactions
			let starsCount = 0;
			let downsCount = 0;

			for (const reaction of msg.reactions.cache.values()) {
				const users = await reaction.users.fetch(); // fetch all users who reacted
				const humanCount = users.filter((u) => !u.bot).size;

				if (reaction.emoji.name === star) {
					starsCount += humanCount;
				} else if (reaction.emoji.name === down) {
					downsCount += humanCount;
				}
			}

			const netCount = starsCount - downsCount;
			if (netCount < 1) continue;

			const attachment = msg.attachments.first();

			stars[msg.id] = {
				stars: starsCount,
				downs: downsCount,
				count: netCount,
				fileName: attachment?.name ?? "Unknown file",
				msgContent: msg.content?.slice(0, 100) ?? "(No text)",
			};

		}


		const sorted = Object.entries(stars).sort((a, b) => b[1].count - a[1].count);
		let limitedList = sorted;
		if (!ignoreLimit) limitedList = sorted.slice(0, limit);

		const contentList = limitedList.map(([id, data], index) => {
			const link = `https://discord.com/channels/${interaction.guildId}/${channel.id}/${id}`;
			return `${index + 1}. [Link](${link}) — **${data.count}** ✨ — ${data.fileName} — ${data.stars} ⭐ / ${data.downs} ❌\n> ${data.msgContent}`;
		});

		if (contentList.length === 0) contentList.push("No starred files found 😔");

		// Batch replies by 2000 character chunks
		const start = ignoreLimit ? `**Top` : `**Top ${limit}`
		const header = `${start} starred file(s)** (out of ${messages.length} messages in <#${channel.id}>):\n\n`;
		const contentBatches = [];
		let batch = header;

		for (const line of contentList) {
			if ((batch + "\n" + line).length >= 2000) {
				contentBatches.push(batch);
				batch = "";
			}
			batch += `\n${line}`;
		}

		if (batch) contentBatches.push(batch);

		for (const msg of contentBatches) {
			if (!hasReplied) {
				await interaction.editReply({ content: msg, flags: "Ephemeral" });
				hasReplied = true;
			} else {
				await interaction.followUp({ content: msg, flags: "Ephemeral" });
			}
		}
	},
};
