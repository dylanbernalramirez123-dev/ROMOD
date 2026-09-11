# 🎮 GUÍA DE SLASH COMMANDS - ROMOD

## Lista Completa de Comandos

### 🚨 **Anti-Raid** (`/anti-raid`)

#### Subcomando: `config`
Cambiar configuración de Anti-Raid
```
/anti-raid config setting:join_rate_limit value:10
/anti-raid config setting:join_rate_window value:15
/anti-raid config setting:min_account_age value:7
/anti-raid config setting:verification_level value:HIGH
```

**Parámetros:**
- `join_rate_limit`: Número de usuarios para activar alerta (recomendado: 5-10)
- `join_rate_window`: Segundos para considerar uniones masivas (recomendado: 10-20)
- `min_account_age`: Días mínimos de edad de cuenta para considerar sospechosa (recomendado: 7-14)
- `verification_level`: NONE | LOW | MEDIUM | HIGH | VERY_HIGH

#### Subcomando: `status`
Ver estado actual del módulo
```
/anti-raid status
```

**Información mostrada:**
- Estado (Activo/Inactivo)
- Join Rate Limit
- Ventana de tiempo
- Edad mínima de cuenta
- Nivel de verificación
- Canal de alertas configurado

#### Subcomando: `quarantine`
Gestionar cuentas en cuarentena (bloqueadas por sospechosas)
```
/anti-raid quarantine action:list
/anti-raid quarantine action:remove usuario:@user
```

---

### 🛑 **Anti-Spam** (`/anti-spam`)

#### Subcomando: `config`
Cambiar configuración de Anti-Spam
```
/anti-spam config setting:message_threshold value:5
/anti-spam config setting:spam_window value:5000
/anti-spam config setting:levenshtein_threshold value:85
```

**Parámetros:**
- `message_threshold`: Número de mensajes para activar (recomendado: 5-10)
- `spam_window`: Milisegundos de ventana de análisis (recomendado: 5000-10000)
- `levenshtein_threshold`: Porcentaje de similitud para detectar (0-100, recomendado: 85-95)

#### Subcomando: `status`
Ver estado actual del módulo
```
/anti-spam status
```

#### Subcomando: `warnings`
Ver warnings de un usuario
```
/anti-spam warnings usuario:@user
```

**Información:**
- Número de warnings acumulados
- Historial de infracciones
- Estado del timeout (si aplicable)

#### Subcomando: `reset-warnings`
Remover warnings de un usuario
```
/anti-spam reset-warnings usuario:@user
```

---

### 💀 **Anti-Nuke** (`/anti-nuke`)

#### Subcomando: `config`
Cambiar configuración de Anti-Nuke
```
/anti-nuke config setting:channel_threshold value:3
/anti-nuke config setting:role_threshold value:3
/anti-nuke config setting:action_window value:10
```

**Parámetros:**
- `channel_threshold`: Número de canales para activar pánico (recomendado: 2-5)
- `role_threshold`: Número de roles para activar pánico (recomendado: 2-5)
- `action_window`: Segundos para considerar acciones simultáneas (recomendado: 10-20)

#### Subcomando: `status`
Ver estado actual del módulo
```
/anti-nuke status
```

#### Subcomando: `blocked-admins`
Ver admins actualmente bloqueados
```
/anti-nuke blocked-admins
```

#### Subcomando: `unlock-admin`
Desbloquear manualmente a un admin
```
/anti-nuke unlock-admin admin:@admin
```

---

### 📊 **Utilidades Generales**

#### `stats`
Ver estadísticas del bot
```
/stats
```

**Información:**
- Total de servidores donde está activo
- Usuarios siendo rastreados
- Memoria RAM utilizada

#### `config`
Ver configuración completa del servidor
```
/config
```

**Información:**
- Estado de todos los módulos
- Valores de configuración de cada módulo
- Canales configurados para alertas

#### `help`
Ver ayuda general
```
/help
```

#### `setup-alerts`
Configurar canales de alertas y logs
```
/setup-alerts alert_channel:#alertas log_channel:#logs
```

**Parámetros:**
- `alert_channel`: Donde se envían alertas de seguridad (REQUERIDO)
- `log_channel`: Donde se registran eventos (OPCIONAL)

---

## 🎯 Guías de Uso por Caso

### Caso 1: Configuración Inicial (Servidor Pequeño)
```
1. /setup-alerts alert_channel:#seguridad log_channel:#logs
2. /anti-raid config setting:join_rate_limit value:8
3. /anti-raid config setting:join_rate_window value:15
4. /anti-spam config setting:message_threshold value:7
5. /anti-nuke config setting:channel_threshold value:5
6. /config (verificar todo esté bien)
```

### Caso 2: Servidor Gaming (Alto Volumen)
```
/anti-raid config setting:join_rate_limit value:50
/anti-raid config setting:join_rate_window value:60
/anti-spam config setting:message_threshold value:20
/anti-spam config setting:spam_window value:30000
/anti-nuke config setting:channel_threshold value:15
```

