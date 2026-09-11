#!/usr/bin/env node

/**
 * COMANDO: Verificar estructura del proyecto
 * Usar: node verify-structure.js
 */

import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { join } from "path";

const requiredFiles = {
  root: [
    "package.json",
    "tsconfig.json",
    ".env.example",
    ".gitignore",
    "README.md",
    "ARCHITECTURE.md",
    "QUICK_START.md",
    "CONFIG_EXAMPLES.ts",
  ],
  src: [
    "index.ts",
    "types/index.ts",
    "config/constants.ts",
    "utils/StateManager.ts",
    "utils/analysis.ts",
    "modules/AntiRaid/AntiRaidModule.ts",
    "modules/AntiSpam/AntiSpamModule.ts",
    "modules/AntiNuke/AntiNukeModule.ts",
  ],
  tests: ["unit.test.ts"],
};

async function verifyStructure() {
  console.log("\n╔════════════════════════════════════════════════╗");
  console.log("║   📁 RoMod Project Structure Verification      ║");
  console.log("╚════════════════════════════════════════════════╝\n");

  let allGood = true;

  // Check root files
  console.log("📦 Root Files:");
  for (const file of requiredFiles.root) {
    const exists = existsSync(file);
    const status = exists ? "✅" : "❌";
    console.log(`  ${status} ${file}`);
    if (!exists) allGood = false;
  }

  // Check src files
  console.log("\n📂 Source Files:");
  for (const file of requiredFiles.src) {
    const path = join("src", file);
    const exists = existsSync(path);
    const status = exists ? "✅" : "❌";
    console.log(`  ${status} src/${file}`);
    if (!exists) allGood = false;
  }

  // Check test files
  console.log("\n🧪 Test Files:");
  for (const file of requiredFiles.tests) {
    const path = join("tests", file);
    const exists = existsSync(path);
    const status = exists ? "✅" : "❌";
    console.log(`  ${status} tests/${file}`);
    if (!exists) allGood = false;
  }

  // Summary
  console.log("\n" + "=".repeat(48));
  if (allGood) {
    console.log("✅ Estructura del proyecto verificada correctamente!");
    console.log("\nPróximos pasos:");
    console.log("1. npm install");
    console.log("2. Crear .env con TOKEN");
    console.log("3. npm run build");
    console.log("4. npm start");
  } else {
    console.log(
      "❌ Algunos archivos faltan. Verifica la estructura del proyecto."
    );
  }
  console.log("=".repeat(48) + "\n");

  return allGood;
}

verifyStructure();
