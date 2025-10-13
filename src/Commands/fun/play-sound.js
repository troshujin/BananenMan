// src/Commands/fun/play-sound.js
import { SlashCommandBuilder } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  entersState,
  VoiceConnectionStatus
} from "@discordjs/voice";
import globalState from "../../Base/state.js";
import { checkIdleVoiceConnections } from "../../Lib/voiceCleanup.js";

/** @type {import("../../Lib/types.js").CommandBase} */
export const commandBase = {
  slashData: new SlashCommandBuilder()
    .setName("play-sound")
    .setDescription("Play a sound file from a message's attachment.")
    .addStringOption(opt =>
      opt
        .setName("message")
        .setDescription("Message ID to play sound from")
        .setAutocomplete(true)
        .setRequired(true)
    ),

  cooldown: 1000,
  adminOnly: false,

  /**
   * @param {import("../../Lib/interaction.js").CustomInteractionHandler} handler
   */
  async slashRun(handler) {
    const { interaction } = handler;
    const messageId = interaction.options.getString("message");
    const member = interaction.member;

    if (!member?.voice?.channel) {
      return interaction.reply({
        content: "❌ You must be in a voice channel to play a sound.",
        flags: "Ephemeral",
      });
    }

    await interaction.deferReply({ flags: "Ephemeral" });

    // Try fetching the message
    let message;
    try {
      const channel = interaction.channel;
      message = await channel.messages.fetch(messageId);
    } catch {
      return interaction.editReply({ content: "❌ Could not find that message ID." });
    }

    const audioAttachment = message.attachments.find(a =>
      a.contentType?.startsWith("audio/")
    );

    if (!audioAttachment) {
      return interaction.editReply({ content: "❌ Message has no audio attachment." });
    }

    const guildKey = `vc_${interaction.guildId}`;
    const voiceChannel = member.voice.channel;

    // Get or create guild voice state
    let guildState = globalState.getState(guildKey);
    console.log(guildState)
    if (guildState) console.log(guildState.queue)
    if (!guildState) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      const player = createAudioPlayer();
      connection.subscribe(player);

      guildState = {
        connection,
        player,
        queue: [],
        playing: false,
        lastPlayed: Date.now(),
      };

      globalState.setState(guildKey, guildState);

      // Player event hooks
      player.on(AudioPlayerStatus.Playing, () => {
        guildState.lastPlayed = Date.now();
        globalState.setState(guildKey, guildState);
      });

      player.on(AudioPlayerStatus.Idle, async () => {
        guildState.lastPlayed = Date.now();
        globalState.setState(guildKey, guildState);
        if (guildState.queue.length > 0) {
          // 1 second gap between tracks
          await new Promise(res => setTimeout(res, 200));
          playNext(guildKey);
        } else {
          guildState.playing = false;
        }
      });
    }

    // Add sound to queue
    guildState.queue.push({
      url: audioAttachment.url,
      name: audioAttachment.name,
      interaction,
      channel: voiceChannel,
    });

    // Notify user
    await interaction.editReply({
      content: `✅ Queued **${audioAttachment.name}** to play in <#${voiceChannel.id}>.`,
    });

    // If nothing playing, start playback
    if (!guildState.playing) {
      guildState.playing = true;
      playNext(guildKey);
    }

    // Start monitor loop if not already running
    if (!globalState.getState("soundMonitorRunning")) {
      globalState.setState("soundMonitorRunning", true);
      globalState.setIntervalFunction("soundMonitor", checkIdleVoiceConnections);
    }
  },
};

/**
 * Plays the next sound in the queue for a guild.
 * @param {string} guildKey
 */
async function playNext(guildKey) {
  const guildState = globalState.getState(guildKey);
  if (!guildState || guildState.queue.length === 0) {
    guildState.playing = false;
    return;
  }

  const { connection, player } = guildState;
  const next = guildState.queue.shift();

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 10_000);
    const resource = createAudioResource(next.url);
    player.play(resource);
    await entersState(player, AudioPlayerStatus.Playing, 5_000);

    await next.interaction.followUp({
      content: `🎵 Now playing: **${next.name}** in <#${next.channel.id}>.`,
      flags: "Ephemeral",
    });
  } catch (err) {
    console.error(`[PlaySound] Failed to play ${next.name}:`, err);
    await next.interaction.followUp({
      content: `❌ Failed to play **${next.name}**.`,
      flags: "Ephemeral",
    });
    // Continue to next in queue
    playNext(guildKey);
  }
}
