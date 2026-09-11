#!/usr/bin/env node

/**
 * VERIFICADOR DE ESTRUCTURA POST-COMANDOS
 * Verifica que todos los archivos de comandos se crearon correctamente
 */

import { existsSync } from "fs";
import { join } from "path";

const commandFiles = {
  "src/commands/types.ts": "Tipos de comandos",
  "src/commands/CommandHandler.ts": "Manejador de comandos",
  "src/commands/moderation/antiRaid.ts": "Comandos Anti-Raid",
  "src/commands/moderation/antiSpam.ts": "Comandos Anti-Spam",
  "src/commands/moderation/antiNuke.ts": "Comandos Anti-Nuke",
  "src/commands/general/utility.ts": "Comandos de utilidad",
  "COMMANDS_GUIDE.md": "Guía de comandos",
  "COMMANDS_REFERENCE.txt": "Referencia rápida",
  "COMMANDS_SUMMARY.md": "Resumen de comandos",
  "SETUP_CHECKLIST.md": "Checklist de configuración",
  "demo-commands.js": "Script de demostración",
};

console.log("\n╔════════════════════════════════════════════════════╗");
console.log("║   ✅ VERIFICADOR DE SLASH COMMANDS                 ║");
console.log("║      RoMod Security Bot v1.0                       ║");
console.log("╚════════════════════════════════════════════════════╝\n");

let allGood = true;
let createdCount = 0;

console.log("📁 Verificando archivos de comandos:\n");

for (const [file, description] of Object.entries(commandFiles)) {
  const exists = existsSync(file);
  const status = exists ? "✅" : "❌";

  console.log(`  ${status} ${file}`);
  console.log(`     └─ ${description}`);

  if (exists) {
    createdCount++;
  } else {
    allGood = false;
  }
}

console.log("\n" + "═".repeat(56));

if (allGood) {
  console.log(`\n✅ Todos los archivos de comandos creados (${createdCount}/${Object.keys(commandFiles).length})`);
  console.log("\n🎮 COMANDOS DISPONIBLES:");
  console.log("   ├─ /anti-raid   (3 subcomandos)");
  console.log("   ├─ /anti-spam   (4 subcomandos)");
  console.log("   ├─ /anti-nuke   (4 subcomandos)");
  console.log("   ├─ /stats       (Estadísticas)");
  console.log("   ├─ /config      (Configuración)");
  console.log("   ├─ /help        (Ayuda)");
  console.log("   └─ /setup-alerts (Configurar alertas)");

  console.log("\n🚀 PRÓXIMOS PASOS:");
  console.log("   1. npm install");
  console.log("   2. npm run build");
  console.log("   3. npm start");
  console.log("   4. Ver SETUP_CHECKLIST.md");

  console.log("\n📖 DOCUMENTACIÓN GENERADA:");
  console.log("   ├─ COMMANDS_GUIDE.md       (Guía detallada)");
  console.log("   ├─ COMMANDS_REFERENCE.txt  (Referencia rápida)");
  console.log("   ├─ COMMANDS_SUMMARY.md     (Resumen)");
  console.log("   ├─ SETUP_CHECKLIST.md      (Primeros pasos)");
  console.log("   └─ demo-commands.js        (Demo)");
} else {
  console.log(
    `\n❌ Faltan archivos (${createdCount}/${Object.keys(commandFiles).length})`
  );
  console.log("   Verifica que todos los archivos se crearon correctamente");
}

console.log("\n" + "═".repeat(56) + "\n");

process.exit(allGood ? 0 : 1);
