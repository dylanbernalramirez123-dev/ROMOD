# 🛡️ RoMod - Security Bot Avanzado para Discord

**Ingeniero Principal de Ciberseguridad | discord.js v14**

Un bot de seguridad ultra-avanzado diseñado para superar las capacidades de bots comerciales como XN Protect o Xenon. **Ahora con Slash Commands funcionales** ⚡

---

## 📋 Características Principales

### 1. 🚨 Anti-Raid Heurístico Avanzado
- **Detección en tiempo real**: Analiza la tasa de unión (Join Rate Limit)
- **Sistema de cuarentena**: Identifica cuentas sospechosas (creadas hace < X días)
- **Respuesta automática**:
  - Eleva nivel de verificación a CELULAR VERIFICADO
  - Pausa invitaciones del servidor
  - Aplica timeout a cuentas de alto riesgo
- **Scoring de riesgo (0-100)** basado en:
  - Edad de la cuenta
  - Coincidencia con joins masivos
  - Menciones masivas iniciales
- **Comandos**:
  - `/anti-raid config` - Cambiar settings
  - `/anti-raid status` - Ver estado
  - `/anti-raid quarantine` - Gestionar cuarentena

### 2. 🛑 Anti-Spam con Análisis de Frecuencia
- **Levenshtein Similarity**: Detecta spam mutado (modificaciones de caracteres)
- **Fuzzy Matching**: Compara similitud entre mensajes
- **Detección de Ghost Pings**: Menciones masivas disfrazadas
- **Acciones progresivas**:
  - Aviso (Warning)
  - Timeout 5 minutos
  - Timeout 1 hora + Reporte
- **Comandos**:
  - `/anti-spam config` - Cambiar settings
  - `/anti-spam status` - Ver estado
  - `/anti-spam warnings` - Ver warnings
  - `/anti-spam reset-warnings` - Limpiar warnings

### 3. 💀 Anti-Nuke de Canales y Roles
- **Monitoreo en tiempo real**: Eventos de eliminación/creación
- **Detección de pánico**: Supresión de múltiples canales/roles en segundos
- **Acción instantánea**:
  - Remover roles administrativos del atacante
  - Bloquear temporalmente al admin comprometido
  - Notificar al propietario por DM
  - Registrar evento crítico
- **Comandos**:
  - `/anti-nuke config` - Cambiar settings
  - `/anti-nuke status` - Ver estado
  - `/anti-nuke blocked-admins` - Ver admins bloqueados
  - `/anti-nuke unlock-admin` - Desbloquear admin

---

## � Slash Commands Disponibles

### ⚡ Anti-Raid
```
/anti-raid config setting:join_rate_limit value:10
/anti-raid config setting:min_account_age value:7
/anti-raid status
/anti-raid quarantine action:list
```

### 🛑 Anti-Spam
```
/anti-spam config setting:message_threshold value:5
/anti-spam config setting:levenshtein_threshold value:85
/anti-spam status
/anti-spam warnings usuario:@user
/anti-spam reset-warnings usuario:@user
```

### 💀 Anti-Nuke
```
/anti-nuke config setting:channel_threshold value:3
/anti-nuke config setting:role_threshold value:3
/anti-nuke status
/anti-nuke blocked-admins
```

### 📊 Utilidades
```
/stats - Ver estadísticas del bot
/config - Ver configuración completa
/help - Ver ayuda y todos los comandos
/setup-alerts alert_channel:#alertas log_channel:#logs
```

**Para más detalles:** Ver [COMMANDS_GUIDE.md](COMMANDS_GUIDE.md)

---

## �🏗️ Arquitectura

### Estructura Multi-Servidor
```
Cliente Discord
    ↓
StateManager (Estado aislado por Guild)
    ├── AntiRaidModule
    ├── AntiSpamModule
    └── AntiNukeModule
```

### Componentes Clave

**StateManager** (`src/utils/StateManager.ts`)
- Gestión centralizada del estado por servidor
- Caché con TTL automático
- Limpieza periódica de datos expirados
- Optimización de memoria

**Módulos de Seguridad**
- `AntiRaidModule.ts` - Detección y bloqueo de raids
- `AntiSpamModule.ts` - Análisis y bloqueo de spam
- `AntiNukeModule.ts` - Protección contra nukes

**Utilidades**
- `analysis.ts` - Cálculos de riesgo, Levenshtein, hashing
- `constants.ts` - Configuración global y mensajes

---

## 🚀 Instalación y Setup

### Requisitos
- Node.js 16+
- npm o yarn
- Token de bot Discord con intents habilitados

### Paso 1: Instalación
```bash
cd RoMod
npm install
```

### Paso 2: Configuración
Crear `.env` en la raíz:
```
TOKEN=your_bot_token_here
ENVIRONMENT=development
LOG_LEVEL=info
```

### Paso 3: Compilar TypeScript
```bash
npm run build
```

### Paso 4: Ejecutar
```bash
npm start
```

O en desarrollo con hot-reload:
```bash
npm run dev
```

---

## ⚙️ Configuración por Servidor

Cada servidor tiene su propia configuración. Valores por defecto:

