import {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
} from "discord.js";

const defaultLimit = 24;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("update-soundboard")
    .setDescription("Sync top starred files into the guild soundboard")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel to scan for ⭐ reactions")
    ),

  cooldown: 60000,
  adminOnly: true,

  async slashRun(client, interaction) {
    await commandBase.execute(client, interaction);
  },

  async execute(client, interaction) {
    const started = Date.now();
    await interaction.reply({ content: "🔍 Collecting starred files…", ephemeral: true });

    const channel = interaction.options.getChannel("channel") ?? interaction.channel;

    if (
      !channel ||
      !channel.isTextBased?.() ||
      !channel.viewable ||
      channel.type === ChannelType.Voice
    ) {
      return interaction.editReply("❌ Please provide a valid text channel.");
    }

    if (
      !channel
        .permissionsFor(interaction.client.user)
        ?.has(PermissionsBitField.Flags.ReadMessageHistory)
    ) {
      return await interaction.editReply("❌ I don’t have permission to read messages in that channel.");
    }
    let responseMessage = "";

    async function appendReply(message) {
      responseMessage += `\n${message}`
      await interaction.editReply(responseMessage.trim());
    }

    // ------------------------------
    // Step 1: Collect starred files
    // ------------------------------
    let messages = [];
    let lastMessageId;

    while (true) {
      const options = { limit: 100 };
      if (lastMessageId) options.before = lastMessageId;

      const fetched = await channel.messages.fetch(options);
      if (fetched.size === 0) break;

      messages.push(...fetched.values());
      lastMessageId = fetched.last().id;
    }
    await appendReply(`📨 Collected ${messages.length} messages. \n🧮 scanning for ⭐...`);

    const stars = {};
    const star = "⭐";
    const down = "❌";

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
      if (attachment.size > MAX_FILE_SIZE) continue; // skip too large

      const msgContent = msg.content?.slice(0, 100) ?? "";
      const msgInfo = msgContent.split("|");

      stars[msg.id] = {
        count: netCount,
        fileName: attachment?.name ?? "Unknown file",
        url: attachment?.url,
        name: msgInfo.length > 1 ? msgInfo[1].trim().slice(0, 32) : "Unnamed",
        msgContent,
      };

      const emoji = msgInfo.length > 0 ? msgInfo[0].trim() : "";
      if (emoji.split(":").length === 3) {
        stars[msg.id].emoji_id = emoji.split(":")[2].split(">")[0];
      } else if (emoji) {
        stars[msg.id].emoji = emoji;
      }
    }

    const sorted = Object.entries(stars)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    await appendReply(`⭐ Found ${sorted.length} starred files, preparing sync…`);

    // ------------------------------
    // Step 2: Fetch existing sounds
    // ------------------------------
    const guildId = interaction.guildId;
    const existingSounds = await client.rest.get(
      `/guilds/${guildId}/soundboard-sounds`
    );

    const soundCount = existingSounds.items.length;
    if (soundCount === 0) {
      return appendReply("❌ No existing soundboard sounds to sync against. Add one manually first.");
    }

    const topStarred = sorted.slice(0, soundCount);

    // ------------------------------
    // Step 3: Delete old sounds
    // ------------------------------
    let deleted = 0;
    if (existingSounds.items.length) await appendReply(`\n🗑️ Deleting old sounds...`);
    for (const sound of existingSounds.items) {
      const keep = topStarred.some((s) => s.name === sound.name);
      if (!keep) {
        await appendReply(`⬇️ Deleting **${sound.name}**...`);
        await client.rest.delete(
          `/guilds/${guildId}/soundboard-sounds/${sound.sound_id}`
        );
        deleted++;
      }
    }

    // ------------------------------
    // Step 4: Upload new sounds
    // ------------------------------
    let uploaded = 0;
    if (deleted != 0) await appendReply(`\n🔄 Uploading new Sounds`);
    for (const star of topStarred) {
      const already = existingSounds.items.some((s) => s.name === star.name);
      if (already) continue;

      await appendReply(`⬆️ Uploading **${star.name}**...`);

      try {
        const fileResp = await fetch(star.url);
        const fileBuffer = Buffer.from(await fileResp.arrayBuffer());
        const base64 = fileBuffer.toString("base64");
        const dataUri = `data:audio/mpeg;base64,${base64}`;

        const body = {
          name: star.name,
          sound: dataUri,
          volume: 1,
        };

        if (star.emoji) body.emoji_name = star.emoji;
        else if (star.emoji_id) body.emoji_id = star.emoji_id;

        await client.rest.post(`/guilds/${guildId}/soundboard-sounds`, { body });
        uploaded++;
      } catch (error) {
        // console.error(error);
        // Notify the channel (not ephemeral)
        channel.send(
          `⚠️ Failed to upload **${star.name}**: \`${error.message}\``
        );
      }
    }

    // ------------------------------
    // Done
    // ------------------------------
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    await appendReply(
      `\n✅ Soundboard sync complete!\n` +
      `• Deleted: ${deleted}\n` +
      `• Uploaded: ${uploaded}\n` +
      `• Duration: ${elapsed}s`
    );
  },
};
