/**
 * GESTOR DE ESTADO CENTRALIZADO MULTI-SERVIDOR
 * Manejo isolado de estado por Guild con caché y TTL
 */

import { GuildState, GuildSecurityConfig, UserJoinMetrics, MessageMetric } from "../types/index.js";
import { DEFAULT_GUILD_CONFIG, CACHE_TTL } from "../config/constants.js";

export class StateManager {
  private guildStates: Map<string, GuildState> = new Map();
  private cleanupIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Obtener o crear estado de un servidor
   */
  getOrCreateGuildState(guildId: string, config?: Partial<GuildSecurityConfig>): GuildState {
    if (this.guildStates.has(guildId)) {
      return this.guildStates.get(guildId)!;
    }

    const newState: GuildState = {
      guildId,
      config: {
        guildId,
        ...DEFAULT_GUILD_CONFIG,
        ...config,
      } as GuildSecurityConfig,
      recentJoins: new Map(),
      userMessageHistory: new Map(),
      recentChannelActions: new Map(),
      recentRoleActions: new Map(),
      isLocked: false,
      lockedChannelIds: new Set(),
    };

    this.guildStates.set(guildId, newState);
    this.setupCleanupTimer(guildId);

    return newState;
  }

  /**
   * Obtener estado existente
   */
  getGuildState(guildId: string): GuildState | undefined {
    return this.guildStates.get(guildId);
  }

  /**
   * Registrar join de usuario
   */
  recordUserJoin(guildId: string, metrics: UserJoinMetrics): void {
    const state = this.getOrCreateGuildState(guildId);
    state.recentJoins.set(metrics.userId, metrics);

    // Auto-limpieza después de TTL
    setTimeout(() => {
      state.recentJoins.delete(metrics.userId);
    }, CACHE_TTL.USER_JOIN_METRICS);
  }

  /**
   * Obtener joins recientes en ventana de tiempo
   */
  getRecentJoins(
    guildId: string,
    windowMs: number = CACHE_TTL.USER_JOIN_METRICS
  ): UserJoinMetrics[] {
    const state = this.getGuildState(guildId);
    if (!state) return [];

    const now = Date.now();
    return Array.from(state.recentJoins.values()).filter(
      (join) => now - join.joinTimestamp < windowMs
    );
  }

  /**
   * Registrar mensaje para anti-spam
   */
  recordMessage(guildId: string, userId: string, metric: MessageMetric): void {
    const state = this.getOrCreateGuildState(guildId);
    
    if (!state.userMessageHistory.has(userId)) {
      state.userMessageHistory.set(userId, []);
    }

    state.userMessageHistory.get(userId)!.push(metric);

    // Auto-limpieza
    setTimeout(() => {
      const messages = state.userMessageHistory.get(userId);
      if (messages) {
        const filtered = messages.filter(
          (msg) => Date.now() - msg.timestamp < CACHE_TTL.SPAM_HISTORY
        );
        if (filtered.length === 0) {
          state.userMessageHistory.delete(userId);
        } else {
          state.userMessageHistory.set(userId, filtered);
        }
      }
    }, CACHE_TTL.SPAM_HISTORY);
  }

  /**
   * Obtener historial de mensajes en ventana de tiempo
   */
  getUserMessageHistory(
    guildId: string,
    userId: string,
    windowMs: number = CACHE_TTL.SPAM_HISTORY
  ): MessageMetric[] {
    const state = this.getGuildState(guildId);
    if (!state) return [];

    const messages = state.userMessageHistory.get(userId) || [];
    const now = Date.now();

    return messages.filter((msg) => now - msg.timestamp < windowMs);
  }

  /**
   * Registrar acción de canal/rol para anti-nuke
   */
  recordChannelAction(guildId: string, userId: string): void {
    const state = this.getOrCreateGuildState(guildId);
    state.recentChannelActions.set(userId, Date.now());

    setTimeout(() => {
      state.recentChannelActions.delete(userId);
    }, CACHE_TTL.ACTION_COOLDOWN);
  }

  recordRoleAction(guildId: string, userId: string): void {
    const state = this.getOrCreateGuildState(guildId);
    state.recentRoleActions.set(userId, Date.now());

    setTimeout(() => {
      state.recentRoleActions.delete(userId);
    }, CACHE_TTL.ACTION_COOLDOWN);
  }

