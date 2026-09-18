#!/usr/bin/env node

/**
 * Comprehensive translation key usage checker
 * Scans codebase for all translation keys and validates they exist
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const TRANSLATIONS_DIR = path.join(__dirname, "../src/translations");
const LOCALES = ["en", "fr", "de", "es", "pt"];
const APP_DIR = path.join(__dirname, "../app");
const SRC_DIR = path.join(__dirname, "../src");

// Load all translations
function loadTranslations() {
  const translations = {};
  
  for (const locale of LOCALES) {
    translations[locale] = {};
    const localePath = path.join(TRANSLATIONS_DIR, locale);
    const files = fs.readdirSync(localePath).filter(f => f.endsWith(".json"));
    
    for (const file of files) {
      const namespace = file.replace(".json", "");
      const content = fs.readFileSync(path.join(localePath, file), "utf-8");
      translations[locale][namespace] = JSON.parse(content);
    }
  }
  
  return translations;
}

// Extract translation keys from code using grep
function extractKeysFromCode() {
  const patterns = [
    't\\("([^"]+)"[^}]*ns:\\s*"([^"]+)"',  // t("key", { ns: "namespace" })
    't\\("([^:]+):([^"]+)"',                 // t("namespace:key")
    'translationKey="([^"]+)"[^}]*ns="([^"]+)"', // <TranslatedText translationKey="key" ns="namespace" />
    't\\(([\'"`])([^\'"`]+)\\1[^}]*ns:\\s*([\'"`])([^\'"`]+)\\3', // various quotes
  ];
  
  const found = new Set();
  
  try {
    for (const pattern of patterns) {
      const cmd = `cd ${path.join(__dirname, "..")} && grep -rho -E '${pattern}' ${APP_DIR} ${SRC_DIR} 2>/dev/null || true`;
      const output = execSync(cmd, { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 });
      
      output.split("\n").filter(Boolean).forEach(line => {
        // Parse out namespace:key pairs
        const match1 = line.match(/t\("([^:]+):([^"]+)"/);
        if (match1) {
          found.add(`${match1[1]}:${match1[2]}`);
        }
        
        const match2 = line.match(/translationKey="([^"]+)"[^}]*ns="([^"]+)"/);
        if (match2) {
          found.add(`${match2[2]}:${match2[1]}`);
        }
        
        const match3 = line.match(/t\("([^"]+)"[^}]*ns:\s*"([^"]+)"/);
        if (match3) {
          found.add(`${match3[2]}:${match3[1]}`);
        }
      });
    }
  } catch (e) {
    // Ignore grep errors
  }
  
  return Array.from(found);
}

// Check if key exists in translations
function hasKey(obj, keyPath) {
  const keys = keyPath.split(".");
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return current !== undefined && current !== null && current !== "";
}

// Main validation
function validateUsedKeys() {
  console.log("🔍 Scanning codebase for translation key usage...\n");
  
  const translations = loadTranslations();
  const usedKeys = extractKeysFromCode();
  
  console.log(`Found ${usedKeys.length} translation key references in code\n`);
  
  const errors = [];
  const warnings = [];
  
  for (const fullKey of usedKeys) {
    const [ns, ...keyParts] = fullKey.split(":");
    const key = keyParts.join(":");
    
    if (!key) {
      warnings.push(`Malformed key: "${fullKey}"`);
      continue;
    }
    
    for (const locale of LOCALES) {
      if (!translations[locale][ns]) {
        errors.push(`${locale}: Missing namespace "${ns}" (used for key "${fullKey}")`);
        continue;
      }
      
      if (!hasKey(translations[locale][ns], key)) {
        errors.push(`${locale}: Missing key "${fullKey}"`);
      }
    }
  }
  
  if (warnings.length > 0) {
    console.warn("⚠️  Warnings:\n");
    warnings.forEach(w => console.warn(`  - ${w}`));
    console.warn();
  }
  
  if (errors.length > 0) {
    console.error("❌ Translation key validation failed:\n");
    errors.forEach(err => console.error(`  - ${err}`));
    console.error(`\n${errors.length} error(s) found.`);
    process.exit(1);
  }
  
  console.log("✅ All used translation keys are present in all locales");
}

// Run if called directly
if (require.main === module) {
  validateUsedKeys();
}

module.exports = { validateUsedKeys, loadTranslations, hasKey };
