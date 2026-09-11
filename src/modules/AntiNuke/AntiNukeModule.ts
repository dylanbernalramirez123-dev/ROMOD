/**
 * MÓDULO ANTI-NUKE - DEFENSA CONTRA ELIMINACIÓN/CREACIÓN MASIVA
 * Detecta y previene nukes de canales y roles
 */

import {
  Client,
  Guild,
  Channel,
  Role,
  EmbedBuilder,
  TextChannel,
  AuditLogEvent,
} from "discord.js";
import { stateManager } from "../utils/StateManager.js";
import { COLORS, ALERT_MESSAGES } from "../config/constants.js";
import { AuditEvent } from "../types/index.js";

export class AntiNukeModule {
  private client: Client;
  private lockedAdmins: Set<string> = new Set();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * MANEJADOR: Detectar eliminación de canal
   */
  async handleChannelDelete(channel: Channel): Promise<void> {
    if (!channel.guild) return;

    const guildId = channel.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;

    if (!config.antiNukeEnabled) return;

    try {
      // Obtener logs de auditoría para identificar quién eliminó
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 5,
      });

      const deleteLog = auditLogs.entries.first();
      if (!deleteLog) return;

      const executor = deleteLog.executor;
      const executorId = executor?.id || "UNKNOWN";

      console.log(
        `[AntiNuke] Canal ${channel.name} eliminado por ${executor?.tag || "Unknown"}`
      );

      // Registrar acción
      stateManager.recordChannelAction(guildId, executorId);

