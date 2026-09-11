/**
 * SLASH COMMANDS: UTILIDADES
 * Comandos generales del bot
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../types.js";
import { stateManager } from "../../utils/StateManager.js";
import { COLORS } from "../../config/constants.js";

export const statsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("📊 Ver estadísticas del bot RoMod"),

  async execute(interaction) {
    const stats = stateManager.getStats();

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle("📊 Estadísticas de RoMod")
      .setThumbnail(interaction.client.user?.avatarURL() || "")
      .addFields(
        {
          name: "Servidores",
          value: `${stats.totalGuilds}`,
          inline: true,
        },
        {
          name: "Usuarios Rastreados",
          value: `${stats.totalTrackedUsers}`,
          inline: true,
        },
        {
          name: "Memoria Usada",
          value: `${stats.memoryUsageMB}MB`,
          inline: true,
        }
      )
      .setFooter({
        text: "RoMod Security Bot v1.0",
        iconURL: interaction.client.user?.avatarURL() || "",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export const configCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("⚙️ Ver configuración completa del servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  adminOnly: true,

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Este comando solo funciona en servidores",
        flags: ["Ephemeral"],
      });
      return;
    }

    const guildId = interaction.guild.id;
    const state = stateManager.getOrCreateGuildState(guildId);
    const config = state.config;

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle(`⚙️ Configuración de ${interaction.guild.name}`)
      .addFields(
        {
          name: "🚨 ANTI-RAID",
          value: `${config.antiRaidEnabled ? "✅" : "❌"} Activo`,
          inline: true,
        },
        {
          name: "🛑 ANTI-SPAM",
          value: `${config.antiSpamEnabled ? "✅" : "❌"} Activo`,
          inline: true,
        },
        {
          name: "💀 ANTI-NUKE",
          value: `${config.antiNukeEnabled ? "✅" : "❌"} Activo`,
          inline: true,
        },
        {
          name: "📍 Detalles Anti-Raid",
          value:
            `Join Rate: ${config.joinRateLimit} en ${config.joinRateLimitWindow}s\n` +
            `Min Account Age: ${config.minAccountAgeDays} días\n` +
            `Verification Level: ${config.lockdownVerificationLevel}`,
          inline: false,
        },
        {
          name: "📍 Detalles Anti-Spam",
          value:
            `Message Threshold: ${config.spamMessageThreshold}\n` +
            `Window: ${config.spamWindowMs}ms\n` +
            `Levenshtein: ${config.levenshteinThreshold}%`,
          inline: false,
        },
        {
          name: "📍 Detalles Anti-Nuke",
          value:
            `Channel Threshold: ${config.channelActionThreshold}\n` +
            `Role Threshold: ${config.roleActionThreshold}\n` +
            `Action Window: ${config.actionWindow}s`,
          inline: false,
        },
        {
          name: "🔔 Canales",
          value:
            `Alert: ${config.alertChannelId ? `<#${config.alertChannelId}>` : "No configurado"}\n` +
            `Log: ${config.logChannelId ? `<#${config.logChannelId}>` : "No configurado"}`,
          inline: false,
        }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export const helpCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("📖 Ver ayuda y comandos disponibles"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle("📖 Ayuda - RoMod Security Bot")
      .setDescription("Comandos disponibles para proteger tu servidor")
      .addFields(
        {
          name: "/anti-raid",
          value:
            "⚡ Configurar Anti-Raid\n" +
            "`config` - Cambiar settings\n" +
            "`status` - Ver estado\n" +
            "`quarantine` - Gestionar cuarentena",
          inline: false,
        },
        {
          name: "/anti-spam",
          value:
            "🛑 Configurar Anti-Spam\n" +
            "`config` - Cambiar settings\n" +
            "`status` - Ver estado\n" +
            "`warnings` - Ver warnings de usuario\n" +
            "`reset-warnings` - Limpiar warnings",
          inline: false,
        },
        {
          name: "/anti-nuke",
          value:
            "💀 Configurar Anti-Nuke\n" +
            "`config` - Cambiar settings\n" +
            "`status` - Ver estado\n" +
            "`blocked-admins` - Ver admins bloqueados\n" +
            "`unlock-admin` - Desbloquear admin",
          inline: false,
        },
        {
          name: "/stats",
          value: "📊 Ver estadísticas del bot",
          inline: false,
        },
        {
          name: "/config",
          value: "⚙️ Ver configuración completa del servidor",
          inline: false,
        },
        {
          name: "/setup-alerts",
          value: "🔔 Configurar canales de alertas",
          inline: false,
        }
      )
      .setFooter({
        text: "Usa /help <comando> para más detalles",
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export const setupAlertsCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup-alerts")
    .setDescription("🔔 Configurar canales de alertas")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((opt) =>
      opt
        .setName("alert_channel")
        .setDescription("Canal para alertas de seguridad")
        .setRequired(true)
    )
    .addChannelOption((opt) =>
      opt
        .setName("log_channel")
        .setDescription("Canal para logs (opcional)")
        .setRequired(false)
    ),

  adminOnly: true,

  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ Este comando solo funciona en servidores",
        flags: ["Ephemeral"],
      });
      return;
    }

    const alertChannel = interaction.options.getChannel("alert_channel");
    const logChannel = interaction.options.getChannel("log_channel");

    if (!alertChannel?.isTextBased()) {
      await interaction.reply({
        content: "❌ El canal de alertas debe ser un canal de texto",
        flags: ["Ephemeral"],
      });
      return;
    }

    const guildId = interaction.guild.id;

    stateManager.updateGuildConfig(guildId, {
      alertChannelId: alertChannel.id,
      logChannelId: logChannel?.id,
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✅ Canales de Alertas Configurados")
      .addFields(
        {
          name: "Canal de Alertas",
          value: `${alertChannel}`,
          inline: false,
        },
        {
          name: "Canal de Logs",
          value: `${logChannel || "No configurado"}`,
          inline: false,
        }
      )
      .setDescription(
        "RoMod enviará todas las alertas de seguridad a estos canales"
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
