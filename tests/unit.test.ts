/**
 * EJEMPLOS DE TESTS UNITARIOS
 * Cómo testear cada módulo
 */

import {
  calculateLevenshteinSimilarity,
  getAccountAgeDays,
  calculateAccountRiskScore,
  detectMassMentions,
  normalizeText,
} from "../src/utils/analysis.js";

// ============================================
// TESTS: Análisis y Utilidades
// ============================================

/**
 * TEST: Levenshtein Similarity
 */
export function testLevenshteinSimilarity() {
  const tests = [
    {
      str1: "hola",
      str2: "hola",
      expected: 100,
      description: "Strings idénticos",
    },
    {
      str1: "casa",
      str2: "caza",
      expected: 75,
      description: "Un carácter diferente",
    },
    {
      str1: "spam123",
      str2: "sp@m456",
      expected: 42,
      description: "Strings muy diferentes",
    },
    {
      str1: "COMPRA AQUI",
      str2: "C0MPR4 AQU1",
      expected: 90,
      description: "Spam mutado típico",
    },
  ];

  console.log("\n📊 TEST: Levenshtein Similarity");
  let passed = 0;

  for (const test of tests) {
    const result = calculateLevenshteinSimilarity(test.str1, test.str2);
    const isPass = Math.abs(result - test.expected) <= 5; // Tolerancia 5%

    console.log(
      `${isPass ? "✅" : "❌"} ${test.description}
      Input: "${test.str1}" vs "${test.str2}"
      Expected: ~${test.expected}% | Got: ${result}%`
    );

    if (isPass) passed++;
  }

  console.log(`\nResultado: ${passed}/${tests.length} tests pasados\n`);
  return passed === tests.length;
}

/**
 * TEST: Account Age Calculation
 */
export function testAccountAgeDays() {
  const now = Date.now();

  const tests = [
    {
      timestamp: now - 1000 * 60 * 60 * 24, // 1 día
      expected: 1,
      description: "Cuenta de 1 día",
    },
    {
      timestamp: now - 1000 * 60 * 60 * 24 * 7, // 7 días
      expected: 7,
      description: "Cuenta de 7 días",
    },
    {
      timestamp: now - 1000 * 60 * 60 * 24 * 30, // 30 días
      expected: 30,
      description: "Cuenta de 30 días",
    },
  ];

  console.log("\n📊 TEST: Account Age Calculation");
  let passed = 0;

  for (const test of tests) {
    const result = getAccountAgeDays(test.timestamp);
    const isPass = result === test.expected;

    console.log(
      `${isPass ? "✅" : "❌"} ${test.description}
      Expected: ${test.expected} días | Got: ${result} días`
    );

    if (isPass) passed++;
  }

  console.log(`\nResultado: ${passed}/${tests.length} tests pasados\n`);
  return passed === tests.length;
}

/**
 * TEST: Account Risk Score
 */
export function testAccountRiskScore() {
  const tests = [
    {
      age: 0, // Mismo día
      joins: 10,
      massMention: true,
      expected: "CRITICAL",
      description: "Cuenta nueva con raid masivo",
    },
    {
      age: 7,
      joins: 2,
      massMention: false,
      expected: "MEDIUM",
      description: "Cuenta de 7 días, joins normales",
    },
    {
      age: 30,
      joins: 1,
      massMention: false,
      expected: "LOW",
      description: "Cuenta establecida",
    },
    {
      age: 1,
      joins: 5,
      massMention: true,
      expected: "HIGH",
      description: "Cuenta nueva con joins moderados",
    },
  ];

  console.log("\n📊 TEST: Account Risk Score");
  let passed = 0;

  const thresholds = {
    CRITICAL: 75,
    HIGH: 50,
    MEDIUM: 25,
    LOW: 0,
  };

  for (const test of tests) {
    const score = calculateAccountRiskScore(test.age, test.joins, test.massMention);

    let category = "LOW";
    if (score >= thresholds.CRITICAL) category = "CRITICAL";
    else if (score >= thresholds.HIGH) category = "HIGH";
    else if (score >= thresholds.MEDIUM) category = "MEDIUM";

    const isPass = category === test.expected;

    console.log(
      `${isPass ? "✅" : "❌"} ${test.description}
      Score: ${score}/100 (${category})
      Expected: ${test.expected}`
    );

    if (isPass) passed++;
  }

  console.log(`\nResultado: ${passed}/${tests.length} tests pasados\n`);
  return passed === tests.length;
}

