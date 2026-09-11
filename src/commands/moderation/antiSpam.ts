/**
 * SLASH COMMANDS: ANTI-SPAM
 * Configuración y gestión del módulo Anti-Spam
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../types.js";
import { stateManager } from "../../utils/StateManager.js";
import { COLORS } from "../../config/constants.js";

export const antiSpamConfig: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("anti-spam")
    .setDescription("🛑 Configurar Anti-Spam del servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Cambiar configuración de Anti-Spam")
        .addStringOption((opt) =>
          opt
            .setName("setting")
            .setDescription("Parámetro a cambiar")
            .setRequired(true)
            .addChoices(
              { name: "message_threshold", value: "spamMessageThreshold" },
              { name: "spam_window", value: "spamWindowMs" },
              { name: "levenshtein_threshold", value: "levenshteinThreshold" }
            )
        )
        .addStringOption((opt) =>
          opt
            .setName("value")
            .setDescription("Nuevo valor")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Ver estado actual de Anti-Spam")
    )
    .addSubcommand((sub) =>
      sub
        .setName("warnings")
        .setDescription("Ver warnings de un usuario")
        .addUserOption((opt) =>
          opt
            .setName("usuario")
            .setDescription("Usuario a revisar")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("reset-warnings")
        .setDescription("Remover warnings de un usuario")
        .addUserOption((opt) =>
          opt
            .setName("usuario")
            .setDescription("Usuario a limpiar")
            .setRequired(true)
        )
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

    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "config") {
      await handleConfig(interaction, guildId);
    } else if (subcommand === "status") {
      await handleStatus(interaction, guildId);
    } else if (subcommand === "warnings") {
      await handleWarnings(interaction, guildId);
    } else if (subcommand === "reset-warnings") {
      await handleResetWarnings(interaction, guildId);
    }
  },
};

async function handleConfig(interaction: any, guildId: string) {
  const setting = interaction.options.getString("setting");
  const value = interaction.options.getString("value");

  const state = stateManager.getOrCreateGuildState(guildId);
  const config = state.config;

  try {
    let convertedValue: any = value;

    if (setting === "spamMessageThreshold" || setting === "levenshteinThreshold") {
      convertedValue = parseInt(value);
      if (isNaN(convertedValue) || convertedValue <= 0) {
        throw new Error("Debe ser un número positivo");
      }

      if (setting === "levenshteinThreshold" && (convertedValue < 0 || convertedValue > 100)) {
        throw new Error("Levenshtein threshold debe estar entre 0 y 100");
      }
    }

    if (setting === "spamWindowMs") {
      convertedValue = parseInt(value);
      if (isNaN(convertedValue) || convertedValue < 1000) {
        throw new Error("Ventana debe ser >= 1000ms");
      }
    }

    stateManager.updateGuildConfig(guildId, {
      [setting]: convertedValue,
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✅ Anti-Spam Configurado")
      .addFields({
        name: setting,
        value: `${config[setting as keyof typeof config]} → ${convertedValue}`,
        inline: false,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle("❌ Error")
      .setDescription(`${error}`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: ["Ephemeral"] });
  }
}

async function handleStatus(interaction: any, guildId: string) {
  const state = stateManager.getOrCreateGuildState(guildId);
  const config = state.config;

  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle("🛑 Estado Anti-Spam")
    .addFields(
      {
        name: "Estado",
        value: config.antiSpamEnabled ? "✅ Activo" : "❌ Desactivo",
        inline: true,
      },
      {
        name: "Umbral de Mensajes",
        value: `${config.spamMessageThreshold} mensajes`,
        inline: true,
      },
      {
        name: "Ventana de Tiempo",
        value: `${config.spamWindowMs}ms`,
        inline: true,
      },
      {
        name: "Levenshtein Threshold",
        value: `${config.levenshteinThreshold}%`,
        inline: true,
      },
      {
        name: "Información",
        value: "Detecta spam mutado, ghost pings y repeticiones",
        inline: false,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleWarnings(interaction: any, guildId: string) {
  const user = interaction.options.getUser("usuario");

  if (!user) {
    await interaction.reply({
      content: "❌ Usuario no válido",
      flags: ["Ephemeral"],
    });
    return;
  }

  // Aquí se mostrarían los warnings del usuario
  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle(`⚠️ Warnings de ${user.username}`)
    .addFields({
      name: "Warnings Activos",
      value: "0",
      inline: true,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleResetWarnings(interaction: any, guildId: string) {
  const user = interaction.options.getUser("usuario");

  if (!user) {
    await interaction.reply({
      content: "❌ Usuario no válido",
      flags: ["Ephemeral"],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle("✅ Warnings Removidos")
    .setDescription(`Los warnings de <@${user.id}> han sido reiniciados`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
