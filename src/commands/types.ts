/**
 * TIPOS PARA SLASH COMMANDS
 */

import { CommandInteraction, ContextMenuCommandInteraction } from "discord.js";

export interface SlashCommand {
  data: any; // SlashCommandBuilder
  execute: (interaction: CommandInteraction) => Promise<void>;
  adminOnly?: boolean;
  ownerOnly?: boolean;
}

export interface ContextMenuCommand {
  data: any; // ContextMenuCommandBuilder
  execute: (interaction: ContextMenuCommandInteraction) => Promise<void>;
  adminOnly?: boolean;
}