/**
 * TEST: Mass Mentions Detection
 */
export function testMassMentions() {
  const tests = [
    {
      message: "<@123456789> <@987654321> <@555666777> <@888999000> <@111222333> spam link",
      expected: { isMassMention: true, ghostPing: false },
      description: "Mass mention claro",
    },
    {
      message: "<@123456789> <@987654321>",
      expected: { isMassMention: false, ghostPing: true },
      description: "Ghost ping (solo menciones)",
    },
    {
      message: "Hola <@123456789> cómo estás?",
      expected: { isMassMention: false, ghostPing: false },
      description: "Mención normal",
    },
    {
      message: "<@123> <@456> <@789> <@101> <@202> <@303> <@404> aquí",
      expected: { isMassMention: true, ghostPing: false },
      description: "Muchas menciones con texto",
    },
  ];

  console.log("\n📊 TEST: Mass Mentions Detection");
  let passed = 0;

  for (const test of tests) {
    const result = detectMassMentions(test.message);
    const isPass =
      result.isMassMention === test.expected.isMassMention &&
      result.ghostPing === test.expected.ghostPing;

    console.log(
      `${isPass ? "✅" : "❌"} ${test.description}
      MassMention: ${result.isMassMention} (expected: ${test.expected.isMassMention})
      GhostPing: ${result.ghostPing} (expected: ${test.expected.ghostPing})
      Mention count: ${result.mentionCount}`
    );

    if (isPass) passed++;
  }

  console.log(`\nResultado: ${passed}/${tests.length} tests pasados\n`);
  return passed === tests.length;
}

/**
 * TEST: Text Normalization
 */
export function testTextNormalization() {
  const tests = [
    {
      input: "HOLA MUNDO",
      expected: "holamundo",
      description: "Uppercase",
    },
    {
      input: "Hola Mundo!!!",
      expected: "holamundo",
      description: "Con caracteres especiales",
    },
    {
      input: "H0L@ M1ND0",
      expected: "h0l1nd0",
      description: "Con números",
    },
    {
      input: "   espacios   múltiples   ",
      expected: "espaciosmltiples",
      description: "Con espacios múltiples",
    },
  ];

  console.log("\n📊 TEST: Text Normalization");
  let passed = 0;

  for (const test of tests) {
    const result = normalizeText(test.input);
    const isPass = result === test.expected;

    console.log(
      `${isPass ? "✅" : "❌"} ${test.description}
      Input: "${test.input}"
      Expected: "${test.expected}" | Got: "${result}"`
    );

    if (isPass) passed++;
  }

  console.log(`\nResultado: ${passed}/${tests.length} tests pasados\n`);
  return passed === tests.length;
}

// ============================================
// RUNNER: Ejecutar todos los tests
// ============================================

export async function runAllTests() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║     RoMod Unit Tests Suite              ║");
  console.log("╚════════════════════════════════════════╝\n");

  const results = {
    levenshtein: testLevenshteinSimilarity(),
    accountAge: testAccountAgeDays(),
    riskScore: testAccountRiskScore(),
    massMentions: testMassMentions(),
    normalization: testTextNormalization(),
  };

  // Resumen
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.values(results).length;

  console.log("╔════════════════════════════════════════╗");
  console.log(`║     RESULTADO FINAL: ${passed}/${total} suites   ║`);
  console.log("╚════════════════════════════════════════╝\n");

  return passed === total;
}

// ============================================
// Ejecutar si se corre directamente
// ============================================

// Descomenta para ejecutar tests
// runAllTests().then((success) => {
//   process.exit(success ? 0 : 1);
// });