```typescript
{
  // Anti-Raid
  antiRaidEnabled: true,
  joinRateLimit: 5,                    // 5 usuarios
  joinRateLimitWindow: 10,              // en 10 segundos
  minAccountAgeDays: 7,                 // Cuarentena si < 7 días
  
  // Anti-Spam
  antiSpamEnabled: true,
  spamMessageThreshold: 5,              // 5 mensajes
  spamWindowMs: 5000,                   // en 5 segundos
  levenshteinThreshold: 85,             // 85% similitud
  
  // Anti-Nuke
  antiNukeEnabled: true,
  channelActionThreshold: 3,            // 3 canales
  roleActionThreshold: 3,               // 3 roles
  actionWindow: 10,                     // en 10 segundos
  
  // Notificaciones
  alertChannelId: "123456789",          // Canal de alertas
  logChannelId: "987654321",            // Canal de logs
}
```

---

## 📊 Sistema de Scoring de Riesgo

### Cálculo de Riesgo para Cuentas Nueva

```
Score Máximo: 100 puntos

Edad de Cuenta:
  - < 1 día    → +40 puntos
  - < 7 días   → +30 puntos
  - < 30 días  → +15 puntos
  - < 90 días  → +5 puntos

Contexto de Join:
  - > 10 joins simultáneos  → +30 puntos
  - > 5 joins simultáneos   → +20 puntos
  - > 2 joins simultáneos   → +10 puntos

Mass Mention Inicial:
  - Si detectado → +20 puntos

Violaciones Previas:
  - Por cada violación → +10 puntos (máximo +10)
```

### Umbrales
- **CRÍTICO (> 75)**: Timeout inmediato 24h
- **ALTO (50-75)**: Monitoreo intenso
- **MEDIO (25-49)**: Flagged para revisión
- **BAJO (0-24)**: Normal

---

## 🔍 Algoritmos Principales

### 1. Levenshtein Distance (Anti-Spam)
```typescript
Compara similitud entre strings
Resultado: 0-100%

Ejemplo:
"hola mundo" vs "hola mundoo" = 90% similitud
"SPAM123" vs "SP@M456" = 72% similitud (después de normalizar)
```

### 2. Join Rate Calculation
```
tasa = (usuarios_en_ventana / tiempo_ventana_ms) * 1000
= usuarios por segundo

Si tasa > threshold → Alerta de raid
```

### 3. Anomaly Detection
```
changeRate = (usuarios_nuevos + usuarios_removidos) / usuarios_totales

Si changeRate > 50% → Activar defensas
```

---

## 📈 Optimización de Memoria

### Caché con TTL
```typescript
USER_JOIN_METRICS: 1 minuto
SPAM_HISTORY: 5 minutos
RAID_ALERT: 5 minutos
ACTION_COOLDOWN: 30 segundos
```

### Limpieza Automática
- Temporizador cada 5 minutos
- Limpieza de datos expirados
- Eliminación de usuarios si historial vacío

### Monitoreo
```typescript
const stats = stateManager.getStats();
// {
//   totalGuilds: 150,
//   totalTrackedUsers: 2500,
//   memoryUsageMB: 45.23
// }
```

---

## 🎯 Casos de Uso

### Escenario 1: Raid Masivo
```
T=0:00 - 8 usuarios se unen en 5 segundos
T=0:01 - RoMod detecta patrón
T=0:02 - Verificación elevada a CELULAR VERIFICADO
T=0:03 - Invitaciones pausadas
T=0:04 - Propietario notificado
Resultado: ✓ Raid bloqueado
```

### Escenario 2: Spam Mutado
```
Usuario envía:
1. "compraminherbs.com"
2. "c0mpraminerbs.com"
3. "compr@minerbs.com"

RoMod detecta: 86% similitud (> 85%)
Acción: Mensaje eliminado + Timeout 5min
```

### Escenario 3: Nuke Attempt
```
Mod comprometido elimina:
- 3 canales en 8 segundos
- 4 roles en 10 segundos

RoMod detecta: Supera threshold
Acción:
1. Remover roles administrativos
2. Bloquear mod por 1 hora
3. DM al propietario
Resultado: ✓ Nuke prevenido
```

---

## 🔐 Permisos Necesarios

El bot requiere los siguientes permisos en Discord:

```
✓ Manage Guild
✓ Manage Channels
✓ Manage Roles
✓ Manage Messages
✓ Moderate Members (Timeout)
✓ Send Messages
✓ Embed Links
✓ Read Message History
✓ View Audit Log
```

---

## 🛠️ Extensión Futura

El bot está diseñado para ser extensible. Para agregar nuevos módulos:

```typescript
// 1. Crear nueva clase en src/modules/NuevoModulo/
export class NuevoModule {
  constructor(client: Client) { ... }
  async handleEvent(data: any) { ... }
}

// 2. Importar en index.ts
import { NuevoModule } from "./modules/NuevoModulo/NuevoModule.js";
const nuevoModule = new NuevoModule(client);

// 3. Agregar event listener
client.on(Events.SomeEvent, (data) => {
  nuevoModule.handleEvent(data);
});
```

---

## 📊 Logging y Auditoría

Todos los eventos críticos se registran con la estructura:

```typescript
{
  type: "RAID_DETECTED" | "SPAM_DETECTED" | "NUKE_ATTEMPT",
  guildId: string,
  timestamp: number,
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  description: string,
  affectedUsers: string[],
  metadata: { ... }
}
```

---

## 🚨 Reporte de Problemas

Si encuentras bugs:
1. Revisa los logs (`console output`)
2. Verifica la configuración del servidor
3. Confirma permisos del bot

---

## 📄 Licencia

Este bot está diseñado como ejemplo educativo de ciberseguridad avanzada en Discord.

**Creado con ♥️ por Ingeniero Principal de Ciberseguridad**
