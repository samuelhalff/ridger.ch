#!/usr/bin/env node

/**
 * Validation script to check for missing translation keys used in code
 * Runs after build to ensure all translation keys have values
 */

const fs = require("fs");
const path = require("path");

const TRANSLATIONS_DIR = path.join(__dirname, "../src/translations");
const LOCALES = ["en", "fr", "de", "es", "pt"];

// Load all translations
function loadTranslations() {
  const translations = {};
  
  for (const locale of LOCALES) {
    const localePath = path.join(TRANSLATIONS_DIR, locale);
    if (!fs.existsSync(localePath)) {
      console.error(`❌ Locale directory missing: ${locale}`);
      process.exit(1);
    }
    
    translations[locale] = {};
    const files = fs.readdirSync(localePath).filter(f => f.endsWith(".json"));
    
    for (const file of files) {
      const namespace = file.replace(".json", "");
      const content = fs.readFileSync(path.join(localePath, file), "utf-8");
      try {
        translations[locale][namespace] = JSON.parse(content);
      } catch (e) {
        console.error(`❌ Failed to parse ${locale}/${file}: ${e.message}`);
        process.exit(1);
      }
    }
  }
  
  return translations;
}

// Check if a key path exists in an object
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

// Validate translations
function validateTranslations() {
  console.log("🔍 Validating translation keys...\n");
  
  const translations = loadTranslations();
  const errors = [];
  
  // Common keys to check across all namespaces
  const criticalChecks = [
    // Contact namespace
    { ns: "contact", key: "Contact.CompanyName" },
    { ns: "contact", key: "Contact.Email" },
    { ns: "contact", key: "Contact.Phone" },
    { ns: "contact", key: "Contact.Address" },
    { ns: "contact", key: "Title" },
    { ns: "contact", key: "Form.Name" },
    { ns: "contact", key: "Form.Email" },
    { ns: "contact", key: "Form.Message" },
    
    // Navigation
    { ns: "navbar", key: "Home" },
    { ns: "navbar", key: "Services" },
    { ns: "navbar", key: "Contact" },
    
    // Footer
    { ns: "footer", key: "Copyright" },
    
    // Home page
    { ns: "home", key: "Hero.Title" },
    { ns: "home", key: "Hero.Description" },
    { ns: "home", key: "Services.Title" },
    
    // Cookie consent
    { ns: "cookie", key: "Title" },
    { ns: "cookie", key: "Text" },
    { ns: "cookie", key: "Accept" },
    { ns: "cookie", key: "Decline" },
  ];
  
  for (const locale of LOCALES) {
    for (const check of criticalChecks) {
      if (!translations[locale][check.ns]) {
        errors.push(`${locale}: Missing namespace "${check.ns}"`);
        continue;
      }
      
      if (!hasKey(translations[locale][check.ns], check.key)) {
        errors.push(`${locale}: Missing key "${check.ns}:${check.key}"`);
      }
    }
  }
  
  if (errors.length > 0) {
    console.error("❌ Translation validation failed:\n");
    errors.forEach(err => console.error(`  - ${err}`));
    console.error(`\n${errors.length} error(s) found.`);
    process.exit(1);
  }
  
  console.log("✅ All critical translation keys are present across all locales");
  console.log(`   Checked ${criticalChecks.length} keys × ${LOCALES.length} locales = ${criticalChecks.length * LOCALES.length} validations`);
}

// Run validation
validateTranslations();

// ─────────────────────────────────────────────────────────────────────────
// Full structural key-parity on ACTIVE namespaces (added 2026-09-21).
// The curated-key check above only covers a subset; this catches ANY key
// present in the FR canonical but missing from another locale (the cause of
// blank/fallback labels), for the namespaces ridger actually renders. Legacy
// ark service files (accounting, corporate, …) are excluded — unused, uneven.
// ─────────────────────────────────────────────────────────────────────────
(function fullParity() {
  const ACTIVE = new Set([
    "navbar", "footer", "home", "faq", "approach", "contact", "platform",
    "cookie", "privacy", "legal", "servicesItems", "ai-profile", "metadata",
    "services", "ressources",
    "consolidated-reporting", "investment-oversight", "family-office-coordination",
    "governance-succession", "tax-administration", "digital-vault",
    "real-estate-transactions",
  ]);
  const CANON = "fr";
  const flat = (v, p = "", out = {}) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const k of Object.keys(v)) flat(v[k], p ? `${p}.${k}` : k, out);
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => flat(x, `${p}[${i}]`, out));
    } else { out[p] = v; }
    return out;
  };
  const read = (loc, ns) => {
    const fp = path.join(TRANSLATIONS_DIR, loc, `${ns}.json`);
    return fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf-8")) : null;
  };
  let problems = 0;
  for (const ns of ACTIVE) {
    const canon = read(CANON, ns);
    if (!canon) continue;
    const flatCanon = flat(canon);
    for (const loc of LOCALES) {
      if (loc === CANON) continue;
      const t = read(loc, ns);
      if (!t) { console.error(`❌ parity: ${loc}/${ns}.json missing`); problems++; continue; }
      const ft = flat(t);
      const missing = Object.keys(flatCanon).filter((k) => !(k in ft));
      if (missing.length) {
        console.error(`❌ parity: ${loc}/${ns}.json missing ${missing.length} key(s): ${missing.slice(0, 6).join(", ")}${missing.length > 6 ? " …" : ""}`);
        problems += missing.length;
      }
    }
  }
  if (problems) {
    console.error(`\n❌ Structural parity failed: ${problems} missing key(s) across active namespaces.`);
    process.exit(1);
  }
  console.log("✅ Full structural key-parity: all active namespaces complete across all locales");
})();
