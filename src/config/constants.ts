/**
 * CONFIGURACIÓN Y CONSTANTES GLOBALES
 */

import { GuildSecurityConfig } from "../types/index.js";

/** Configuración por defecto para nuevos servidores */
export const DEFAULT_GUILD_CONFIG: Omit<GuildSecurityConfig, "guildId"> = {
  antiRaidEnabled: true,
  joinRateLimit: 5, // 5 usuarios
  joinRateLimitWindow: 10, // en 10 segundos
  minAccountAgeDays: 7, // cuenta sospechosa si < 7 días
  lockdownVerificationLevel: "HIGH",

  antiSpamEnabled: true,
  spamMessageThreshold: 5, // 5 mensajes
  spamWindowMs: 5000, // en 5 segundos
  levenshteinThreshold: 85, // similitud de 85%+

  antiNukeEnabled: true,
  channelActionThreshold: 3, // 3 canales
  roleActionThreshold: 3, // 3 roles
  actionWindow: 10, // en 10 segundos
};

/** Umbrales de riesgo para cuentas nuevas */
export const ACCOUNT_RISK_THRESHOLDS = {
  CRITICAL: 75, // > 75 = acción inmediata
  HIGH: 50, // 50-75 = monitoreo
  MEDIUM: 25, // 25-49 = flagged
  LOW: 0, // 0-24 = normal
};

/** Cache TTL (Time To Live) */
export const CACHE_TTL = {
  USER_JOIN_METRICS: 1 * 60 * 1000, // 1 minuto
  SPAM_HISTORY: 5 * 60 * 1000, // 5 minutos
  RAID_ALERT: 5 * 60 * 1000, // 5 minutos
  ACTION_COOLDOWN: 30 * 1000, // 30 segundos
  GUILD_CONFIG: 10 * 60 * 1000, // 10 minutos
};

/** Límites de seguridad */
export const SECURITY_LIMITS = {
  MAX_USERS_PER_BATCH: 1000,
  MAX_CONCURRENT_ACTIONS: 50,
  RATE_LIMIT_RESET_MS: 60 * 1000, // 1 minuto
};

/** Mensajes de alerta */
export const ALERT_MESSAGES = {
  RAID_DETECTED: (count: number) =>
    `🚨 **RAID DETECTADO** - ${count} usuarios se unieron en poco tiempo. Verificación elevada a CELULAR VERIFICADO.`,
  
  QUARANTINE_ACCOUNTS: (count: number) =>
    `⚠️ **CUENTAS EN CUARENTENA** - ${count} cuentas sospechosas detectadas y bloqueadas.`,
  
  SPAM_DETECTED: (userId: string, count: number) =>
    `🛑 **SPAM DETECTADO** - <@${userId}> envió ${count} mensajes similares rápidamente.`,
  
  NUKE_ATTEMPT: (userId: string, actionType: string, count: number) =>
    `🚨 **INTENTO DE NUKE** - <@${userId}> intentó eliminar/crear ${count} ${actionType} en segundos.`,
  
  ADMIN_COMPROMISED: (userId: string) =>
    `💀 **ADMIN COMPROMETIDO** - Roles administrativos removidos de <@${userId}> por actividad sospechosa.`,
};

/** Colores para embeds */
export const COLORS = {
  DANGER: 0xff0000,
  WARNING: 0xffaa00,
  SUCCESS: 0x00ff00,
  INFO: 0x0099ff,
  CRITICAL: 0x990000,
};

/** Tiempos de acción */
export const ACTION_TIMEOUTS = {
  RAID_LOCKDOWN_DURATION: 30 * 60 * 1000, // 30 minutos
  SPAM_TIMEOUT: 5 * 60 * 1000, // 5 minutos
  QUARANTINE_DURATION: 24 * 60 * 60 * 1000, // 24 horas
  NUKE_COOLDOWN: 1 * 60 * 1000, // 1 minuto
};
