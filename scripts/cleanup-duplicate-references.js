#!/usr/bin/env node

/**
 * One-time cleanup script to remove duplicate reference sections from existing articles
 * 
 * This script:
 * 1. Reads all locale ressources.json files
 * 2. For each article with references, applies the same cleanup logic as syncContentReferencesSection()
 * 3. Removes duplicate "Sources", "Références", and list-based reference sections
 * 4. Keeps only the canonical reference list at the end
 * 
 * Usage: node scripts/cleanup-duplicate-references.js [--dry-run]
 */

const fs = require("fs");
const path = require("path");

const LOCALES = ["fr", "en", "de", "es", "pt"];
const DRY_RUN = process.argv.includes("--dry-run");

function cleanupReferenceSections(article) {
  if (!article || typeof article !== "object") return false;
  if (typeof article.content !== "string" || !article.content) return false;
  if (!Array.isArray(article.references) || article.references.length === 0) {
    return false;
  }

  const refs = article.references
    .filter(
      (r) => r && typeof r.url === "string" && typeof r.labelKey === "string",
    )
    .map((r) => ({ labelKey: r.labelKey.trim(), url: r.url.trim() }))
    .filter((r) => r.labelKey && r.url);

  if (refs.length === 0) return false;

  const originalContent = article.content;
  let content = article.content;
  
  // Match reference sections in various formats and languages:
  // French: "Références", "Sources"
  // English: "References", "Sources"
  // German: "Referenzen", "Quellen"
  // Spanish: "Referencias", "Fuentes"
  // Portuguese: "Referências", "Fontes"
  // With various formatting: headings (###), bold (**), with/without colons
  const headingRe =
    /^(?:#{2,3}\s*|\*\*)?(?:référence?s?|references?|referenzen?|referencias?|sources?|quellen?|fuentes?|fontes?)\s*:?\s*(?:\*\*)?\s*$/gim;
  
  // Find all reference section markers
  const indices = [];
  for (const m of content.matchAll(headingRe)) {
    if (typeof m.index === "number") {
      // Only consider it a reference section if it's at the start of a line
      // and followed by a list or another reference marker
      const beforeMatch = content.slice(0, m.index);
      const afterMatch = content.slice(m.index);
      
      // Check if this looks like a reference section
      // (e.g., followed by a list or at end of document)
      const nextLines = afterMatch.split('\n').slice(1, 5).join('\n');
      if (nextLines.match(/^\s*-\s+/m) || afterMatch.length < 500) {
        indices.push(m.index);
      }
    }
  }
  
  if (indices.length) {
    // Remove everything from the first reference heading onwards
    content = content.slice(0, indices[0]).trimEnd();
  } else {
    content = content.trimEnd();
  }

  // Remove trailing separators if present
  content = content.replace(/(\n---\s*)+$/, '').trimEnd();

  const list = refs.map((r) => `- [${r.labelKey}](${r.url})`).join("\n");
  const newContent = `${content}\n\n---\n### Références\n${list}\n`;
  
  // Only update if content changed
  if (newContent !== originalContent) {
    article.content = newContent;
    return true;
  }
  
  return false;
}

function processLocale(locale) {
  const filePath = path.join(
    __dirname,
    "..",
    "src",
    "translations",
    locale,
    "ressources.json"
  );

  if (!fs.existsSync(filePath)) {
    console.log(`[${locale}] File not found: ${filePath}`);
    return { locale, processed: 0, changed: 0 };
  }

  console.log(`[${locale}] Reading ${filePath}...`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!Array.isArray(data.Articles)) {
    console.log(`[${locale}] No Articles array found`);
    return { locale, processed: 0, changed: 0 };
  }

  let processed = 0;
  let changed = 0;

  for (const article of data.Articles) {
    processed++;
    const wasChanged = cleanupReferenceSections(article);
    if (wasChanged) {
      changed++;
      console.log(`[${locale}] Cleaned: "${article.title}"`);
    }
  }

  if (changed > 0 && !DRY_RUN) {
    // Write back with proper formatting (2 spaces)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`[${locale}] Saved ${changed} changes to ${filePath}`);
  }

  return { locale, processed, changed };
}

function main() {
  console.log("=================================================");
  console.log("Cleanup Duplicate Reference Sections");
  console.log("=================================================");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no changes)" : "LIVE (will save)"}`);
  console.log();

  const results = LOCALES.map(processLocale);

  console.log("\n=================================================");
  console.log("Summary:");
  console.log("=================================================");
  
  let totalProcessed = 0;
  let totalChanged = 0;
  
  for (const result of results) {
    console.log(
      `[${result.locale}] Processed: ${result.processed}, Changed: ${result.changed}`
    );
    totalProcessed += result.processed;
    totalChanged += result.changed;
  }
  
  console.log(`\nTotal: ${totalProcessed} articles processed, ${totalChanged} changed`);
  
  if (DRY_RUN && totalChanged > 0) {
    console.log("\nRun without --dry-run to apply changes");
  }
}

main();
