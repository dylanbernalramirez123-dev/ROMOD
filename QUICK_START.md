# 🚀 GUÍA RÁPIDA DE INICIO

## 5 Minutos para Tener RoMod Funcionando

### Paso 1: Preparar Proyecto
```bash
cd RoMod
npm install
```

### Paso 2: Crear .env
```bash
# Copiar .env.example a .env
cp .env.example .env

# Editar .env y agregar tu token
TOKEN=your_bot_token_here
```

### Paso 3: Compilar
```bash
npm run build
```

### Paso 4: Iniciar Bot
```bash
npm start
```

**Esperado:**
```
✅ [bot_name] está listo
📊 Servidores conectados: X
🔒 Módulos activos: AntiRaid (v1.0)
```

---

## 🎯 Primeros Pasos

### 1. Obtener Token del Bot
1. Ir a [Discord Developer Portal](https://discord.com/developers/applications)
2. Crear Nueva Aplicación
3. Ir a "Bot" → Copiar token
4. Guardar en `.env` como `TOKEN=...`

### 2. Permisos Requeridos
En Developer Portal → Bot → OAuth2:

```
Scopes:
✓ bot

Permissions:
✓ Manage Guild
✓ Manage Channels
✓ Manage Roles
✓ Manage Messages
✓ Moderate Members
✓ Send Messages
✓ Embed Links
✓ Read Message History
✓ View Audit Log
```

### 3. Invitar Bot a Servidor
1. Copiar OAuth2 URL generada
2. Abrir en navegador
3. Seleccionar servidor
4. Autorizar

### 4. Configurar Canales (Opcional)
```bash
# En tu servidor Discord, obtener IDs de canales
Clic derecho → Copiar ID del Usuario/Canal

# Actualizar configuración
stateManager.updateGuildConfig(guildId, {
  alertChannelId: "123456789",
  logChannelId: "987654321"
});
```

---

## 🔍 Troubleshooting

### Problema: "TOKEN no está definido"
**Solución:**
1. Verificar que `.env` existe
2. Verificar `TOKEN=` está configurado
3. No usar comillas alrededor del token

### Problema: Bot no responde
**Verificar:**
```bash
# ¿El bot está online?
# Discord → Servidor → Ver si RoMod está online

# ¿Intents habilitados?
# Developer Portal → Bot → Privileged Gateway Intents
# ✓ Message Content Intent
# ✓ Server Members Intent
```

### Problema: "Missing Permissions"
**Solución:**
1. Verificar permisos del bot en servidor
2. Rol del bot debe estar ARRIBA de los roles que va a modificar
3. Bot no puede modificar dueño del servidor

### Problema: "Cannot find module"
**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules
npm install

# Compilar TypeScript
npm run build
```

### Problema: Memory leak
**Verificar:**
```typescript
const stats = stateManager.getStats();
console.log(stats);
// Si memory crece continuamente:
// 1. Revisar TTL settings
// 2. Verificar cleanup timer
// 3. Buscar Map memory leaks
```

---

## 📊 Monitoreo del Bot

### Ver Estadísticas
```bash
# Agregar a tu bot (ejemplo con slash command):
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'stats') {
    const stats = stateManager.getStats();
    const raidStats = antiRaidModule.getStats();
    const spamStats = antiSpamModule.getStats();
    
    await interaction.reply({
      content: `
        📊 **Estadísticas de RoMod**
        Servidores: ${stats.totalGuilds}
        Usuarios rastreados: ${stats.totalTrackedUsers}
        Memoria: ${stats.memoryUsageMB}MB
        
        🚨 Raids activos: ${raidStats.activeAlerts}
        🛑 Users en cuarentena: ${raidStats.quarantinedUsers}
        
        ⚠️ Users con warnings: ${spamStats.usersWithWarnings}
      `
    });
  }
});
```

### Logs en Tiempo Real
```bash
# En desarrollo (con hot-reload)
npm run dev

# En producción (output limpio)
npm start 2>&1 | tee bot.log

