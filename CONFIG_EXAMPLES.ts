/**
 * EJEMPLOS DE CONFIGURACIÓN POR SERVIDOR
 * Diferentes perfiles de seguridad según necesidades
 */

import { GuildSecurityConfig } from "./src/types/index.js";

/**
 * PERFIL 1: Servidor Pequeño (< 1000 miembros)
 * Balance entre seguridad y experiencia de usuario
 */
export const SMALL_SERVER_CONFIG: Omit<GuildSecurityConfig, "guildId"> = {
  antiRaidEnabled: true,
  joinRateLimit: 8, // 8 usuarios
  joinRateLimitWindow: 15, // en 15 segundos
  minAccountAgeDays: 5, // Cuarentena si < 5 días
  lockdownVerificationLevel: "MEDIUM",

  antiSpamEnabled: true,
  spamMessageThreshold: 7, // 7 mensajes
  spamWindowMs: 8000, // en 8 segundos
  levenshteinThreshold: 80, // 80% similitud

  antiNukeEnabled: true,
  channelActionThreshold: 5,
  roleActionThreshold: 5,
  actionWindow: 15, // segundos
};

/**
 * PERFIL 2: Servidor Mediano (1000-10000 miembros)
 * Seguridad moderada, tolera actividad normal
 */
export const MEDIUM_SERVER_CONFIG: Omit<GuildSecurityConfig, "guildId"> = {
  antiRaidEnabled: true,
  joinRateLimit: 15, // 15 usuarios
  joinRateLimitWindow: 20, // en 20 segundos
  minAccountAgeDays: 7, // Cuarentena si < 7 días
  lockdownVerificationLevel: "HIGH",

  antiSpamEnabled: true,
  spamMessageThreshold: 10, // 10 mensajes
  spamWindowMs: 10000, // en 10 segundos
  levenshteinThreshold: 85, // 85% similitud

  antiNukeEnabled: true,
  channelActionThreshold: 8,
  roleActionThreshold: 8,
  actionWindow: 20, // segundos
};

/**
 * PERFIL 3: Servidor Grande (> 10000 miembros)
 * Máxima seguridad, vigilancia estricta
 */
export const LARGE_SERVER_CONFIG: Omit<GuildSecurityConfig, "guildId"> = {
  antiRaidEnabled: true,
  joinRateLimit: 25, // 25 usuarios
  joinRateLimitWindow: 30, // en 30 segundos
  minAccountAgeDays: 14, // Cuarentena si < 14 días
  lockdownVerificationLevel: "VERY_HIGH",

  antiSpamEnabled: true,
  spamMessageThreshold: 15, // 15 mensajes
  spamWindowMs: 15000, // en 15 segundos
  levenshteinThreshold: 90, // 90% similitud (muy estricto)

  antiNukeEnabled: true,
  channelActionThreshold: 10,
  roleActionThreshold: 10,
  actionWindow: 30, // segundos
};

/**
 * PERFIL 4: Servidor Gaming/Social (alto volumen)
 * Seguridad relajada, enfocado en entretenimiento
 */
export const GAMING_SERVER_CONFIG: Omit<GuildSecurityConfig, "guildId"> = {
  antiRaidEnabled: true,
  joinRateLimit: 50, // 50 usuarios
  joinRateLimitWindow: 60, // en 60 segundos
  minAccountAgeDays: 1, // Apenas restricción
  lockdownVerificationLevel: "LOW",

  antiSpamEnabled: true,
  spamMessageThreshold: 20, // 20 mensajes
  spamWindowMs: 30000, // en 30 segundos
  levenshteinThreshold: 75, // 75% similitud (menos restrictivo)

  antiNukeEnabled: true,
  channelActionThreshold: 15,
  roleActionThreshold: 15,
  actionWindow: 60, // segundos
};

/**
 * PERFIL 5: Servidor Corporativo/Community
 * Máxima vigilancia y cumplimiento
 */
export const CORPORATE_SERVER_CONFIG: Omit<GuildSecurityConfig, "guildId"> = {
  antiRaidEnabled: true,
  joinRateLimit: 5, // 5 usuarios (muy restrictivo)
  joinRateLimitWindow: 10, // en 10 segundos
  minAccountAgeDays: 30, // Cuarentena si < 30 días
  lockdownVerificationLevel: "VERY_HIGH",

  antiSpamEnabled: true,
  spamMessageThreshold: 3, // 3 mensajes (muy restrictivo)
  spamWindowMs: 5000, // en 5 segundos
  levenshteinThreshold: 95, // 95% similitud (extremadamente estricto)

  antiNukeEnabled: true,
  channelActionThreshold: 2, // Casi cualquier acción dispara alerta
  roleActionThreshold: 2,
  actionWindow: 10, // segundos
};

/**
 * FUNCIÓN: Seleccionar configuración según tipo de servidor
 */
export function selectConfigByServerType(
  serverType: "small" | "medium" | "large" | "gaming" | "corporate"
): Omit<GuildSecurityConfig, "guildId"> {
  const configs = {
    small: SMALL_SERVER_CONFIG,
    medium: MEDIUM_SERVER_CONFIG,
    large: LARGE_SERVER_CONFIG,
    gaming: GAMING_SERVER_CONFIG,
    corporate: CORPORATE_SERVER_CONFIG,
  };

  return configs[serverType];
}

/**
 * EJEMPLOS DE USO:
 *
 * // En tu bot, cuando se une a un nuevo servidor:
 *
 * client.on(Events.GuildCreate, (guild) => {
 *   let config;
 *
 *   if (guild.memberCount < 1000) {
 *     config = selectConfigByServerType("small");
 *   } else if (guild.memberCount < 10000) {
 *     config = selectConfigByServerType("medium");
 *   } else {
 *     config = selectConfigByServerType("large");
 *   }
 *
 *   const state = stateManager.getOrCreateGuildState(guild.id, {
 *     ...config,
 *     alertChannelId: guild.systemChannel?.id, // Opcional: usar canal de sistema
 *   });
 * });
 *
 * // O actualizar configuración manualmente:
 * stateManager.updateGuildConfig(guildId, {
 *   joinRateLimit: 10,
 *   levenshteinThreshold: 90,
 * });
 */
