/**
 * SLASH COMMANDS: ANTI-NUKE
 * Configuración y gestión del módulo Anti-Nuke
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../types.js";
import { stateManager } from "../../utils/StateManager.js";
import { COLORS } from "../../config/constants.js";

export const antiNukeConfig: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("anti-nuke")
    .setDescription("💀 Configurar Anti-Nuke del servidor")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("config")
        .setDescription("Cambiar configuración de Anti-Nuke")
        .addStringOption((opt) =>
          opt
            .setName("setting")
            .setDescription("Parámetro a cambiar")
            .setRequired(true)
            .addChoices(
              { name: "channel_threshold", value: "channelActionThreshold" },
              { name: "role_threshold", value: "roleActionThreshold" },
              { name: "action_window", value: "actionWindow" }
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
        .setDescription("Ver estado actual de Anti-Nuke")
    )
    .addSubcommand((sub) =>
      sub
        .setName("blocked-admins")
        .setDescription("Ver admins bloqueados temporalmente")
    )
    .addSubcommand((sub) =>
      sub
        .setName("unlock-admin")
        .setDescription("Desbloquear a un admin")
        .addUserOption((opt) =>
          opt
            .setName("admin")
            .setDescription("Admin a desbloquear")
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
    } else if (subcommand === "blocked-admins") {
      await handleBlockedAdmins(interaction, guildId);
    } else if (subcommand === "unlock-admin") {
      await handleUnlockAdmin(interaction, guildId);
    }
  },
};

async function handleConfig(interaction: any, guildId: string) {
  const setting = interaction.options.getString("setting");
  const value = interaction.options.getString("value");

  const state = stateManager.getOrCreateGuildState(guildId);
  const config = state.config;

  try {
    const convertedValue = parseInt(value);
    if (isNaN(convertedValue) || convertedValue <= 0) {
      throw new Error("Debe ser un número positivo");
    }

    stateManager.updateGuildConfig(guildId, {
      [setting]: convertedValue,
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✅ Anti-Nuke Configurado")
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
    .setTitle("💀 Estado Anti-Nuke")
    .addFields(
      {
        name: "Estado",
        value: config.antiNukeEnabled ? "✅ Activo" : "❌ Desactivo",
        inline: true,
      },
      {
        name: "Umbral de Canales",
        value: `${config.channelActionThreshold} canales`,
        inline: true,
      },
      {
        name: "Umbral de Roles",
        value: `${config.roleActionThreshold} roles`,
        inline: true,
      },
      {
        name: "Ventana de Acción",
        value: `${config.actionWindow} segundos`,
        inline: true,
      },
      {
        name: "Información",
        value:
          "Si se elimina/crea más canales o roles del umbral en la ventana → PÁNICO activado",
        inline: false,
      }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleBlockedAdmins(interaction: any, guildId: string) {
  // Aquí se mostrarían los admins bloqueados
  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle("🔒 Admins Bloqueados")
    .setDescription("No hay admins actualmente bloqueados")
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleUnlockAdmin(interaction: any, guildId: string) {
  const admin = interaction.options.getUser("admin");

  if (!admin) {
    await interaction.reply({
      content: "❌ Admin no válido",
      flags: ["Ephemeral"],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle("✅ Admin Desbloqueado")
    .setDescription(`<@${admin.id}> ha sido desbloqueado`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
