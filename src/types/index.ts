/**
 * TIPOS Y INTERFACES PARA ROMOD SECURITY BOT
 * Arquitectura segura para multi-servidor
 */

import { Guild, User, TextChannel } from "discord.js";

/** Estado de raid detectado */
export interface RaidAlert {
  guildId: string;
  timestamp: number;
  joinCount: number;
  userIds: string[];
  isActive: boolean;
  suspiciousAccounts: QuarantineAccount[];
}

/** Cuenta sospechosa en cuarentena */
export interface QuarantineAccount {
  userId: string;
  accountAge: number; // en ms
  joinTimestamp: number;
  riskScore: number; // 0-100
  reason: string;
}

/** Estadísticas de usuario en tiempo real */
export interface UserJoinMetrics {
  userId: string;
  joinTimestamp: number;
  accountCreatedAt: number;
  accountAgeDays: number;
  ipHash?: string;
}

/** Configuración por servidor */
export interface GuildSecurityConfig {
  guildId: string;
  
  // Anti-Raid
  antiRaidEnabled: boolean;
  joinRateLimit: number; // X usuarios
  joinRateLimitWindow: number; // en segundos
  minAccountAgeDays: number; // cuenta sospechosa si < X días
  lockdownVerificationLevel: VerificationLevelType;
  
  // Anti-Spam
  antiSpamEnabled: boolean;
  spamMessageThreshold: number; // mensajes en ventana
  spamWindowMs: number;
  levenshteinThreshold: number; // 0-100, similaridad para detectar mutación
  
  // Anti-Nuke
  antiNukeEnabled: boolean;
  channelActionThreshold: number; // X acciones en Y segundos
  roleActionThreshold: number;
  actionWindow: number; // segundos
  
  // Canales y roles
  alertChannelId?: string;
  logChannelId?: string;
  modRoleId?: string;
}

/** Tipos de niveles de verificación */
export type VerificationLevelType = 
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "VERY_HIGH";

/** Estado global por servidor */
export interface GuildState {
  guildId: string;
  config: GuildSecurityConfig;
  
  // Raid tracking
  recentJoins: Map<string, UserJoinMetrics>;
  activeRaidAlert?: RaidAlert;
  
  // Spam tracking
  userMessageHistory: Map<string, MessageMetric[]>;
  
  // Nuke tracking
  recentChannelActions: Map<string, number>; // userId -> timestamp
  recentRoleActions: Map<string, number>;
  
  // Lockdown state
  isLocked: boolean;
  lockdownTimestamp?: number;
  lockedChannelIds: Set<string>;
}

/** Métrica de mensaje para anti-spam */
export interface MessageMetric {
  timestamp: number;
  content: string;
  mentions: number;
  contentHash: string;
}

/** Evento de auditoría */
export interface AuditEvent {
  type: "RAID_DETECTED" | "SPAM_DETECTED" | "NUKE_ATTEMPT" | "LOCKDOWN" | "ACTION_TAKEN";
  guildId: string;
  timestamp: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  affectedUsers?: string[];
  metadata?: Record<string, unknown>;
}
