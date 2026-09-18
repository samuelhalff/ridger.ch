#!/usr/bin/env node
/**
 * Validate article translations across locales
 * Reports articles that are duplicates (identical to FR) vs genuine translations
 *
 * Usage: node scripts/validate-article-translations.js
 */

const fs = require("fs");
const path = require("path");

const LOCALES = ["fr", "en", "de", "es", "pt"];
const TRANSLATIONS_DIR = path.join(__dirname, "../src/translations");

function loadRessources(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, "ressources.json");
  if (!fs.existsSync(filePath)) {
    return { Articles: [] };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function isGenuineTranslation(localeArticle, frArticle) {
  if (!localeArticle || !frArticle) return false;

  const sameTitle = (localeArticle.title || "") === (frArticle.title || "");
  const sameDesc =
    (localeArticle.description || "") === (frArticle.description || "");
  const sameContent =
    (localeArticle.content || "") === (frArticle.content || "");

  // If all three are identical, it's a duplicate (not a genuine translation)
  return !(sameTitle && sameDesc && sameContent);
}

function main() {
  const REQUIRE =
    process.env.REQUIRE_TRANSLATIONS === "1" || process.env.CI === "true";
  const fr = loadRessources("fr");
  const frArticleMap = new Map(fr.Articles.map((a) => [a.slug, a]));

  console.log("=".repeat(80));
  console.log("ARTICLE TRANSLATION VALIDATION REPORT");
  console.log("=".repeat(80));
  console.log();

  const summary = {
    total: fr.Articles.length,
    byLocale: {},
  };

  for (const locale of LOCALES) {
    if (locale === "fr") continue;

    const localeData = loadRessources(locale);
    const localeArticleMap = new Map(
      localeData.Articles.map((a) => [a.slug, a])
    );

    const genuineTranslations = [];
    const duplicates = [];
    const missing = [];

    for (const frArticle of fr.Articles) {
      const localeArticle = localeArticleMap.get(frArticle.slug);

      if (!localeArticle) {
        missing.push(frArticle.slug);
      } else if (isGenuineTranslation(localeArticle, frArticle)) {
        genuineTranslations.push(frArticle.slug);
      } else {
        duplicates.push(frArticle.slug);
      }
    }

    summary.byLocale[locale] = {
      genuine: genuineTranslations.length,
      duplicate: duplicates.length,
      missing: missing.length,
    };

    console.log(`\n[${locale.toUpperCase()}] Translation Status:`);
    console.log("-".repeat(40));
    console.log(`  ✅ Genuine translations: ${genuineTranslations.length}`);
    console.log(`  ⚠️  Duplicates (same as FR): ${duplicates.length}`);
    console.log(`  ❌ Missing: ${missing.length}`);

    if (duplicates.length > 0 && duplicates.length <= 10) {
      console.log(`\n  Duplicate articles (will be excluded from sitemap):`);
      duplicates.forEach((slug) => console.log(`    - ${slug}`));
    } else if (duplicates.length > 10) {
      console.log(`\n  First 10 duplicate articles:`);
      duplicates.slice(0, 10).forEach((slug) => console.log(`    - ${slug}`));
      console.log(`    ... and ${duplicates.length - 10} more`);
    }

    if (missing.length > 0 && missing.length <= 5) {
      console.log(`\n  Missing articles:`);
      missing.forEach((slug) => console.log(`    - ${slug}`));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY");
  console.log("=".repeat(80));
  console.log(`\nTotal FR articles: ${summary.total}`);
  console.log("\nBy locale:");
  for (const [locale, stats] of Object.entries(summary.byLocale)) {
    const coverage = ((stats.genuine / summary.total) * 100).toFixed(1);
    console.log(
      `  ${locale.toUpperCase()}: ${
        stats.genuine
      } genuine (${coverage}% coverage), ${stats.duplicate} duplicates, ${
        stats.missing
      } missing`
    );
  }

  // Calculate sitemap impact
  console.log("\n" + "-".repeat(40));
  console.log("SITEMAP IMPACT:");
  console.log("-".repeat(40));

  let totalUrls = summary.total; // FR always included
  for (const [locale, stats] of Object.entries(summary.byLocale)) {
    totalUrls += stats.genuine;
    console.log(
      `  ${locale.toUpperCase()}: ${stats.genuine} URLs will be in sitemap`
    );
  }
  console.log(`  FR: ${summary.total} URLs will be in sitemap`);
  console.log(`\n  Total unique article URLs in sitemap: ${totalUrls}`);

  const duplicateUrlsRemoved = Object.values(summary.byLocale).reduce(
    (sum, stats) => sum + stats.duplicate,
    0
  );
  console.log(`  Duplicate URLs removed: ${duplicateUrlsRemoved}`);
  console.log();

  // Exit with error if there are issues to fix
  const hasDuplicates = Object.values(summary.byLocale).some(
    (stats) => stats.duplicate > 0
  );
  const hasMissing = Object.values(summary.byLocale).some(
    (stats) => stats.missing > 0
  );
  if (hasDuplicates) {
    console.log(
      "⚠️  Warning: Some locales have duplicate content that will be excluded from sitemap."
    );
    console.log(
      "   Consider translating these articles or keeping them excluded."
    );
  }

  if (REQUIRE && (hasDuplicates || hasMissing)) {
    console.error(
      "\n[CI] Translation validation failed: missing and/or duplicate articles detected."
    );
    process.exit(1);
  }
}

main();
