# 🏗️ ARQUITECTURA TÉCNICA DETALLADA - ROMOD

## Índice
1. [Flujo General](#flujo-general)
2. [State Management](#state-management)
3. [Módulos de Seguridad](#módulos-de-seguridad)
4. [Algoritmos](#algoritmos)
5. [Manejo de Errores](#manejo-de-errores)

---

## Flujo General

```
Discord Events
    ↓
Event Handler (index.ts)
    ↓
Module Selection
    ├─ AntiRaidModule
    ├─ AntiSpamModule
    └─ AntiNukeModule
    ↓
StateManager (actualizar estado)
    ↓
Action Execution
    ├─ Remover rol
    ├─ Timeout usuario
    ├─ Eliminar mensaje
    ├─ Elevar verificación
    └─ Enviar notificaciones
    ↓
Audit Logging
```

---

## State Management

### Estructura de Estado por Guild

```typescript
GuildState {
  guildId: "123456789"
  config: GuildSecurityConfig
  
  // Anti-Raid
  recentJoins: Map<userId, UserJoinMetrics>
  activeRaidAlert?: RaidAlert
  
  // Anti-Spam
  userMessageHistory: Map<userId, MessageMetric[]>
  
  // Anti-Nuke
  recentChannelActions: Map<userId, timestamp>
  recentRoleActions: Map<userId, timestamp>
  
  // Lockdown
  isLocked: boolean
  lockdownTimestamp?: number
  lockedChannelIds: Set<string>
}
```

### Ciclo de Vida de Datos

```
Data Created
    ↓
    ├─ Registrar en Map
    ├─ Iniciar TTL Timer
    └─ Agregar a estado
    ↓
TTL Expiration
    ↓
    ├─ Auto-delete de Map
    ├─ Cleanup automático cada 5min
    └─ Liberar memoria
```

### Optimización de Memoria

**Maps Usados:**
- `recentJoins`: O(1) lookup de joins
- `userMessageHistory`: O(n) iteración para análisis
- `recentChannelActions`: O(1) tracking de acciones

**Estrategia de Limpieza:**
1. TTL individual por item (auto-delete)
2. Cleanup periódico cada 5 minutos
3. Remoción de usuarios cuando list está vacía
4. Límites máximos de items por mapa

---

## Módulos de Seguridad

### 1. AntiRaidModule

#### Flujo de Ejecución
```
handleMemberJoin()
    ↓
    ├─ Registrar join metrics
    ├─ Analyzequ quarantine account
    │   ├─ Calcular account age
    │   ├─ Calcular risk score
    │   └─ Si CRITICAL: aplicar timeout
    └─ checkRaidTrigger()
        ├─ Contar joins en ventana
        └─ Si >= threshold:
            ├─ Elevar verificación
            ├─ Pausar invitaciones
            ├─ Enviar alerta
            └─ Notificar propietario
```

#### Risk Calculation
```
accountAge + joinContext + massMention + violations = Score (0-100)

Acción por Score:
- 0-24:   Normal
- 25-49:  Monitoreo
- 50-75:  Flagged
- 75-100: ACCIÓN INMEDIATA
```

#### Datos Rastreados
```
UserJoinMetrics {
  userId: string
  joinTimestamp: number
  accountCreatedAt: number
  accountAgeDays: number
  TTL: 1 minuto
}
```

### 2. AntiSpamModule

#### Patrones Detectados

**Patrón 1: Mass Mentions**
```
Regex: /<@!?\d+>/g

Acción si:
- mentionCount > 5 → Mass mention
- ghostPing detectado → Ghost ping

TTL: Mensaje eliminado inmediatamente
```

**Patrón 2: Spam Mutado (Levenshtein)**
```
Algoritmo:
1. Normalizar texto (lowercase, remove special chars)
2. Calcular distance entre últimos N mensajes
3. Si similarity >= 85%: ¡SPAM!

Ejemplo:
"COMPRA AQUI" vs "C0MPR4 AQU1" = 90% similitud
→ Detectado y eliminado
```

**Patrón 3: Repetición Exacta**
```
Hash: hashString(normalizeText(msg))

Si mismo hash 2+ veces en ventana:
- 2 repeticiones: Warning
- 3+ repeticiones: Timeout
```

#### Sistema de Warnings Progresivo
```
Warning 1
    ↓
Timeout 5min
    ↓
Timeout 1h + Reporte a mods
    ↓
[Expira después 1 hora]
```

### 3. AntiNukeModule

#### Eventos Monitoreados
```
ChannelDelete
ChannelCreate
RoleDelete
RoleCreate
```

#### Detección de Pánico
```
Contar acciones en ventana de tiempo:
- Si # channelActions >= threshold: ¡PÁNICO!
- Si # roleActions >= threshold: ¡PÁNICO!

Acción:
1. Identificar usuario (audit log)
2. Remover todos sus roles admin
3. Bloquear por 1 hora
4. Notificar propietario
5. Log de auditoría crítico
```

#### Admin Roles Removidos
```
Roles con permisos administrativos:
- Administrator
- ManageGuild
- ManageChannels
- ManageRoles
- KickMembers
- BanMembers
- ManageMessages
- MentionEveryone

Si tiene alguno: REMOVER
```

---

## Algoritmos

### 1. Levenshtein Distance
```typescript
Distance entre "casa" y "caza":
  casa
  caza
  
Cambios necesarios: 1 (s→z)
Máxima distancia: 4
Similitud: ((4-1)/4) * 100 = 75%
```

**Implementación:**
```
Time: O(m*n) donde m, n = longitud strings
Space: O(m*n)
```

### 2. Join Rate Calculation
```
JoinRate = (# users in window / window_ms) * 1000
         = users per second

Ejemplo:
- 10 users en 5000ms
- Rate = (10 / 5000) * 1000 = 2 users/sec
- Si threshold es 0.5 users/sec → RAID
```

### 3. Account Risk Score
```
Base: 0 puntos

Edad:
  < 1d:   40
  < 7d:   30
  < 30d:  15
  < 90d:  5
  
Contexto:
  > 10 joins:  30
  > 5 joins:   20
  > 2 joins:   10
  
Mass mention: 20
Violations:   +10 por violation

Total: MIN(sum, 100)
```

### 4. String Normalization
```
Entrada: "HoLa M@ndO!!!"
↓
Pasos:
1. toLowerCase()    → "hola m@ndo!!!"
2. Remove spaces    → "holam@ndo!!!"
3. Remove special   → "holomndo"
↓
Salida: "holomndo"
```

---

## Flujos de Ataque Prevenidos

### Ataque 1: Raid Masivo
```
T0: [10 bots se unen en 3 segundos]
  ↓
T1: RoMod detecta > threshold
  ↓
T2: Verificación → VERY_HIGH
  ↓
T3: Invitaciones eliminadas
  ↓
T4: Cuentas nuevas en timeout
  ↓
Result: ✅ Raid bloqueado
```

### Ataque 2: Spam Evasión
```
Usuario envía:
1. "VISIT WEBSITE.RU" (Spam)
2. "VIS1T W3BSITE.RU" (Mutado)
3. "V1S1T W3B5ITE.RU" (Más mutado)

RoMod analiza similitud:
- Msg1 vs Msg2: 88% → ✗
- Msg2 vs Msg3: 91% → ✗
- Detecta: Patrón claro de evasión
- Acción: Timeout 1h

Result: ✅ Spam bloqueado
```

### Ataque 3: Nuke Attempt
```
Admin comprometido:
[Elimina 5 canales en 8 segundos]
  ↓
RoMod detecta > threshold
  ↓
Acción inmediata:
1. Fetch audit logs → Identifica admin
2. Remover roles admin
3. Aplicar timeout
4. DM al propietario
5. Lock admin por 1h
  ↓
Result: ✅ Nuke detenido
```

---

## Manejo de Errores

### Estrategia
```
Try-Catch en cada handler
    ↓
    ├─ Log error a console
    ├─ NO bloquear procesamiento
    └─ Continuar próximo evento
```

### Escenarios Manejados

**1. Fetch Audit Log Falla**
```typescript
try {
  const logs = await guild.fetchAuditLogs(...);
} catch (error) {
  console.error("[AntiNuke] Error fetching audit logs");
  return; // Skip pero no crash
}
```

**2. Remover Rol Sin Permisos**
```typescript
try {
  await member.roles.remove(role);
} catch (error) {
  console.error("Rol no removible (insuficientes permisos)");
  // Log pero continuar con siguiente rol
}
```

**3. Miembro No Encontrado**
```typescript
const member = await guild.members.fetch(userId)
  .catch(() => null);

if (!member) {
  console.warn("Miembro no encontrado");
  return; // Safe exit
}
```

---

## Performance

### Benchmarks Esperados
```
Anti-Raid Detection:
- Time to detect: < 100ms
- Time to escalate verification: 200-500ms
- Memory per guild: ~50KB

Anti-Spam Detection:
- Time per message: < 50ms
- Levenshtein calculation: 5-20ms
- Memory per user: ~10KB

Anti-Nuke Detection:
- Time to detect: < 150ms
- Time to strip admin roles: 500ms-2s
- Memory overhead: minimal
```

### Escalabilidad
```
Servidores: Sin límite (MapHashable)
Usuarios simultáneos: 10,000+
Mensajes/segundo: 1,000+
Memory: ~2-5MB por 100 servidores activos
```

---

## Monitoreo

### Estadísticas Disponibles

```typescript
// Anti-Raid Stats
const raidStats = antiRaidModule.getStats();
// {
//   quarantinedUsers: 5,
//   activeAlerts: 2
// }

// Anti-Spam Stats
const spamStats = antiSpamModule.getStats();
// {
//   usersWithWarnings: 12,
//   maxWarnings: 3
// }

// State Manager Stats
const stateStats = stateManager.getStats();
// {
//   totalGuilds: 150,
//   totalTrackedUsers: 2500,
//   memoryUsageMB: 45.23
// }
```

---

## Seguridad

### Validaciones
```
1. Ignorar bots siempre
2. Ignorar mensajes privados
3. Validar permisos antes de actuar
4. Verificar que rol es editable
5. Timeout máximo: 28 días (límite Discord)
```

### Prevención de Abuse
```
- Rate limit en acciones críticas
- Cooldown entre acciones
- No actuar sobre el propietario
- No actuar sobre roles protegidos
- Audit logging de todas las acciones
```

---

## Extensibilidad

### Agregar Nuevo Módulo

```typescript
// 1. Crear archivo: src/modules/MyModule/MyModule.ts
export class MyModule {
  constructor(private client: Client) {}
  
  async handleEvent(data: any) {
    // Lógica aquí
  }
}

// 2. Importar en index.ts
import { MyModule } from "./modules/MyModule/MyModule.js";
const myModule = new MyModule(client);

// 3. Agregar listener
client.on(Events.SomeEvent, (data) => {
  myModule.handleEvent(data);
});
```

### Agregar Nuevo Algoritmo

```typescript
// src/utils/analysis.ts
export function myNewAlgorithm(input: string): number {
  // Implementar
  return score;
}

// Usar en módulo
const score = myNewAlgorithm(userInput);
```

---

**Documento actualizado: 2024**
**Versión: 1.0**
