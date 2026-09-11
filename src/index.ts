/**
 * ARCHIVO PRINCIPAL - ROMOD SECURITY BOT
 * Inicialización y setup de eventos
 */

import { Client, GatewayIntentBits, Events, Collection } from "discord.js";
import dotenv from "dotenv";
import { AntiRaidModule } from "./modules/AntiRaid/AntiRaidModule.js";
import { AntiSpamModule } from "./modules/AntiSpam/AntiSpamModule.js";
import { AntiNukeModule } from "./modules/AntiNuke/AntiNukeModule.js";
import { stateManager } from "./utils/StateManager.js";
import { CommandHandler } from "./commands/CommandHandler.js";

dotenv.config();

// Validar configuración
if (!process.env.TOKEN) {
  throw new Error("TOKEN no está definido en .env");
}

// Crear cliente de Discord con intents necesarios
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.DirectMessageTyping,
  ],
});

// Inicializar módulos
const antiRaidModule = new AntiRaidModule(client);
const antiSpamModule = new AntiSpamModule(client);
const antiNukeModule = new AntiNukeModule(client);

// Inicializar command handler
const commandHandler = new CommandHandler(client, process.env.TOKEN);

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Bot listo y conectado
 */
client.once(Events.ClientReady, async () => {
  console.log(`\n✅ ${client.user?.username} está listo`);
  console.log(`📊 Servidores conectados: ${client.guilds.cache.size}`);
  console.log(`🔒 Módulos activos: AntiRaid | AntiSpam | AntiNuke\n`);

  // Cargar comandos
  await commandHandler.loadCommands();

  // Registrar comandos (usar guildIds para desarrollo - más rápido)
  // Para producción, comentar guildIds para registro global
  const devGuildIds = process.env.DEV_GUILD_IDS?.split(",") || [];
  await commandHandler.registerCommands(devGuildIds.length > 0 ? devGuildIds : undefined);

  // Status
  if (client.user) {
    client.user.setActivity("🛡️ Protegiendo servidores", { type: "WATCHING" });
  }
});

/**
 * Nuevo servidor se une al bot
 */
client.on(Events.GuildCreate, (guild) => {
  console.log(`\n➕ Nuevo servidor: ${guild.name} (${guild.id})`);
  console.log(`👥 Miembros: ${guild.memberCount}`);

  // Inicializar estado del servidor
  stateManager.getOrCreateGuildState(guild.id);

  // Mensaje de bienvenida (opcional)
  const systemChannel = guild.systemChannel;
  if (systemChannel?.isTextBased()) {
    systemChannel.send(
      "🛡️ **RoMod Security Bot** activado. Módulos de protección en línea:\n" +
        "• Anti-Raid Heurístico\n" +
        "• Anti-Spam con Fuzzy Match\n" +
        "• Anti-Nuke de Canales y Roles"
    ).catch(console.error);
  }
});

/**
 * Servidor elimina al bot
 */
client.on(Events.GuildDelete, (guild) => {
  console.log(`\n➖ Bot removido de: ${guild.name} (${guild.id})`);
  stateManager.cleanupGuildState(guild.id);
});

/**
 * MANEJADOR: Nuevo miembro se une
 * ⚡ Lógica Anti-Raid
 */
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    // Ignorar bots
    if (member.user.bot) return;

    console.log(`[Join] ${member.user.tag} se unió a ${member.guild.name}`);

    // Ejecutar módulo Anti-Raid
    await antiRaidModule.handleMemberJoin(member);
  } catch (error) {
    console.error("Error en GuildMemberAdd handler:", error);
  }
});

/**
 * MANEJADOR: Miembro deja el servidor
 */
client.on(Events.GuildMemberRemove, (member) => {
  // Remover del tracking
  const state = stateManager.getGuildState(member.guild.id);
  if (state) {
    state.recentJoins.delete(member.id);
    state.userMessageHistory.delete(member.id);
  }

  console.log(`[Leave] ${member.user.tag} se fue de ${member.guild.name}`);
});

/**
 * MANEJADOR: Nuevo mensaje
 * ⚡ Lógica Anti-Spam
 */
client.on(Events.MessageCreate, async (message) => {
  try {
    await antiSpamModule.handleMessage(message);
  } catch (error) {
    console.error("Error en MessageCreate handler:", error);
  }
});

/**
 * MANEJADOR: Canal eliminado
 * ⚡ Lógica Anti-Nuke
 */
client.on(Events.ChannelDelete, async (channel) => {
  try {
    await antiNukeModule.handleChannelDelete(channel);
  } catch (error) {
    console.error("Error en ChannelDelete handler:", error);
  }
});

/**
 * MANEJADOR: Canal creado
 * ⚡ Lógica Anti-Nuke
 */
client.on(Events.ChannelCreate, async (channel) => {
  try {
    await antiNukeModule.handleChannelCreate(channel);
  } catch (error) {
    console.error("Error en ChannelCreate handler:", error);
  }
});

/**
 * MANEJADOR: Rol eliminado
 * ⚡ Lógica Anti-Nuke
 */
client.on(Events.RoleDelete, async (role) => {
  try {
    await antiNukeModule.handleRoleDelete(role);
  } catch (error) {
    console.error("Error en RoleDelete handler:", error);
  }
});

/**
 * MANEJADOR: Rol creado
 * ⚡ Lógica Anti-Nuke
 */
client.on(Events.RoleCreate, async (role) => {
  try {
    await antiNukeModule.handleRoleCreate(role);
  } catch (error) {
    console.error("Error en RoleCreate handler:", error);
  }
});

/**
 * MANEJADOR: Interacción (Slash Commands)
 * ⚡ Procesamiento de comandos
 */
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await commandHandler.handleCommand(interaction);
  } catch (error) {
    console.error("Error en manejador de interacción:", error);
  }
});

/**
 * Error de cliente
 */
client.on("error", (error) => {
  console.error("Error del cliente Discord:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Promise rechazada sin manejar:", reason);
});

// ============================================
// INICIALIZACIÓN
// ============================================

async function main() {
  try {
    console.log("\n🚀 Iniciando RoMod Security Bot...\n");
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("Error fatal al iniciar bot:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n📛 Apagando RoMod...");
  stateManager.cleanupAll();
  await client.destroy();
  process.exit(0);
});

main();
