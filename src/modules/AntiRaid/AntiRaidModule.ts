/**
 * MÓDULO ANTI-RAID HEURÍSTICO AVANZADO
 * Detección de ataques de raid con análisis de cuentas en cuarentena
 */

import {
  Client,
  Guild,
  GuildMember,
  EmbedBuilder,
  VerificationLevel,
  TextChannel,
} from "discord.js";
import { stateManager } from "../utils/StateManager.js";
import {
  calculateLevenshteinSimilarity,
  getAccountAgeDays,
  calculateAccountRiskScore,
  calculateJoinRate,
} from "../utils/analysis.js";
import {
  ACCOUNT_RISK_THRESHOLDS,
  CACHE_TTL,
  ALERT_MESSAGES,
  COLORS,
  ACTION_TIMEOUTS,
} from "../config/constants.js";
import { RaidAlert, QuarantineAccount, AuditEvent } from "../types/index.js";

export class AntiRaidModule {
  private client: Client;
  private quarantinedUsers: Map<string, QuarantineAccount> = new Map();

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * MANEJADOR: Cuando un usuario se une al servidor
   */
  async handleMemberJoin(member: GuildMember): Promise<void> {
    const guildId = member.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;

    if (!config.antiRaidEnabled) return;

    // 1. Registrar métrica de join
    const accountAge = getAccountAgeDays(member.user.createdTimestamp);
    const joinMetrics = {
      userId: member.id,
      joinTimestamp: Date.now(),
      accountCreatedAt: member.user.createdTimestamp,
      accountAgeDays: accountAge,
    };

    stateManager.recordUserJoin(guildId, joinMetrics);

    // 2. Analizar para cuarentena (cuentas nuevas sospechosas)
    if (accountAge < config.minAccountAgeDays) {
      await this.analyzeQuarantineAccount(member, accountAge);
    }

    // 3. Verificar si se activa alerta de raid
    await this.checkRaidTrigger(member.guild, config);
  }

  /**
   * Analizar cuenta sospechosa y ponerla en cuarentena
   */
  private async analyzeQuarantineAccount(member: GuildMember, accountAgeDays: number): Promise<void> {
    const guildId = member.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;
    
    // Obtener joins recientes para contexto
    const recentJoins = stateManager.getRecentJoins(guildId, CACHE_TTL.USER_JOIN_METRICS);
    const joinCount = recentJoins.length;

    // Calcular riesgo
    const riskScore = calculateAccountRiskScore(accountAgeDays, joinCount, false, 0);

    const quarantineAccount: QuarantineAccount = {
      userId: member.id,
      accountAge: accountAgeDays * 24 * 60 * 60 * 1000,
      joinTimestamp: Date.now(),
      riskScore,
      reason: `Cuenta creada hace ${accountAgeDays} días (umbral: < ${config.minAccountAgeDays})`,
    };

    // Si el riesgo es crítico, aplicar medidas inmediatas
    if (riskScore >= ACCOUNT_RISK_THRESHOLDS.CRITICAL) {
      this.quarantinedUsers.set(member.id, quarantineAccount);

      // Aplicar timeout preventivo
      try {
        const timeoutDuration = ACTION_TIMEOUTS.QUARANTINE_DURATION;
        await member.timeout(timeoutDuration, `[AntiRaid] Cuenta sospechosa - Riesgo: ${riskScore}/100`);

        console.log(`[AntiRaid] Usuario ${member.user.tag} puesto en timeout por cuenta sospechosa (riesgo: ${riskScore})`);
      } catch (error) {
        console.error(`Error al aplicar timeout a ${member.user.tag}:`, error);
      }

      // Limpiar después de cuarentena
      setTimeout(() => {
        this.quarantinedUsers.delete(member.id);
      }, ACTION_TIMEOUTS.QUARANTINE_DURATION);
    }
  }

  /**
   * Verificar si se activa la alerta de raid
   * Condición: X usuarios en Y segundos
   */
  private async checkRaidTrigger(guild: Guild, config: any): Promise<void> {
    const guildId = guild.id;
    const recentJoins = stateManager.getRecentJoins(guildId, config.joinRateLimitWindow * 1000);

    // Verificar si se excede el umbral
    if (recentJoins.length >= config.joinRateLimit) {
      await this.triggerRaidAlert(guild, recentJoins);
    }
  }

  /**
   * ACCIÓN: Activar alerta de raid
   * - Elevar verificación a CELULAR VERIFICADO
   * - Pausar invitaciones
   * - Notificar
   */
  private async triggerRaidAlert(guild: Guild, suspiciousJoins: any[]): Promise<void> {
    const guildId = guild.id;
    const state = stateManager.getOrCreateGuildState(guildId);

    // Verificar si ya hay alerta activa (evitar spam)
    if (state.activeRaidAlert?.isActive) {
      console.log(`[AntiRaid] Alerta de raid ya activa en ${guild.name}`);
      return;
    }

    console.log(`[AntiRaid] ⚠️ RAID DETECTADO en ${guild.name} - ${suspiciousJoins.length} usuarios`);

    // Crear alerta
    const raidAlert: RaidAlert = {
      guildId,
      timestamp: Date.now(),
      joinCount: suspiciousJoins.length,
      userIds: suspiciousJoins.map((j) => j.userId),
      isActive: true,
      suspiciousAccounts: suspiciousJoins
        .filter((j) => j.accountAgeDays < 7)
        .map((j) => ({
          userId: j.userId,
          accountAge: j.accountAgeDays * 24 * 60 * 60 * 1000,
          joinTimestamp: j.joinTimestamp,
          riskScore: calculateAccountRiskScore(j.accountAgeDays, suspiciousJoins.length, false),
          reason: `Cuenta nueva + raid masivo`,
        })),
    };

    stateManager.setRaidAlert(guildId, raidAlert);

    try {
      // 1. Elevar nivel de verificación
      await this.elevateVerificationLevel(guild);

      // 2. Pausar invitaciones
      await this.pauseInvitations(guild);

      // 3. Notificar
      await this.sendRaidAlert(guild, raidAlert);

      // 4. Registrar evento de auditoría
      this.logAuditEvent({
        type: "RAID_DETECTED",
        guildId,
        timestamp: Date.now(),
        severity: "CRITICAL",
        description: `Raid detectado: ${raidAlert.joinCount} usuarios en poco tiempo`,
        affectedUsers: raidAlert.userIds,
      });
    } catch (error) {
      console.error(`[AntiRaid] Error al procesar raid en ${guild.name}:`, error);
    }
  }

