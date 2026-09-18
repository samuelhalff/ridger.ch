#!/usr/bin/env node
/**
 * Sync ressources.json from FR (canonical) to other locales.
 *
 * Features:
 *  - --apply : actually write updates (default is dry-run)
 *  - --check : exit with code 1 if any locale diverges
 *  - --locales=de,en,es,pt : override target locales
 *  - Preserves filenames, slugs, URLs exactly as they appear in FR (they are copied wholesale)
 *  - Does NOT attempt machine translation; translation is manual after sync
 *  - Provides summary of differences (counts of Files, Articles, missing keys)
 *
 * Usage examples:
 *  node scripts/sync-ressources.js --check
 *  node scripts/sync-ressources.js --apply
 *  node scripts/sync-ressources.js --locales=en,pt --apply
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const hasFlag = f => args.includes(f);
const getArgValue = (key) => {
  const prefix = `${key}=`;
  const item = args.find(a => a.startsWith(prefix));
  return item ? item.slice(prefix.length) : undefined;
};

const APPLY = hasFlag('--apply');
const FORCE = hasFlag('--force-overwrite');
const CHECK = hasFlag('--check');
const localeList = (getArgValue('--locales') || 'en,de,es,pt').split(',').map(s => s.trim()).filter(Boolean);

if (APPLY && !FORCE) {
  console.error(
    "Refusing to run with --apply without --force-overwrite. This script overwrites translated locale content with the FR canonical file."
  );
  console.error("If you really intend to do this, rerun with: --apply --force-overwrite");
  process.exit(2);
}

const root = path.join(__dirname, '..', 'src', 'translations');
const canonicalLocale = 'fr';
const canonicalPath = path.join(root, canonicalLocale, 'ressources.json');

if (!fs.existsSync(canonicalPath)) {
  console.error(`Canonical file not found: ${canonicalPath}`);
  process.exit(2);
}

/** Load and parse JSON with helpful error */
function loadJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse ${p}: ${e.message}`);
    process.exit(2);
  }
}

const frData = loadJSON(canonicalPath);

function diffKeys(baseObj, targetObj, prefix = '') {
  const missing = [];
  for (const k of Object.keys(baseObj)) {
    if (!(k in targetObj)) missing.push(prefix + k);
  }
  return missing;
}

function summarizeMismatch(locale, targetData) {
  const issues = [];
  // Top-level counts
  if (Array.isArray(frData.Files) && Array.isArray(targetData.Files)) {
    if (frData.Files.length !== targetData.Files.length) {
      issues.push(`Files count ${targetData.Files.length} != ${frData.Files.length}`);
    }
  } else {
    issues.push('Files array missing or not an array');
  }
  if (Array.isArray(frData.Articles) && Array.isArray(targetData.Articles)) {
    if (frData.Articles.length !== targetData.Articles.length) {
      issues.push(`Articles count ${targetData.Articles.length} != ${frData.Articles.length}`);
    }
  } else {
    issues.push('Articles array missing or not an array');
  }

  // Missing top-level keys
  const topMissing = diffKeys(frData, targetData);
  if (topMissing.length) issues.push(`Missing keys: ${topMissing.join(', ')}`);
  return issues;
}

let hasDifferences = false;

for (const locale of localeList) {
  if (locale === canonicalLocale) continue; // skip FR itself
  const targetPath = path.join(root, locale, 'ressources.json');
  if (!fs.existsSync(targetPath)) {
    console.warn(`[WARN] Missing target file (${locale}), will create new one.`);
    if (APPLY) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, JSON.stringify(frData, null, 2) + '\n', 'utf8');
      console.log(`[CREATE] ${locale}/ressources.json (copied from fr)`);
    } else {
      hasDifferences = true;
    }
    continue;
  }
  const targetData = loadJSON(targetPath);
  const issues = summarizeMismatch(locale, targetData);
  if (issues.length) {
    hasDifferences = true;
    console.log(`\nLocale: ${locale}`);
    issues.forEach(i => console.log('  - ' + i));
    if (APPLY) {
      fs.writeFileSync(targetPath, JSON.stringify(frData, null, 2) + '\n', 'utf8');
      console.log(`  [UPDATED] Replaced with canonical fr version.`);
    }
  } else {
    console.log(`Locale: ${locale} is already in parity.`);
  }
}

if (!APPLY) {
  console.log(`\nDry-run complete. (Use --apply to write changes)${CHECK ? ' (check mode)' : ''}`);
}

if (CHECK && hasDifferences) {
  console.error('\nParity check FAILED: differences detected.');
  process.exit(1);
}
if (CHECK && !hasDifferences) {
  console.log('\nParity check PASSED: all target locales match fr.');
}
