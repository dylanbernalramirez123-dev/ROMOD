/**
 * SLASH COMMANDS: ANTI-RAID
 * Configuración y gestión del módulo Anti-Raid
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../types.js";
import { stateManager } from "../../utils/StateManager.js";
import { COLORS } from "../../config/constants.js";

export const antiRaidConfig: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("anti-raid")
    .setDescription("⚡ Configurar Anti-Raid del servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Cambiar configuración de Anti-Raid")
        .addStringOption((opt) =>
          opt
            .setName("setting")
            .setDescription("Parámetro a cambiar")
            .setRequired(true)
            .addChoices(
              { name: "join_rate_limit", value: "joinRateLimit" },
              { name: "join_rate_window", value: "joinRateLimitWindow" },
              { name: "min_account_age", value: "minAccountAgeDays" },
              { name: "verification_level", value: "lockdownVerificationLevel" }
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
        .setDescription("Ver estado actual de Anti-Raid")
    )
    .addSubcommand((sub) =>
      sub
        .setName("quarantine")
        .setDescription("Gestionar cuentas en cuarentena")
        .addStringOption((opt) =>
          opt
            .setName("action")
            .setDescription("Acción a realizar")
            .setRequired(true)
            .addChoices(
              { name: "list", value: "list" },
              { name: "remove", value: "remove" }
            )
        )
        .addUserOption((opt) =>
          opt
            .setName("usuario")
            .setDescription("Usuario (solo para action: remove)")
            .setRequired(false)
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
    } else if (subcommand === "quarantine") {
      await handleQuarantine(interaction, guildId);
    }
  },
};

async function handleConfig(interaction: any, guildId: string) {
  const setting = interaction.options.getString("setting");
  const value = interaction.options.getString("value");

  const state = stateManager.getOrCreateGuildState(guildId);
  const config = state.config;

  try {
    // Validar y convertir valor
    let convertedValue: any = value;

    if (setting === "joinRateLimit" || setting === "joinRateLimitWindow" || setting === "minAccountAgeDays") {
      convertedValue = parseInt(value);
      if (isNaN(convertedValue) || convertedValue <= 0) {
        throw new Error("Debe ser un número positivo");
      }
    }

    if (setting === "lockdownVerificationLevel") {
      const validLevels = ["NONE", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"];
      if (!validLevels.includes(value.toUpperCase())) {
        throw new Error(`Nivel inválido. Válidos: ${validLevels.join(", ")}`);
      }
      convertedValue = value.toUpperCase();
    }

    // Actualizar configuración
    stateManager.updateGuildConfig(guildId, {
      [setting]: convertedValue,
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✅ Anti-Raid Configurado")
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
    .setTitle("🛡️ Estado Anti-Raid")
    .addFields(
      {
        name: "Estado",
        value: config.antiRaidEnabled ? "✅ Activo" : "❌ Desactivo",
        inline: true,
      },
      {
        name: "Join Rate Limit",
        value: `${config.joinRateLimit} usuarios`,
        inline: true,
      },
      {
        name: "Ventana de Tiempo",
        value: `${config.joinRateLimitWindow} segundos`,
        inline: true,
      },
      {
        name: "Edad Mínima de Cuenta",
        value: `${config.minAccountAgeDays} días`,
        inline: true,
      },
      {
        name: "Nivel de Verificación",
        value: config.lockdownVerificationLevel,
        inline: true,
      },
      {
        name: "Canal de Alertas",
        value: config.alertChannelId ? `<#${config.alertChannelId}>` : "No configurado",
        inline: false,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleQuarantine(interaction: any, guildId: string) {
  const action = interaction.options.getString("action");
  const user = interaction.options.getUser("usuario");

  if (action === "list") {
    // Aquí se mostraría la lista de cuentas en cuarentena
    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle("🔒 Cuentas en Cuarentena")
      .setDescription("No hay cuentas actualmente en cuarentena")
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else if (action === "remove") {
    if (!user) {
      await interaction.reply({
        content: "❌ Debes especificar un usuario",
        flags: ["Ephemeral"],
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✅ Usuario Removido de Cuarentena")
      .setDescription(`<@${user.id}> ha sido liberado de cuarentena`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
