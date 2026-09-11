/**
 * MÓDULO ANTI-SPAM CON ANÁLISIS DE FRECUENCIA
 * Detección de spam mutado con Levenshtein + Burst de menciones
 */

import {
  Client,
  Message,
  GuildMember,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { stateManager } from "../utils/StateManager.js";
import {
  calculateLevenshteinSimilarity,
  normalizeText,
  detectMassMentions,
  hashString,
} from "../utils/analysis.js";
import { ALERT_MESSAGES, COLORS, CACHE_TTL } from "../config/constants.js";
import { MessageMetric, AuditEvent } from "../types/index.js";

export class AntiSpamModule {
  private client: Client;
  private userSpamWarnings: Map<string, number> = new Map(); // userId -> warningCount

  constructor(client: Client) {
    this.client = client;
  }

  /**
   * MANEJADOR: Nuevo mensaje en el servidor
   */
  async handleMessage(message: Message): Promise<void> {
    // Ignorar bots y mensajes privados
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const config = stateManager.getOrCreateGuildState(guildId).config;

    if (!config.antiSpamEnabled) return;

    // Ignorar moderadores
    if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return;
    }

    try {
      // 1. Registrar métrica de mensaje
      const metric: MessageMetric = {
        timestamp: Date.now(),
        content: message.content,
        mentions: message.mentions.size,
        contentHash: hashString(normalizeText(message.content)),
      };

      stateManager.recordMessage(guildId, message.author.id, metric);

      // 2. Verificar patrones de spam
      await this.checkSpamPatterns(message, config);
    } catch (error) {
      console.error("[AntiSpam] Error procesando mensaje:", error);
    }
  }

  /**
   * Verificar múltiples patrones de spam
   */
  private async checkSpamPatterns(message: Message, config: any): Promise<void> {
    // Patrón 1: Mass mentions (menciones masivas o ghost pings)
    await this.checkMassMentions(message, config);

    // Patrón 2: Burst de mensajes similares (spam mutado)
    await this.checkMessageBurst(message, config);

    // Patrón 3: Repetición de mensaje exacto
    await this.checkExactRepetition(message, config);
  }

  /**
   * Detectar menciones masivas y ghost pings
   */
  private async checkMassMentions(message: Message, config: any): Promise<void> {
    const { isMassMention, mentionCount, ghostPing } = detectMassMentions(message.content);

    if (!isMassMention && !ghostPing) return;

    console.log(
      `[AntiSpam] ${message.author.tag} - Mass mention detectado (${mentionCount} menciones, ghostPing: ${ghostPing})`
    );

    try {
      // Eliminar mensaje
      await message.delete();

      // Aplicar acción
      const severity = isMassMention ? "HIGH" : "MEDIUM";
      const action = isMassMention ? "eliminado" : "advertencia";

      await this.applySpamAction(message, {
        type: ghostPing ? "GHOST_PING" : "MASS_MENTION",
        severity,
        reason: `${mentionCount} menciones detectadas en mensaje`,
        shouldTimeout: isMassMention,
      });
    } catch (error) {
      console.error("[AntiSpam] Error al procesar mass mention:", error);
    }
  }

  /**
   * Detectar ráfaga de mensajes similares (spam mutado)
   */
  private async checkMessageBurst(message: Message, config: any): Promise<void> {
    const history = stateManager.getUserMessageHistory(
      message.guildId!,
      message.author.id,
      config.spamWindowMs
    );

    if (history.length < config.spamMessageThreshold) return;

    // Analizar similitud entre mensajes recientes
    const recentMessages = history.slice(-config.spamMessageThreshold);
    let similarityCount = 0;

    for (let i = 0; i < recentMessages.length - 1; i++) {
      const current = recentMessages[i];
      const next = recentMessages[i + 1];

      const similarity = calculateLevenshteinSimilarity(current.content, next.content);

      if (similarity >= config.levenshteinThreshold) {
        similarityCount++;
      }
    }

    // Si hay múltiples mensajes con alta similitud, es spam
    if (similarityCount >= 2) {
      console.log(
        `[AntiSpam] ${message.author.tag} - Spam mutado detectado (similitud: ${config.levenshteinThreshold}%+)`
      );

      try {
        await message.delete();

        await this.applySpamAction(message, {
          type: "MUTATED_SPAM",
          severity: "HIGH",
          reason: `${recentMessages.length} mensajes similares en ráfaga`,
          shouldTimeout: true,
        });
      } catch (error) {
        console.error("[AntiSpam] Error al procesar spam mutado:", error);
      }
    }
  }

  /**
   * Detectar repetición exacta de mensaje
   */
  private async checkExactRepetition(message: Message, config: any): Promise<void> {
    const history = stateManager.getUserMessageHistory(
      message.guildId!,
      message.author.id,
      config.spamWindowMs
    );

    if (history.length < 2) return;

    const currentHash = hashString(normalizeText(message.content));
    const duplicates = history.filter((msg) => msg.contentHash === currentHash).length;

    if (duplicates >= 2) {
      console.log(`[AntiSpam] ${message.author.tag} - Repetición exacta detectada`);

      try {
        await message.delete();

        await this.applySpamAction(message, {
          type: "EXACT_REPEAT",
          severity: "MEDIUM",
          reason: "Repetición de mensaje exacto",
          shouldTimeout: duplicates > 3,
        });
      } catch (error) {
        console.error("[AntiSpam] Error al procesar repetición:", error);
      }
    }
  }

  /**
   * Aplicar acciones cuando se detecta spam
   */
  private async applySpamAction(
    message: Message,
    violation: {
      type: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      reason: string;
      shouldTimeout: boolean;
    }
  ): Promise<void> {
    const guildId = message.guildId!;
    const userId = message.author.id;

    // Rastrear advertencias
    const warnings = (this.userSpamWarnings.get(userId) || 0) + 1;
    this.userSpamWarnings.set(userId, warnings);

    // Limpiar después de 1 hora
    setTimeout(() => {
      this.userSpamWarnings.delete(userId);
    }, 60 * 60 * 1000);

    // Acciones progresivas
    try {
      if (warnings === 1) {
        // Primera: Advertencia
        await this.sendWarning(message, violation);
      } else if (warnings === 2) {
        // Segunda: Timeout corto
        await message.member?.timeout(5 * 60 * 1000, `[AntiSpam] ${violation.type} - Advertencia #2`);
        await this.sendWarning(message, violation, "TIMEOUT_5M");
      } else if (warnings >= 3) {
        // Tercera+: Timeout largo y reporte
        await message.member?.timeout(
          60 * 60 * 1000,
          `[AntiSpam] ${violation.type} - Violación reiterada`
        );
        await this.sendWarning(message, violation, "TIMEOUT_1H");

        // Notificar moderadores
        await this.notifyModerators(message, violation, warnings);
      }
    } catch (error) {
      console.error("[AntiSpam] Error al aplicar acción:", error);
    }

    // Registrar evento
    this.logAuditEvent({
      type: "SPAM_DETECTED",
      guildId,
      timestamp: Date.now(),
      severity: violation.severity,
      description: `${violation.type}: ${violation.reason}`,
      affectedUsers: [userId],
      metadata: {
        violationType: violation.type,
        warningCount: warnings,
      },
    });
  }

  /**
   * Enviar advertencia al usuario
   */
  private async sendWarning(
    message: Message,
    violation: any,
    action: string = "DELETED"
  ): Promise<void> {
    const actionText = {
      DELETED: "Tu mensaje fue eliminado",
      TIMEOUT_5M: "Has recibido un timeout de 5 minutos",
      TIMEOUT_1H: "Has recibido un timeout de 1 hora",
    }[action] || "Acción tomada";

    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle("⚠️ Advertencia de Spam")
        .setDescription(`${actionText} en **${message.guild?.name}**`)
        .addFields({
          name: "Razón",
          value: violation.reason,
          inline: false,
        })
        .setTimestamp();

      await message.author.send({ embeds: [dmEmbed] }).catch(() => {
        // Si no se puede enviar DM, enviar en el canal
        if (message.channel.isTextBased()) {
          message.reply({
            embeds: [dmEmbed],
            flags: ["Ephemeral"],
          }).catch(console.error);
        }
      });
    } catch (error) {
      console.error("[AntiSpam] Error al enviar advertencia:", error);
    }
  }

  /**
   * Notificar a moderadores
   */
  private async notifyModerators(
    message: Message,
    violation: any,
    warnings: number
  ): Promise<void> {
    const config = stateManager.getOrCreateGuildState(message.guildId!).config;

    if (!config.alertChannelId) return;

    try {
      const channel = (await message.guild?.channels.fetch(config.alertChannelId)) as TextChannel;
      if (!channel?.isTextBased()) return;

      const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle("⚠️ Spam Detectado - Atención de Moderadores")
        .addFields(
          {
            name: "Usuario",
            value: `<@${message.author.id}> (${message.author.tag})`,
            inline: true,
          },
          {
            name: "Tipo",
            value: violation.type,
            inline: true,
          },
          {
            name: "Advertencias Acumuladas",
            value: `${warnings}`,
            inline: true,
          },
          {
            name: "Razón",
            value: violation.reason,
            inline: false,
          }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error("[AntiSpam] Error al notificar moderadores:", error);
    }
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
      usersWithWarnings: this.userSpamWarnings.size,
      maxWarnings: Math.max(...Array.from(this.userSpamWarnings.values()), 0),
    };
  }
}
