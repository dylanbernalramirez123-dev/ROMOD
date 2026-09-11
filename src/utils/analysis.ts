/**
 * UTILIDADES DE ANÁLISIS Y CÁLCULO
 */

/**
 * Calcular distancia de Levenshtein entre dos strings (implementación nativa)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calcular similitud de Levenshtein entre dos strings (0-100)
 */
export function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  if (str1.length === 0 && str2.length === 0) return 100;
  if (str1.length === 0 || str2.length === 0) return 0;

  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * Normalizar texto para comparación (eliminar espacios, caracteres especiales)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "") // Eliminar espacios
    .replace(/[^a-z0-9]/g, ""); // Eliminar caracteres especiales
}

/**
 * Detectar si hay menciones masivas o ghost pings
 */
export function detectMassMentions(content: string): {
  isMassMention: boolean;
  mentionCount: number;
  ghostPing: boolean;
} {
  // Contar menciones
  const mentionMatches = content.match(/<@!?\d+>/g);
  const mentionCount = mentionMatches?.length || 0;

  // Ghost ping si el contenido solo tiene menciones
  const ghostPing = mentionCount > 0 && mentionMatches?.join("").length === content.trim().length;

  // Masa mención si tiene muchas menciones (>5)
  const isMassMention = mentionCount > 5;

  return {
    isMassMention,
    mentionCount,
    ghostPing,
  };
}

/**
 * Calcular edad de cuenta en días
 */
export function getAccountAgeDays(createdTimestamp: number): number {
  const ageMs = Date.now() - createdTimestamp;
  return Math.floor(ageMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcular score de riesgo para cuenta nueva
 * 0-100, donde 100 es máximo riesgo
 */
export function calculateAccountRiskScore(
  accountAgeDays: number,
  joinCount: number,
  mentionMass: boolean,
  previousViolations: number = 0
): number {
  let score = 0;

  // Edad de cuenta (máximo 40 puntos)
  if (accountAgeDays < 1) score += 40;
  else if (accountAgeDays < 7) score += 30;
  else if (accountAgeDays < 30) score += 15;
  else if (accountAgeDays < 90) score += 5;

  // Uniones simultáneas (máximo 30 puntos)
  if (joinCount > 10) score += 30;
  else if (joinCount > 5) score += 20;
  else if (joinCount > 2) score += 10;

  // Mass mention en el primer mensaje (20 puntos)
  if (mentionMass) score += 20;

  // Violaciones previas (10 puntos por violation)
  score += Math.min(previousViolations * 10, 10);

  return Math.min(score, 100);
}

/**
 * Hash rápido para detectar mensajes duplicados
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convertir a 32-bit
  }
  return Math.abs(hash).toString(36);
}

/**
 * Convertir nivel de verificación Discord a string
 */
export function getVerificationLevelNumber(level: string): number {
  const levels: Record<string, number> = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    VERY_HIGH: 4,
  };
  return levels[level] || 0;
}

/**
 * Validar si un usuario es bot o sistema
 */
export function isSystemUser(userId: string, isBot?: boolean): boolean {
  return isBot === true || userId === "1" || userId === "2"; // IDs especiales de Discord
}

/**
 * Calcular tasa de unión (usuarios por segundo)
 */
export function calculateJoinRate(
  recentJoins: Array<{ joinTimestamp: number }>,
  windowMs: number
): number {
  if (recentJoins.length === 0) return 0;

  const now = Date.now();
  const validJoins = recentJoins.filter((join) => now - join.joinTimestamp < windowMs);

  if (validJoins.length === 0) return 0;

  // Tasa = usuarios por segundo
  return (validJoins.length / windowMs) * 1000;
}

/**
 * Comparar dos arrays de IDs para detectar cambios sospechosos
 */
export function detectAnomalousChange(
  previousIds: Set<string>,
  currentIds: Set<string>,
  changeThreshold: number = 0.5
): { isAnomalous: boolean; changeRate: number } {
  if (previousIds.size === 0) {
    return { isAnomalous: false, changeRate: 0 };
  }

  let addedCount = 0;
  let removedCount = 0;

  for (const id of currentIds) {
    if (!previousIds.has(id)) addedCount++;
  }

  for (const id of previousIds) {
    if (!currentIds.has(id)) removedCount++;
  }

  const changeRate = (addedCount + removedCount) / previousIds.size;
  const isAnomalous = changeRate > changeThreshold;

  return { isAnomalous, changeRate };
}