### Caso 3: Servidor Corporativo (Máxima Seguridad)
```
/anti-raid config setting:join_rate_limit value:5
/anti-raid config setting:min_account_age value:30
/anti-raid config setting:verification_level value:VERY_HIGH
/anti-spam config setting:message_threshold value:3
/anti-spam config setting:levenshtein_threshold value:95
/anti-nuke config setting:channel_threshold value:2
```

### Caso 4: Gestionar Spam
```
1. /anti-spam warnings usuario:@spammer
   (Ver cuántos warnings tiene)

2. Si tiene muchos:
   /anti-spam reset-warnings usuario:@spammer
   (Limpiar registro)
```

### Caso 5: Admin Comprometido
```
1. /anti-nuke blocked-admins
   (Ver si está bloqueado)

2. Si está bloqueado:
   /anti-nuke unlock-admin admin:@admin
   (Desbloquearlo para que actúe normalmente)
```

---

## ⚙️ Parámetros Recomendados por Tipo de Servidor

### Servidor Pequeño (< 1000 miembros)
```
Anti-Raid:
  - Join Rate Limit: 8
  - Join Rate Window: 15s
  - Min Account Age: 5 días
  - Verification: MEDIUM

Anti-Spam:
  - Message Threshold: 7
  - Spam Window: 8000ms
  - Levenshtein: 80%

Anti-Nuke:
  - Channel Threshold: 5
  - Role Threshold: 5
  - Action Window: 15s
```

### Servidor Mediano (1000-10000)
```
Anti-Raid:
  - Join Rate Limit: 15
  - Join Rate Window: 20s
  - Min Account Age: 7 días
  - Verification: HIGH

Anti-Spam:
  - Message Threshold: 10
  - Spam Window: 10000ms
  - Levenshtein: 85%

Anti-Nuke:
  - Channel Threshold: 8
  - Role Threshold: 8
  - Action Window: 20s
```

### Servidor Grande (> 10000)
```
Anti-Raid:
  - Join Rate Limit: 25
  - Join Rate Window: 30s
  - Min Account Age: 14 días
  - Verification: VERY_HIGH

Anti-Spam:
  - Message Threshold: 15
  - Spam Window: 15000ms
  - Levenshtein: 90%

Anti-Nuke:
  - Channel Threshold: 10
  - Role Threshold: 10
  - Action Window: 30s
```

---

## 🔐 Permisos Requeridos

**Comandos de Configuración requieren:**
- ✓ Manage Server (Administrator)
- ✓ Manage Guild

**Comandos de Estadísticas:**
- Cualquier miembro puede usar `/stats`
- Solo admins pueden usar `/config`

**Ejemplo de error de permisos:**
```
❌ No tienes permisos para usar este comando
```

---

## 🚀 Registro de Comandos

### Desarrollo (Rápido - ~3 segundos)
```
En .env:
DEV_GUILD_IDS=123456789,987654321

Los comandos aparecen instantáneamente en esos servidores
```

### Producción (Global - ~1 hora)
```
En .env:
DEV_GUILD_IDS=

Los comandos se registran globalmente
Tardan hasta 1 hora en aparecer en todos los servidores
```

---

## 📊 Ejemplos de Respuestas

### Respuesta Exitosa de Configuración
```
✅ Anti-Raid Configurado
join_rate_limit: 5 → 10
```

### Respuesta de Error
```
❌ Error
Levenshtein threshold debe estar entre 0 y 100
```

### Respuesta de Status
```
🛡️ Estado Anti-Raid
Estado: ✅ Activo
Join Rate Limit: 5 usuarios
Ventana de Tiempo: 10 segundos
Edad Mínima de Cuenta: 7 días
Nivel de Verificación: HIGH
Canal de Alertas: #seguridad
```

---

## 💡 Tips y Trucos

### Tip 1: Testing de Comandos
Usar `/help` para ver la lista completa sin usar ningún comando

### Tip 2: Configuración Rápida
```
/setup-alerts alert_channel:#alertas
/config
(Ve los valores por defecto)
```

### Tip 3: Monitoreo
```
Ejecutar periódicamente:
/stats (ver crecimiento)
/config (verificar configuración)
```

### Tip 4: Ajuste Fino
Empezar con valores conservadores y ajustar según sea necesario:
- Si hay muchos falsos positivos → Aumentar thresholds
- Si no detecta ataques → Disminuir thresholds

---

## ❓ FAQ

**P: ¿Cómo cambio la sensibilidad del Anti-Spam?**
R: Usa `/anti-spam config setting:levenshtein_threshold value:XX` (menor = más sensible)

**P: ¿Qué pasa si un admin se bloquea accidentalmente?**
R: Usa `/anti-nuke unlock-admin admin:@admin` para desbloquearlo

**P: ¿Cómo veo todos los cambios que hizo el bot?**
R: Configura `/setup-alerts` con un canal de logs

**P: ¿Puedo usar comandos sin ser admin?**
R: No, todos requieren permisos de Manage Server excepto `/stats`

**P: ¿Los comandos funcionan en DM?**
R: No, solo funcionan en servidores

---

**Última actualización:** Septiembre 2024
**Versión:** 1.0