  /**
   * Elevar nivel de verificación del servidor
   */
  private async elevateVerificationLevel(guild: Guild): Promise<void> {
    try {
      const config = stateManager.getOrCreateGuildState(guild.id).config;
      const targetLevel = config.lockdownVerificationLevel;

      // Mapear string a VerificationLevel de discord.js
      const levelMap: Record<string, VerificationLevel> = {
        NONE: VerificationLevel.None,
        LOW: VerificationLevel.Low,
        MEDIUM: VerificationLevel.Medium,
        HIGH: VerificationLevel.High,
        VERY_HIGH: VerificationLevel.VeryHigh,
      };

      const discordLevel = levelMap[targetLevel] || VerificationLevel.High;

      await guild.edit({
        verificationLevel: discordLevel,
        reason: "[AntiRaid] Raid detectado - Verificación elevada",
      });

      console.log(`[AntiRaid] Verificación elevada a ${targetLevel} en ${guild.name}`);
    } catch (error) {
      console.error(`[AntiRaid] Error al elevar verificación:`, error);
    }
  }

  /**
   * Pausar/desactivar invitaciones del servidor
   */
  private async pauseInvitations(guild: Guild): Promise<void> {
    try {
      const invites = await guild.invites.fetch();

      for (const invite of invites.values()) {
        if (invite.code && invite.deletable) {
          await invite.delete("[AntiRaid] Raid en progreso - Invitaciones pausadas");
        }
      }

      console.log(`[AntiRaid] Invitaciones pausadas en ${guild.name}`);
    } catch (error) {
      console.error(`[AntiRaid] Error al pausar invitaciones:`, error);
    }
  }

  /**
   * Enviar notificación de raid al canal de alertas
   */
  private async sendRaidAlert(guild: Guild, alert: RaidAlert): Promise<void> {
    const config = stateManager.getOrCreateGuildState(guild.id).config;

    if (!config.alertChannelId) {
      console.warn(`[AntiRaid] No se configuró canal de alertas en ${guild.name}`);
      return;
    }

    try {
      const channel = (await guild.channels.fetch(config.alertChannelId)) as TextChannel;
      if (!channel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(COLORS.CRITICAL)
        .setTitle("🚨 RAID DETECTADO")
        .setDescription(`Se han detectado ${alert.joinCount} uniones sospechosas en poco tiempo`)
        .addFields(
          {
            name: "Usuarios Afectados",
            value: `${alert.joinCount}`,
            inline: true,
          },
          {
            name: "Cuentas en Cuarentena",
            value: `${alert.suspiciousAccounts.length}`,
            inline: true,
          },
          {
            name: "Acciones Tomadas",
            value: `✓ Verificación elevada a CELULAR VERIFICADO\n✓ Invitaciones pausadas\n✓ Cuentas nuevas en timeout`,
            inline: false,
          },
          {
            name: "Cuentas Sospechosas",
            value:
              alert.suspiciousAccounts.slice(0, 5).map((acc) => `<@${acc.userId}> - Riesgo: ${acc.riskScore}/100`).join("\n") ||
              "Ninguna",
            inline: false,
          }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`[AntiRaid] Error al enviar alerta:`, error);
    }
  }

  /**
   * Obtener lista de usuarios en cuarentena
   */
  getQuarantinedUsers(guildId: string): QuarantineAccount[] {
    return Array.from(this.quarantinedUsers.values()).filter(
      (acc) => stateManager.getGuildState(guildId)?.guildId === guildId
    );
  }

  /**
   * Remover usuario de cuarentena (liberación manual)
   */
  async removeFromQuarantine(guildId: string, userId: string): Promise<boolean> {
    const removed = this.quarantinedUsers.delete(userId);

    if (removed) {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const member = await guild.members.fetch(userId).catch(() => null);
        if (member && member.isCommunicationDisabled()) {
          try {
            await member.timeout(null, "[AntiRaid] Removido de cuarentena manualmente");
            console.log(`[AntiRaid] Usuario ${userId} removido de cuarentena en ${guild.name}`);
          } catch (error) {
            console.error(`Error al remover timeout:`, error);
          }
        }
      }
    }

    return removed;
  }

  /**
   * Registrar evento de auditoría
   */
  private logAuditEvent(event: AuditEvent): void {
    console.log(`[AUDIT] ${event.severity} - ${event.type}: ${event.description}`);
    // Aquí se podría integrar con una base de datos o webhook de auditoría
  }

  /**
   * Obtener estadísticas del módulo
   */
  getStats() {
    return {
      quarantinedUsers: this.quarantinedUsers.size,
      activeAlerts: Array.from(stateManager["guildStates"].values()).filter(
        (state) => state.activeRaidAlert?.isActive
      ).length,
    };
  }
}
