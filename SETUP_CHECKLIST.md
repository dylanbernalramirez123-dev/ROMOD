# 🎯 CHECKLIST: PRIMEROS PASOS DESPUÉS DE INICIAR EL BOT

## ✅ Después de ejecutar `npm start`

### Paso 1: Verificar que el bot está online
- [ ] Ver en Discord que RoMod aparece en línea
- [ ] Status muestra "🛡️ Protegiendo servidores"

### Paso 2: Registrar los comandos
Los comandos se cargan automáticamente cuando el bot inicia. Hay dos opciones:

**Opción A: Desarrollo (Rápido - ~3 segundos)**
```bash
# En .env, agregar tu servidor de prueba:
DEV_GUILD_IDS=123456789

# Los comandos aparecen instantáneamente en ese servidor
```

**Opción B: Producción (Global - ~1 hora)**
```bash
# Dejar DEV_GUILD_IDS vacío en .env
# Los comandos se registran globalmente
# Tardan hasta 1 hora en aparecer en todos los servidores
```

### Paso 3: Primer Comando
En tu servidor Discord, intenta:
```
/help
```
Deberías ver la lista de comandos disponibles

### Paso 4: Configuración Inicial
Ejecuta en orden:

```
1. /setup-alerts alert_channel:#alertas log_channel:#logs
   (Crea los canales si no existen primero)

2. /config
   (Verifica la configuración)

3. /stats
   (Verifica que todo está funcionando)
```

### Paso 5: Personalizar Seguridad
Según el tipo de servidor:

**Servidor Pequeño:**
```
/anti-raid config setting:join_rate_limit value:8
/anti-spam config setting:message_threshold value:7
/anti-nuke config setting:channel_threshold value:5
```

**Servidor Grande:**
```
/anti-raid config setting:join_rate_limit value:25
/anti-spam config setting:message_threshold value:15
/anti-nuke config setting:channel_threshold value:10
```

### Paso 6: Testing
Prueba que los módulos funcionan (SOLO EN TESTING):

**Test Anti-Spam:**
```
Envía varios mensajes similares rápidamente
El bot debería eliminarlos
```

**Test Anti-Raid:**
```
Invita múltiples bots/cuentas rápidamente
El bot debería detectar y elevar verificación
```

---

## 📋 Comandos Frecuentes

### Administración
```
/config                    - Ver todo configurado
/stats                     - Ver estadísticas
/setup-alerts             - Configurar canales
```

### Anti-Raid
```
/anti-raid status         - Ver estado
/anti-raid config         - Cambiar settings
/anti-raid quarantine list - Ver en cuarentena
```

### Anti-Spam
```
/anti-spam status         - Ver estado
/anti-spam warnings @user - Ver warnings de usuario
```

### Anti-Nuke
```
/anti-nuke status         - Ver estado
/anti-nuke blocked-admins - Ver admins bloqueados
```

---

## 🚨 Troubleshooting Comandos

### ❌ "Comando no encontrado"
**Solución:**
1. Esperar 1 hora si usas producción
2. O agregar `DEV_GUILD_IDS` a .env para desarrollo
3. Reiniciar el bot: `npm start`

### ❌ "No tienes permisos"
**Solución:**
1. Verificar que tienes rol "Manage Server"
2. Algunos comandos son solo para admin

### ❌ Comandos no aparecen en autocompletado
**Solución:**
1. Asegúrate de estar en un servidor (no DM)
2. Escribe `/` lentamente para cargar
3. Reinicia Discord

---

## 🔐 Permisos Necesarios del Bot

Verifica que el bot tiene estos permisos:
- [ ] ✓ Manage Guild
- [ ] ✓ Manage Channels
- [ ] ✓ Manage Roles
- [ ] ✓ Manage Messages
- [ ] ✓ Moderate Members
- [ ] ✓ Send Messages

Si faltan permisos:
1. Ve a Configuración → Roles
2. Selecciona el rol del bot
3. Activa los permisos necesarios
4. Arrastra el rol del bot ARRIBA de otros roles

---

## 📊 Monitoreo Continuo

### Diariamente
```
/stats
(Verificar que el bot está activo y funcionando)
```

### Semanalmente
```
/config
(Revisar que la configuración sigue siendo la correcta)
```

### Cuando hay problemas
```
1. /anti-raid status
2. /anti-spam status
3. /anti-nuke status
(Verificar estados individuales)
```

---

## ✨ Tips Avanzados

### Tip 1: Configuración por Perfiles
```
# Gaming (alto volumen):
/anti-raid config setting:join_rate_limit value:50
/anti-spam config setting:message_threshold value:20

# Corporate (máxima seguridad):
/anti-raid config setting:join_rate_limit value:5
/anti-spam config setting:levenshtein_threshold value:95
```

### Tip 2: Testing sin Afectar
- Crear servidor de prueba
- Probar configuración ahí
- Copiar la buena al servidor principal

### Tip 3: Logs y Auditoría
```
/setup-alerts alert_channel:#alertas log_channel:#logs
(Todos los eventos se registran en #logs)
```

### Tip 4: Backup de Configuración
Tomar screenshot de `/config` para tener respaldo

---

## 🎯 Checklist de Seguridad

- [ ] Bot está en línea
- [ ] Comandos registrados
- [ ] Canales de alertas configurados
- [ ] Anti-Raid activado y configurado
- [ ] Anti-Spam activado y configurado
- [ ] Anti-Nuke activado y configurado
- [ ] Permisos verificados
- [ ] Rol del bot está arriba de otros
- [ ] Configuración testeada
- [ ] Owner notificado de setup

---

## 📞 Soporte

**Si algo no funciona:**

1. Revisar logs en Discord (comandos ejecutados)
2. Ver `/config` para verificar valores
3. Revisar [COMMANDS_GUIDE.md](COMMANDS_GUIDE.md)
4. Revisar [QUICK_START.md](QUICK_START.md)
5. Revisar [ARCHITECTURE.md](ARCHITECTURE.md)

---

**¡Tu servidor está protegido con RoMod! 🛡️**
