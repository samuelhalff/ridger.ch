#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  extractOutdatedSwissVatRateMatches,
} = require("./lib/outdatedVatValidator");

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");

function trimContext(text) {
  return text.replace(/\s+/g, " ").trim();
}

function main() {
  const locales = fs
    .readdirSync(TRANSLATIONS_DIR)
    .filter((entry) =>
      fs.statSync(path.join(TRANSLATIONS_DIR, entry)).isDirectory(),
    );
  const failures = [];

  for (const locale of locales) {
    const filePath = path.join(TRANSLATIONS_DIR, locale, "ressources.json");
    if (!fs.existsSync(filePath)) continue;

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const articles = Array.isArray(data.Articles) ? data.Articles : [];

    for (const article of articles) {
      const matches = extractOutdatedSwissVatRateMatches(article);
      for (const match of matches) {
        failures.push({
          locale,
          slug: article.slug,
          rate: match.rate,
          currentRate: match.currentRate,
          context: trimContext(match.context),
        });
      }
    }
  }

  if (failures.length === 0) {
    console.log("✓ No outdated Swiss VAT rates found in article content");
    return;
  }

  console.error("✗ Outdated Swiss VAT references found in article content:");
  for (const failure of failures) {
    console.error(
      `- [${failure.locale}] ${failure.slug}: found ${failure.rate}; expected current rate context such as ${failure.currentRate}`,
    );
    console.error(`  Context: ${failure.context}`);
  }
  process.exitCode = 1;
}

main();
