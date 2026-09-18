/**
 * Fix 2 targeted issues flagged by Codex review:
 * 1. TVA label → ESTV VAT rates page (FR file only)
 * 2. Business acquisition article: SECO portrait → kmu/fr/succession (all files)
 */
const fs = require("fs");

const FILES = [
  "src/translations/fr/ressources.json",
  "src/translations/de/ressources.json",
  "src/translations/en/ressources.json",
  "src/translations/es/ressources.json",
  "src/translations/pt/ressources.json",
];

// Fix 1: TVA label → ESTV VAT-specific page (FR only)
const TVA_FIX = {
  oldUrl: "https://www.kmu.admin.ch/fr/la-liste-des-impots-pour-les-entrepreneurs",
  newUrl: "https://www.estv.admin.ch/fr/taux-de-la-tva-suisse",
  label: "Portail PME - TVA",
};

// Fix 2: In the business acquisition article, replace SECO portrait with kmu succession
// The slug pattern identifies the acquisition article across locales
const ACQUISITION_SLUGS = [
  "acquisition-entreprise-geneve-pme-conseils-strategiques-2025", // FR
  "unternehmensubernahme-genf-2025-strategische-tipps",          // DE
  "business-acquisition-geneva-2025-strategic-advice",           // EN
  "adquisicion-empresas-ginebra-2025-consejos-estrategicos",     // ES
  "aquisicao-empresa-genebra-2025-conselhos-estrategicos",       // PT
];

let totalFixes = 0;

for (const filePath of FILES) {
  let content = fs.readFileSync(filePath, "utf-8");
  let changed = false;
  const isFR = filePath.includes("fr/ressources.json");

  // Fix 1: TVA label URL (FR only)
  if (isFR && content.includes(TVA_FIX.label)) {
    // Find the URL entry right after the TVA label
    const pattern = `"labelKey": "${TVA_FIX.label}",\n          "url": "${TVA_FIX.oldUrl}"`;
    const replacement = `"labelKey": "${TVA_FIX.label}",\n          "url": "${TVA_FIX.newUrl}"`;
    if (content.includes(pattern)) {
      content = content.replace(pattern, replacement);
      console.log(`  ✓ ${filePath} — TVA label URL fixed`);
      changed = true;
      totalFixes++;
    }
  }

  // Fix 2: Replace seco.admin.ch/fr/portrait → kmu.admin.ch/fr/succession
  // in the acquisition article only
  for (const slug of ACQUISITION_SLUGS) {
    if (content.includes(slug)) {
      const oldUrl = "https://www.seco.admin.ch/fr/portrait";
      const newUrl = "https://www.kmu.admin.ch/fr/succession";
      if (content.includes(oldUrl + ")")) {
        content = content.replace(oldUrl + ")", newUrl + ")");
        console.log(`  ✓ ${filePath} — acquisition article portrait → succession`);
        changed = true;
        totalFixes++;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
  }
}

console.log(`\nDone: ${totalFixes} fixes applied.`);