# Seguir logs en vivo
tail -f bot.log
```

---

## 🛠️ Desarrollo

### Estructura de Carpetas
```
RoMod/
├── src/
│   ├── index.ts                    # Archivo principal
│   ├── config/
│   │   └── constants.ts            # Constantes globales
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript
│   ├── utils/
│   │   ├── StateManager.ts         # Gestor de estado
│   │   └── analysis.ts             # Algoritmos
│   └── modules/
│       ├── AntiRaid/
│       │   └── AntiRaidModule.ts
│       ├── AntiSpam/
│       │   └── AntiSpamModule.ts
│       └── AntiNuke/
│           └── AntiNukeModule.ts
├── dist/                           # Compilado (generado)
├── package.json
├── tsconfig.json
├── .env.example
├── .env                            # Tu configuración (no comitear)
└── README.md
```

### Editar Código
```bash
# Terminal 1: Dev server con hot-reload
npm run dev

# Terminal 2: Ver logs en vivo
tail -f console.log

# Cambios se aplican automáticamente
```

### Compilar a Producción
```bash
npm run build
# Genera carpeta dist/ con JavaScript compilado

npm start
# Ejecuta desde dist/
```

---

## 🚀 Deploy en Servidor

### Opción 1: PM2 (Recomendado)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Compilar
npm run build

# Iniciar con PM2
pm2 start dist/index.js --name "romod"

# Ver logs
pm2 logs romod

# Reiniciar
pm2 restart romod

# Detener
pm2 stop romod
```

### Opción 2: Docker
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

```bash
# Build
docker build -t romod .

# Run
docker run -d --name romod -e TOKEN=your_token romod

# Logs
docker logs -f romod
```

### Opción 3: Systemd (Linux)
```ini
# /etc/systemd/system/romod.service
[Unit]
Description=RoMod Discord Bot
After=network.target

[Service]
Type=simple
User=romod
WorkingDirectory=/home/romod/RoMod
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
EnvironmentFile=/home/romod/RoMod/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable romod
sudo systemctl start romod
sudo systemctl status romod
```

---

## 📈 Personalización

### Cambiar Umbrales
```typescript
// En index.ts o nueva función:
stateManager.updateGuildConfig(guildId, {
  joinRateLimit: 10,              // Cambiar threshold
  levenshteinThreshold: 90,       // Más estricto
  minAccountAgeDays: 14,          // Más restrictivo
});
```

### Agregar Comando de Configuración
```typescript
// Ejemplo: /config anti-raid 10
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'config') {
    const module = interaction.options.getString('module');
    const value = interaction.options.getNumber('value');
    
    stateManager.updateGuildConfig(interaction.guildId, {
      joinRateLimit: value
    });
    
    await interaction.reply(`✅ Configurado: ${module} = ${value}`);
  }
});
```

### Cambiar Mensajes de Alerta
```typescript
// En src/config/constants.ts:
export const ALERT_MESSAGES = {
  RAID_DETECTED: (count: number) =>
    `🚨 **TU MENSAJE PERSONALIZADO** - ${count} usuarios...`,
  // ...
};
```

---

## ⚡ Performance Tips

### 1. Aumentar Limits en Servidores Grandes
```typescript
const LARGE_GUILD_CONFIG = {
  joinRateLimit: 50,          // Más usuarios
  joinRateLimitWindow: 60,    // Ventana más larga
  levenshteinThreshold: 80,   // Menos estricto
};
```

### 2. Optimizar TTL para Cache
```typescript
export const CACHE_TTL = {
  USER_JOIN_METRICS: 2 * 60 * 1000,    // Aumentar si necesario
  SPAM_HISTORY: 10 * 60 * 1000,        // 10 minutos
  RAID_ALERT: 10 * 60 * 1000,
  ACTION_COOLDOWN: 60 * 1000,
};
```

### 3. Desactivar Módulos Innecesarios
```typescript
// En config por guild
config.antiSpamEnabled = false;  // Si no lo usas
config.antiNukeEnabled = false;  // Si no lo usas
```

---

## 📚 Recursos

- [Discord.js Documentation](https://discord.js.org/)
- [Discord Developer Portal](https://discord.com/developers/)
- [Intents Explanation](https://discord.com/developers/docs/topics/gateway#gateway-intents)
- [Audit Log Events](https://discord.com/developers/docs/resources/audit-log#audit-log-events)

---

## 💬 Soporte

Para problemas o preguntas:
1. Revisar los logs (`console output`)
2. Verificar Troubleshooting section arriba
3. Revisar [ARCHITECTURE.md](ARCHITECTURE.md)
4. Revisar [README.md](README.md)

---

**Happy securing! 🛡️**
