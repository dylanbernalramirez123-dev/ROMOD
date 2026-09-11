/**
 * COMMAND LOADER Y HANDLER
 * Carga automáticamente todos los slash commands
 */

import { Client, Collection, REST, Routes, SlashCommandBuilder } from "discord.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readdirSync } from "fs";
import { SlashCommand } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CommandHandler {
  private client: Client;
  private commands: Collection<string, SlashCommand>;
  private token: string;

  constructor(client: Client, token: string) {
    this.client = client;
    this.commands = new Collection();
    this.token = token;
  }

  /**
   * Cargar todos los comandos de forma dinámica
   */
  async loadCommands(): Promise<void> {
    console.log("\n📦 Cargando Slash Commands...\n");

    const commandsPath = join(__dirname, ".");
    const commandFolders = readdirSync(commandsPath).filter((file) => {
      return (
        readdirSync(join(commandsPath, file)).some((f) => f.endsWith(".ts")) &&
        file !== "types.ts"
      );
    });

    for (const folder of commandFolders) {
      const commandFiles = readdirSync(join(commandsPath, folder)).filter(
        (file) => file.endsWith(".ts")
      );

      for (const file of commandFiles) {
        try {
          const filePath = join(commandsPath, folder, file);
          const { default: command, ...namedExports } = await import(filePath);

          // Intentar importar comando nombrado
          const commands = Object.values(namedExports).filter(
            (cmd) => typeof cmd === "object" && "data" in cmd && "execute" in cmd
          ) as SlashCommand[];

          for (const cmd of commands) {
            this.commands.set(cmd.data.name, cmd);
            console.log(`  ✅ ${cmd.data.name}`);
          }

          // También soportar export default
          if (command && "data" in command && "execute" in command) {
            this.commands.set(command.data.name, command);
            console.log(`  ✅ ${command.data.name}`);
          }
        } catch (error) {
          console.error(`  ❌ Error cargando ${file}:`, error);
        }
      }
    }

    console.log(`\n✅ ${this.commands.size} comandos cargados\n`);
  }

  /**
   * Registrar comandos en Discord
   */
  async registerCommands(guildIds?: string[]): Promise<void> {
    const rest = new REST({ version: "10" }).setToken(this.token);

    const commandsData = Array.from(this.commands.values()).map((cmd) => cmd.data.toJSON());

    try {
      console.log("📤 Registrando comandos en Discord...\n");

      if (guildIds && guildIds.length > 0) {
        // Registrar en servidores específicos (para desarrollo - más rápido)
        for (const guildId of guildIds) {
          await rest.put(Routes.applicationGuildCommands(this.client.user!.id, guildId), {
            body: commandsData,
          });
          console.log(`  ✅ Comandos registrados en servidor ${guildId}`);
        }
      } else {
        // Registrar globalmente (producción - tarda ~1 hora)
        await rest.put(Routes.applicationCommands(this.client.user!.id), {
          body: commandsData,
        });
        console.log(`  ✅ ${commandsData.length} comandos registrados globalmente`);
        console.log(
          "  ℹ️  Los comandos pueden tardar hasta 1 hora en aparecer en todos los servidores\n"
        );
      }
    } catch (error) {
      console.error("❌ Error registrando comandos:", error);
    }
  }

  /**
   * Manejar interacción de comando
   */
  async handleCommand(interaction: any): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({
        content: "❌ Comando no encontrado",
        flags: ["Ephemeral"],
      });
      return;
    }

    // Verificar permisos
    if (command.adminOnly && !interaction.member?.permissions.has("ManageGuild")) {
      await interaction.reply({
        content: "❌ No tienes permisos para usar este comando",
        flags: ["Ephemeral"],
      });
      return;
    }

    if (command.ownerOnly && interaction.user.id !== interaction.guild?.ownerId) {
      await interaction.reply({
        content: "❌ Solo el propietario del servidor puede usar esto",
        flags: ["Ephemeral"],
      });
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`❌ Error ejecutando ${interaction.commandName}:`, error);

      const errorMsg = "❌ Hubo un error ejecutando este comando";
      if (interaction.replied) {
        await interaction.followUp({
          content: errorMsg,
          flags: ["Ephemeral"],
        });
      } else {
        await interaction.reply({
          content: errorMsg,
          flags: ["Ephemeral"],
        });
      }
    }
  }

  /**
   * Obtener colección de comandos
   */
  getCommands(): Collection<string, SlashCommand> {
    return this.commands;
  }
}