      // Verificar si supera threshold
      await this.checkNukeThreshold(channel.guild, "CHANNEL_DELETE");
    } catch (error) {
      console.error("[AntiNuke] Error procesando eliminación de canal:", error);
    }
  }

  /**
   * MANEJADOR: Detectar creación de canal
   */
  async handleChannelCreate(channel: Channel): Promise<void> {
    if (!channel.guild) return;

    const guildId = channel.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;

    if (!config.antiNukeEnabled) return;

    try {
      const auditLogs = await channel.guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelCreate,
        limit: 5,
      });

      const createLog = auditLogs.entries.first();
      if (!createLog) return;

      const executor = createLog.executor;
      const executorId = executor?.id || "UNKNOWN";

      console.log(
        `[AntiNuke] Canal ${channel.name} creado por ${executor?.tag || "Unknown"}`
      );

      stateManager.recordChannelAction(guildId, executorId);
      await this.checkNukeThreshold(channel.guild, "CHANNEL_CREATE");
    } catch (error) {
      console.error("[AntiNuke] Error procesando creación de canal:", error);
    }
  }

  /**
   * MANEJADOR: Detectar eliminación de rol
   */
  async handleRoleDelete(role: Role): Promise<void> {
    const guildId = role.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;

    if (!config.antiNukeEnabled) return;

    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleDelete,
        limit: 5,
      });

      const deleteLog = auditLogs.entries.first();
      if (!deleteLog) return;

      const executor = deleteLog.executor;
      const executorId = executor?.id || "UNKNOWN";

      console.log(
        `[AntiNuke] Rol ${role.name} eliminado por ${executor?.tag || "Unknown"}`
      );

      stateManager.recordRoleAction(guildId, executorId);
      await this.checkNukeThreshold(role.guild, "ROLE_DELETE");
    } catch (error) {
      console.error("[AntiNuke] Error procesando eliminación de rol:", error);
    }
  }

  /**
   * MANEJADOR: Detectar creación de rol
   */
  async handleRoleCreate(role: Role): Promise<void> {
    const guildId = role.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;

    if (!config.antiNukeEnabled) return;

    try {
      const auditLogs = await role.guild.fetchAuditLogs({
        type: AuditLogEvent.RoleCreate,
        limit: 5,
      });

      const createLog = auditLogs.entries.first();
      if (!createLog) return;

      const executor = createLog.executor;
      const executorId = executor?.id || "UNKNOWN";

      console.log(
        `[AntiNuke] Rol ${role.name} creado por ${executor?.tag || "Unknown"}`
      );

      stateManager.recordRoleAction(guildId, executorId);
      await this.checkNukeThreshold(role.guild, "ROLE_CREATE");
    } catch (error) {
      console.error("[AntiNuke] Error procesando creación de rol:", error);
    }
  }

  /**
   * Verificar si se excede el umbral de pánico
   */
  private async checkNukeThreshold(
    guild: Guild,
    actionType: "CHANNEL_DELETE" | "CHANNEL_CREATE" | "ROLE_DELETE" | "ROLE_CREATE"
  ): Promise<void> {
    const guildId = guild.id;
    const state = stateManager.getOrCreateGuildState(guildId);
    const config = state.config;

    const isChannelAction = actionType.includes("CHANNEL");
    const recentActions = isChannelAction
      ? stateManager.getRecentChannelActions(guildId, config.actionWindow * 1000)
      : stateManager.getRecentRoleActions(guildId, config.actionWindow * 1000);

    const threshold = isChannelAction
      ? config.channelActionThreshold
      : config.roleActionThreshold;

    // Verificar si se activa el pánico
    if (recentActions.length >= threshold) {
      await this.triggerNukeDefense(guild, actionType, recentActions);
    }
  }

  /**
   * ACCIÓN DE PÁNICO: Defensas anti-nuke activadas
   */
  private async triggerNukeDefense(
    guild: Guild,
    actionType: string,
    suspiciousAdmins: string[]
  ): Promise<void> {
    const guildId = guild.id;

    console.log(`\n🚨 [AntiNuke] PÁNICO ACTIVADO en ${guild.name}`);
    console.log(`Admins sospechosos: ${suspiciousAdmins.join(", ")}`);

    try {
      // 1. Remover roles administrativos del atacante
      for (const userId of suspiciousAdmins) {
        await this.stripAdminRoles(guild, userId);
      }

      // 2. Enviar alerta crítica
      await this.sendNukeAlert(guild, actionType, suspiciousAdmins);

      // 3. Notificar al dueño del servidor
      await this.notifyGuildOwner(guild, actionType, suspiciousAdmins);

      // 4. Registrar evento crítico
      this.logAuditEvent({
        type: "NUKE_ATTEMPT",
        guildId,
        timestamp: Date.now(),
        severity: "CRITICAL",
        description: `Intento de nuke detectado: ${actionType}`,
        affectedUsers: suspiciousAdmins,
        metadata: {
          actionType,
          adminCount: suspiciousAdmins.length,
        },
      });
    } catch (error) {
      console.error("[AntiNuke] Error activando defensas:", error);
    }
  }

  /**
   * Remover todos los roles administrativos de un usuario
   */
  private async stripAdminRoles(guild: Guild, userId: string): Promise<void> {
    try {
      const member = await guild.members.fetch(userId).catch(() => null);
      if (!member) {
        console.warn(`[AntiNuke] No se pudo obtener miembro ${userId}`);
        return;
      }

      // Roles con permisos administrativos
      const adminPermissions = [
        "Administrator",
        "ManageGuild",
        "ManageChannels",
        "ManageRoles",
        "KickMembers",
        "BanMembers",
        "ManageMessages",
        "MentionEveryone",
      ];

      let removedRoles = 0;

      for (const role of member.roles.cache.values()) {
        const hasAdminPerm = adminPermissions.some((perm) =>
          role.permissions.has(perm)
        );

        if (hasAdminPerm && role.editable) {
          await member.roles.remove(role, "[AntiNuke] Admin comprometido detectado").catch(console.error);
          removedRoles++;
        }
      }

      console.log(`[AntiNuke] ${removedRoles} roles administrativos removidos de ${member.user.tag}`);

      // Marcar admin como bloqueado
      this.lockedAdmins.add(userId);
      setTimeout(() => this.lockedAdmins.delete(userId), 60 * 60 * 1000); // 1 hora
    } catch (error) {
      console.error("[AntiNuke] Error al remover roles:", error);
    }
  }

  /**
   * Enviar alerta de nuke al canal de alertas
   */
  private async sendNukeAlert(
    guild: Guild,
    actionType: string,
    suspiciousAdmins: string[]
  ): Promise<void> {
    const config = stateManager.getOrCreateGuildState(guild.id).config;

    if (!config.alertChannelId) return;

    try {
      const channel = (await guild.channels.fetch(config.alertChannelId)) as TextChannel;
      if (!channel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(COLORS.CRITICAL)
        .setTitle("💀 INTENTO DE NUKE BLOQUEADO")
        .setDescription(`Se detectó un intento de nuke masivo del servidor`)
        .addFields(
          {
            name: "Tipo de Ataque",
            value: actionType.replace(/_/g, " "),
            inline: true,
          },
          {
            name: "Admins Comprometidos",
            value: suspiciousAdmins.map((id) => `<@${id}>`).join("\n") || "Desconocido",
            inline: true,
          },
          {
            name: "Acciones Tomadas",
            value:
              "✓ Roles administrativos removidos\n" +
              "✓ Admins bloqueados temporalmente\n" +
              "✓ Propietario notificado",
            inline: false,
          }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("[AntiNuke] Error enviando alerta:", error);
    }
  }

  /**
   * Notificar al propietario del servidor (DM)
   */
  private async notifyGuildOwner(
    guild: Guild,
    actionType: string,
    suspiciousAdmins: string[]
  ): Promise<void> {
    try {
      const owner = await guild.fetchOwner();

      const embed = new EmbedBuilder()
        .setColor(COLORS.CRITICAL)
        .setTitle("⚠️ ALERTA CRÍTICA DE SEGURIDAD")
        .setDescription(
          `Se detectó un intento de nuke masivo en tu servidor **${guild.name}**`
        )
        .addFields(
          {
            name: "Tipo de Ataque",
            value: actionType.replace(/_/g, " "),
            inline: false,
          },
          {
            name: "Admins Comprometidos",
            value: suspiciousAdmins.length > 0 ? suspiciousAdmins.join(", ") : "Desconocido",
            inline: false,
          },
          {
            name: "Acciones de RoMod",
            value:
              "1. Roles administrativos removidos automáticamente\n" +
              "2. Atacantes bloqueados temporalmente\n" +
              "3. Auditoría registrada",
            inline: false,
          },
          {
            name: "Recomendación",
            value:
              "✓ Revisa los logs de auditoría\n" +
              "✓ Cambia contraseñas de admins\n" +
              "✓ Audita permisos de roles",
            inline: false,
          }
        )
        .setTimestamp();

      await owner.send({ embeds: [embed] });
    } catch (error) {
      console.error("[AntiNuke] Error notificando al propietario:", error);
    }
  }

  /**
   * Verificar si un admin está bloqueado
   */
  isAdminLocked(userId: string): boolean {
    return this.lockedAdmins.has(userId);
  }

  /**
   * Registrar evento de auditoría
   */
  private logAuditEvent(event: AuditEvent): void {
    console.log(`[AUDIT] ${event.severity} - ${event.type}: ${event.description}`);
  }

  /**
   * Obtener estadísticas del módulo
   */
  getStats() {
    return {
      lockedAdmins: this.lockedAdmins.size,
    };
  }
}
