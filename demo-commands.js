#!/usr/bin/env node

/**
 * DEMOSTRACIÓN: Cómo verificar y usar los comandos
 * Usar: node demo-commands.js
 */

console.log(`
╔════════════════════════════════════════════════════════════╗
║                   RoMod COMMANDS DEMO                      ║
╚════════════════════════════════════════════════════════════╝

📊 SLASH COMMANDS DISPONIBLES:

🚨 ANTI-RAID (/anti-raid)
   /anti-raid config setting:join_rate_limit value:10
   /anti-raid config setting:min_account_age value:7
   /anti-raid status
   /anti-raid quarantine action:list
   /anti-raid quarantine action:remove usuario:@user

🛑 ANTI-SPAM (/anti-spam)
   /anti-spam config setting:message_threshold value:5
   /anti-spam config setting:levenshtein_threshold value:85
   /anti-spam status
   /anti-spam warnings usuario:@user
   /anti-spam reset-warnings usuario:@user

💀 ANTI-NUKE (/anti-nuke)
   /anti-nuke config setting:channel_threshold value:3
   /anti-nuke config setting:role_threshold value:3
   /anti-nuke status
   /anti-nuke blocked-admins
   /anti-nuke unlock-admin admin:@admin

📊 UTILIDADES
   /stats (Ver estadísticas del bot)
   /config (Ver configuración completa)
   /help (Ayuda y comandos)
   /setup-alerts alert_channel:#alertas log_channel:#logs


════════════════════════════════════════════════════════════

🎯 EJEMPLO DE FLUJO DE CONFIGURACIÓN RÁPIDA:

1️⃣  Configura canales de alertas:
   /setup-alerts alert_channel:#seguridad log_channel:#logs

2️⃣  Verifica configuración inicial:
   /config

3️⃣  Ajusta Anti-Raid:
   /anti-raid config setting:join_rate_limit value:5
   /anti-raid status

4️⃣  Ajusta Anti-Spam:
   /anti-spam config setting:levenshtein_threshold value:85
   /anti-spam status

5️⃣  Ajusta Anti-Nuke:
   /anti-nuke config setting:channel_threshold value:3
   /anti-nuke status

6️⃣  Monitorea el bot:
   /stats


════════════════════════════════════════════════════════════

✅ COMANDOS IMPLEMENTADOS EN ESTE PROYECTO:

  1. ✅ antiRaidConfig       - Configurar Anti-Raid
  2. ✅ antiSpamConfig       - Configurar Anti-Spam
  3. ✅ antiNukeConfig       - Configurar Anti-Nuke
  4. ✅ statsCommand         - Ver estadísticas
  5. ✅ configCommand        - Ver configuración
  6. ✅ helpCommand          - Ver ayuda
  7. ✅ setupAlertsCommand   - Configurar canales


════════════════════════════════════════════════════════════

📁 ESTRUCTURA DE COMANDOS:

src/commands/
├── CommandHandler.ts           (Cargador de comandos)
├── types.ts                    (Tipos de comandos)
├── moderation/
│   ├── antiRaid.ts            (Anti-Raid commands)
│   ├── antiSpam.ts            (Anti-Spam commands)
│   └── antiNuke.ts            (Anti-Nuke commands)
└── general/
    └── utility.ts             (Stats, help, config, setup)


════════════════════════════════════════════════════════════

🚀 PRÓXIMAS ACCIONES:

1. npm install (instalar dependencias)
2. npm run build (compilar TypeScript)
3. npm start (iniciar bot)

Los comandos se cargarán automáticamente y estarán listos
para usar en los servidores donde el bot tenga permisos.


════════════════════════════════════════════════════════════

📖 Para más información:
   - Lee COMMANDS_GUIDE.md (guía completa de comandos)
   - Lee QUICK_START.md (inicio rápido)
   - Lee README.md (características principales)

`);