  /**
   * Obtener acciones recientes
   */
  getRecentChannelActions(
    guildId: string,
    windowMs: number = CACHE_TTL.ACTION_COOLDOWN
  ): string[] {
    const state = this.getGuildState(guildId);
    if (!state) return [];

    const now = Date.now();
    return Array.from(state.recentChannelActions.entries())
      .filter(([_, timestamp]) => now - timestamp < windowMs)
      .map(([userId]) => userId);
  }

  getRecentRoleActions(
    guildId: string,
    windowMs: number = CACHE_TTL.ACTION_COOLDOWN
  ): string[] {
    const state = this.getGuildState(guildId);
    if (!state) return [];

    const now = Date.now();
    return Array.from(state.recentRoleActions.entries())
      .filter(([_, timestamp]) => now - timestamp < windowMs)
      .map(([userId]) => userId);
  }

  /**
   * Establecer alerta de raid activa
   */
  setRaidAlert(guildId: string, alert: any): void {
    const state = this.getOrCreateGuildState(guildId);
    state.activeRaidAlert = alert;

    setTimeout(() => {
      if (state.activeRaidAlert?.timestamp === alert.timestamp) {
        state.activeRaidAlert = undefined;
      }
    }, CACHE_TTL.RAID_ALERT);
  }

  /**
   * Obtener alerta de raid activa
   */
  getActiveRaidAlert(guildId: string): any | undefined {
    const state = this.getGuildState(guildId);
    return state?.activeRaidAlert;
  }

  /**
   * Actualizar configuración del servidor
   */
  updateGuildConfig(guildId: string, config: Partial<GuildSecurityConfig>): void {
    const state = this.getOrCreateGuildState(guildId);
    state.config = {
      ...state.config,
      ...config,
      guildId, // Asegurar que guildId no se sobrescriba
    };
  }

  /**
   * Limpiar estado de servidor
   */
  cleanupGuildState(guildId: string): void {
    const interval = this.cleanupIntervals.get(guildId);
    if (interval) {
      clearInterval(interval);
      this.cleanupIntervals.delete(guildId);
    }

    this.guildStates.delete(guildId);
  }

  /**
   * Limpiar todos los estados
   */
  cleanupAll(): void {
    for (const [guildId] of this.cleanupIntervals) {
      this.cleanupGuildState(guildId);
    }
    this.guildStates.clear();
  }

  /**
   * Configurar temporizador de limpieza automática
   */
  private setupCleanupTimer(guildId: string): void {
    // Limpiar datos expirados cada 5 minutos
    const interval = setInterval(() => {
      const state = this.guildStates.get(guildId);
      if (!state) return;

      const now = Date.now();

      // Limpiar joins expirados
      for (const [userId, join] of state.recentJoins) {
        if (now - join.joinTimestamp > CACHE_TTL.USER_JOIN_METRICS) {
          state.recentJoins.delete(userId);
        }
      }

      // Limpiar historial de mensajes expirado
      for (const [userId, messages] of state.userMessageHistory) {
        const filtered = messages.filter(
          (msg) => now - msg.timestamp < CACHE_TTL.SPAM_HISTORY
        );
        if (filtered.length === 0) {
          state.userMessageHistory.delete(userId);
        } else {
          state.userMessageHistory.set(userId, filtered);
        }
      }
    }, 5 * 60 * 1000); // Cada 5 minutos

    this.cleanupIntervals.set(guildId, interval);
  }

  /**
   * Obtener estadísticas de estado
   */
  getStats(): {
    totalGuilds: number;
    totalTrackedUsers: number;
    memoryUsageMB: number;
  } {
    let totalTrackedUsers = 0;

    for (const state of this.guildStates.values()) {
      totalTrackedUsers += state.recentJoins.size + state.userMessageHistory.size;
    }

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    return {
      totalGuilds: this.guildStates.size,
      totalTrackedUsers,
      memoryUsageMB: Math.round(memoryUsage * 100) / 100,
    };
  }
}

// Instancia singleton
export const stateManager = new StateManager();
