# 📂 Estructura del Proyecto RoMod

```
RoMod/
│
├── 📋 CONFIGURACIÓN Y DOCUMENTACIÓN
│   ├── package.json                    # Dependencias y scripts
│   ├── tsconfig.json                   # Configuración TypeScript
│   ├── .env.example                    # Template de variables de entorno
│   ├── .gitignore                      # Archivos a ignorar en git
│   ├── .eslintrc.json                  # Configuración de linting (opcional)
│   │
│   ├── 📖 DOCUMENTACIÓN
│   ├── README.md                       # Guía principal y características
│   ├── QUICK_START.md                  # Guía rápida de instalación (5 minutos)
│   ├── ARCHITECTURE.md                 # Arquitectura técnica detallada
│   ├── CONFIG_EXAMPLES.ts              # Ejemplos de configuración
│   └── PROJECT_STRUCTURE.md            # Este archivo
│
├── 📦 CÓDIGO FUENTE (src/)
│   │
│   ├── index.ts
│   │   └── 🔧 Archivo Principal
│   │       ├─ Inicialización del cliente Discord
│   │       ├─ Setup de eventos
│   │       ├─ Instanciación de módulos
│   │       └─ Manejo de errores global
│   │
│   ├── 🎯 types/ (Definiciones TypeScript)
│   │   └── index.ts
│   │       ├─ RaidAlert
│   │       ├─ QuarantineAccount
│   │       ├─ UserJoinMetrics
│   │       ├─ GuildSecurityConfig
│   │       ├─ GuildState
│   │       ├─ MessageMetric
│   │       └─ AuditEvent
│   │
│   ├── ⚙️ config/ (Configuración Global)
│   │   └── constants.ts
│   │       ├─ DEFAULT_GUILD_CONFIG
│   │       ├─ ACCOUNT_RISK_THRESHOLDS
│   │       ├─ CACHE_TTL (Time To Live)
│   │       ├─ SECURITY_LIMITS
│   │       ├─ ALERT_MESSAGES
│   │       ├─ COLORS (para embeds)
│   │       └─ ACTION_TIMEOUTS
│   │
│   ├── 🛠️ utils/ (Utilidades Compartidas)
│   │   │
│   │   ├── StateManager.ts
│   │   │   ├─ Clase: StateManager (singleton)
│   │   │   ├─ Métodos públicos:
│   │   │   │  ├─ getOrCreateGuildState()
│   │   │   │  ├─ recordUserJoin()
│   │   │   │  ├─ getRecentJoins()
│   │   │   │  ├─ recordMessage()
│   │   │   │  ├─ getUserMessageHistory()
│   │   │   │  ├─ recordChannelAction()
│   │   │   │  ├─ recordRoleAction()
│   │   │   │  ├─ setRaidAlert()
│   │   │   │  ├─ updateGuildConfig()
│   │   │   │  └─ getStats()
│   │   │   └─ Características:
│   │   │      ├─ Estado aislado por Guild (Map)
│   │   │      ├─ Limpieza automática con TTL
│   │   │      ├─ Optimización de memoria
│   │   │      └─ Reutilización de datos
│   │   │
│   │   └── analysis.ts
│   │       ├─ calculateLevenshteinSimilarity()
│   │       ├─ normalizeText()
│   │       ├─ detectMassMentions()
│   │       ├─ getAccountAgeDays()
│   │       ├─ calculateAccountRiskScore()
│   │       ├─ hashString()
│   │       ├─ getVerificationLevelNumber()
│   │       ├─ isSystemUser()
│   │       ├─ calculateJoinRate()
│   │       └─ detectAnomalousChange()
│   │
│   └── 🔐 modules/ (Módulos de Seguridad)
│       │
│       ├── AntiRaid/
│       │   └── AntiRaidModule.ts
│       │       ├─ Detecta uniones masivas (raids)
│       │       ├─ Métodos principales:
│       │       │  ├─ handleMemberJoin()         [EVENT HANDLER]
│       │       │  ├─ analyzeQuarantineAccount()
│       │       │  ├─ checkRaidTrigger()
│       │       │  ├─ triggerRaidAlert()         [ACCIÓN]
│       │       │  ├─ elevateVerificationLevel()
│       │       │  ├─ pauseInvitations()
│       │       │  ├─ sendRaidAlert()
│       │       │  └─ getQuarantinedUsers()
│       │       └─ Funcionalidad:
│       │          ├─ Join Rate Limit (usuarios/segundo)
│       │          ├─ Detección de cuentas sospechosas
│       │          ├─ Scoring de riesgo (0-100)
│       │          ├─ Timeout automático de cuentas críticas
│       │          ├─ Elevación de verificación del servidor
│       │          └─ Pausa de invitaciones
│       │
│       ├── AntiSpam/
│       │   └── AntiSpamModule.ts
│       │       ├─ Detecta spam con análisis avanzado
│       │       ├─ Métodos principales:
│       │       │  ├─ handleMessage()            [EVENT HANDLER]
│       │       │  ├─ checkSpamPatterns()
│       │       │  ├─ checkMassMentions()
│       │       │  ├─ checkMessageBurst()
│       │       │  ├─ checkExactRepetition()
│       │       │  ├─ applySpamAction()          [ACCIÓN]
│       │       │  ├─ sendWarning()
│       │       │  └─ notifyModerators()
│       │       └─ Funcionalidad:
│       │          ├─ Levenshtein Similarity (detección de mutación)
│       │          ├─ Ghost Ping Detection
│       │          ├─ Mass Mention Detection
│       │          ├─ Exact Repetition Detection
│       │          ├─ Warnings progresivos
│       │          ├─ Timeouts automáticos
│       │          └─ Notificación a moderadores
│       │
│       └── AntiNuke/
│           └── AntiNukeModule.ts
│               ├─ Detecta intentos de nuke masivo
│               ├─ Métodos principales:
│               │  ├─ handleChannelDelete()      [EVENT HANDLER]
│               │  ├─ handleChannelCreate()      [EVENT HANDLER]
│               │  ├─ handleRoleDelete()         [EVENT HANDLER]
│               │  ├─ handleRoleCreate()         [EVENT HANDLER]
│               │  ├─ checkNukeThreshold()
│               │  ├─ triggerNukeDefense()       [ACCIÓN]
│               │  ├─ stripAdminRoles()
│               │  ├─ sendNukeAlert()
│               │  ├─ notifyGuildOwner()
│               │  └─ isAdminLocked()
│               └─ Funcionalidad:
│                  ├─ Monitoreo de canales/roles
│                  ├─ Detección de pánico (múltiples acciones)
│                  ├─ Bloqueo instantáneo de admins comprometidos
│                  ├─ Remoción de roles administrativos
│                  ├─ Notificación al propietario (DM)
│                  └─ Auditoría de eventos críticos
│
├── 🧪 tests/
│   └── unit.test.ts
│       ├─ testLevenshteinSimilarity()
│       ├─ testAccountAgeDays()
│       ├─ testAccountRiskScore()
│       ├─ testMassMentions()
│       ├─ testTextNormalization()
│       └─ runAllTests()
│
├── 📊 OUTPUT ESPERADO
│   ├── dist/ (generado por compilación)
│   │   ├── index.js
│   │   ├── config/
│   │   ├── utils/
│   │   ├── modules/
│   │   └── types/
│   │
│   ├── node_modules/ (generado por npm install)
│   │   ├── discord.js/
│   │   ├── dotenv/
│   │   └── ... más dependencias
│   │
│   └── .env (crear manualmente)
│       └── TOKEN=your_token_here
│
└── 📋 FLUJO DE EJECUCIÓN

    Discord Event
         ↓
    index.ts Handler
         ↓
    Module Selection
         ├→ AntiRaidModule.handleMemberJoin()
         ├→ AntiSpamModule.handleMessage()
         └→ AntiNukeModule.handleChannel/Role*()
         ↓
    StateManager Update
         ├→ recordUserJoin()
         ├→ recordMessage()
         └→ recordChannelAction()
         ↓
    Threat Analysis
         ├→ calculateRiskScore()
         ├→ calculateLevenshteinSimilarity()
         └→ checkThresholds()
         ↓
    Action Execution
         ├→ Timeout Member
         ├→ Delete Message
         ├→ Remove Roles
         ├→ Elevate Verification
         └─→ Send Alerts/Notifications
         ↓
    Audit Logging
         └→ AuditEvent Registered
```

---

## 🎯 Puntos Clave

### Multi-Servidor
- Cada servidor tiene su propio `GuildState`
- Estados aislados en Map<guildId, GuildState>
- Configuración independiente por guild

### Optimización de Memoria
- TTL automático para cada item
- Cleanup periódico cada 5 minutos
- Límites máximos por mapa
- Maps eliminadas cuando quedan vacías

### Modularidad
- Módulos independientes
- Fácil de extender
- Eventos claramente separados
- Reutilización de StateManager

### Seguridad
- Validación en cada paso
- Permisos verificados antes de actuar
- Audit logging de eventos críticos
- Manejo de errores robusto

---

## 🚀 Cómo Usar Esta Estructura

```bash
# Desarrollo
npm install
npm run dev      # TypeScript + auto-reload

# Producción
npm run build    # Compilar a dist/
npm start        # Ejecutar dist/index.js

# Testing
npm test         # Ejecutar tests

# Verificación
node verify-structure.js  # Verificar integridad
```

---

**Última actualización:** Septiembre 2024
**Versión:** 1.0
**Estado:** ✅ Producción
