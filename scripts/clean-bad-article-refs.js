#!/usr/bin/env node
/**
 * Clean bad article references (404/410/unreachable URLs) from ressources.json files.
 * This script removes references that return errors or missing content.
 * Uses the shared referenceValidator module for consistent validation.
 *
 * Usage:
 *   node scripts/clean-bad-article-refs.js [--locale fr] [--all-locales] [--dry-run] [--max-refs 50]
 */
const fs = require("fs");
const path = require("path");
const { listLocales } = require("./lib/ressources");
const { validateUrl, deduplicateByDomain } = require("./lib/referenceValidator");

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");
const args = process.argv.slice(2);

const flag = (f) => args.includes(f);
const value = (f, d) => {
  const i = args.indexOf(f);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : d;
};

const oneLocale = value("--locale", "fr");
const allLocales = flag("--all-locales");
const dryRun = flag("--dry-run");
const timeoutMs = parseInt(value("--timeout-ms", "8000"), 10);
const minBytes = parseInt(value("--min-bytes", "600"), 10);
const maxRefs = Math.max(0, parseInt(value("--max-refs", "0"), 10) || 0);

// Reasons that do not prove a link is dead: flaky networks, slow servers and
// bot-blocking WAFs (admin.ch, expertsuisse.ch return 403/5xx to non-browser
// clients while serving fine in browsers). Never delete references for these.
const TRANSIENT_KEEP_REASONS = new Set([
  "timeout",
  "network-error",
  "server-error",
  "http-error",
]);

if (typeof fetch !== "function") {
  console.error("❌ This script requires Node 18+ (global fetch)");
  process.exit(1);
}

// Empty/placeholder content patterns for enhanced detection
const EMPTY_CONTENT_PATTERNS = [
  /page\s*not\s*found/i,
  /404\s*error/i,
  /content\s*unavailable/i,
  /this\s*page\s*doesn't\s*exist/i,
  /cette\s*page\s*n'existe\s*pas/i,
  /seite\s*nicht\s*gefunden/i,
  /pagina\s*no\s*encontrada/i,
  /página\s*não\s*encontrada/i,
  /under\s*construction/i,
  /coming\s*soon/i,
  /placeholder/i,
  /lorem\s*ipsum/i
];

async function checkUrl(url) {
  // Use the shared validator
  const result = await validateUrl(url, {
    timeout: timeoutMs,
    minBytes: minBytes,
    checkContent: true
  });

  return {
    ok: result.valid,
    status: result.status,
    bodySize: result.bodySize,
    reason: result.reason || (result.valid ? "ok" : "validation-failed"),
    error: result.error
  };
}

async function cleanLocale(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, "ressources.json");

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  No ressources.json found for locale: ${locale}`);
    return { locale, skipped: true };
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    console.error(`❌ Failed to parse ${locale}/ressources.json: ${e.message}`);
    return { locale, error: "parse_error" };
  }

  const articles = Array.isArray(data.Articles) ? data.Articles : [];
  let totalRemoved = 0;
  let totalChecked = 0;
  let totalDeduplicated = 0;
  let budgetLogged = false;

  console.log(`\n🔍 Checking locale: ${locale}`);

  for (const article of articles) {
    if (!article || !Array.isArray(article.references)) continue;

    if (maxRefs > 0 && totalChecked >= maxRefs) {
      if (!budgetLogged) {
        console.log(
          `  ⏱️  Reached --max-refs ${maxRefs}; leaving remaining references unchanged`
        );
        budgetLogged = true;
      }
      continue;
    }

    const originalCount = article.references.length;
    
    // First, deduplicate by domain
    const dedupedRefs = deduplicateByDomain(article.references);
    if (dedupedRefs.length < originalCount) {
      const dedupCount = originalCount - dedupedRefs.length;
      console.log(`  🔄 [${article.slug}] Removed ${dedupCount} duplicate domain reference(s)`);
      totalDeduplicated += dedupCount;
      article.references = dedupedRefs;
    }
    
    const countAfterDedup = article.references.length;
    const cleanRefs = [];

    for (const ref of article.references) {
      if (
        !ref ||
        typeof ref.url !== "string" ||
        !/^https?:\/\//.test(ref.url)
      ) {
        console.log(
          `  ⚠️  [${article.slug}] Invalid URL format, removing: ${
            ref?.url || "undefined"
          }`
        );
        totalRemoved++;
        totalChecked++;
        continue;
      }

      if (maxRefs > 0 && totalChecked >= maxRefs) {
        if (!budgetLogged) {
          console.log(
            `  ⏱️  Reached --max-refs ${maxRefs}; leaving remaining references unchanged`
          );
          budgetLogged = true;
        }
        cleanRefs.push(ref);
        continue;
      }

      totalChecked++;
      const result = await checkUrl(ref.url);

      if (result.ok) {
        cleanRefs.push(ref);
      } else if (TRANSIENT_KEEP_REASONS.has(result.reason)) {
        // A flaky timeout or a bot-blocking WAF (403/5xx) is not proof the
        // link is dead — keep the reference instead of churning the corpus.
        console.log(
          `  ⏳ [${article.slug}] Keeping reference despite transient error (${result.reason}): ${ref.url}`
        );
        cleanRefs.push(ref);
      } else {
        console.log(
          `  🗑️  [${article.slug}] Removing bad reference: ${ref.url}`
        );
        console.log(
          `      Reason: ${result.reason}, Status: ${
            result.status || "N/A"
          }, Error: ${result.error || "N/A"}`
        );
        totalRemoved++;
      }
    }

    article.references = cleanRefs;

    if (cleanRefs.length < countAfterDedup) {
      console.log(
        `  ✂️  [${article.slug}] Final count: ${cleanRefs.length} reference(s)`
      );
    }
  }

  const totalModified = totalRemoved + totalDeduplicated;
  if (totalModified > 0) {
    if (dryRun) {
      console.log(
        `\n🔸 [DRY RUN] Would modify ${totalModified} reference(s) from ${locale} (${totalRemoved} removed, ${totalDeduplicated} deduplicated)`
      );
    } else {
      // Write back to file with proper formatting
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
      console.log(
        `\n✅ Modified ${totalModified} reference(s) from ${locale} (${totalRemoved} removed, ${totalDeduplicated} deduplicated)`
      );
    }
  } else {
    console.log(`\n✅ No bad references found in ${locale}`);
  }

  return { locale, checked: totalChecked, removed: totalRemoved, deduplicated: totalDeduplicated };
}

async function main() {
  const locales = allLocales
    ? listLocales(TRANSLATIONS_DIR, { requireRessources: true })
    : [oneLocale];

  console.log(`🧹 Cleaning bad article references...`);
  if (dryRun) console.log("🔸 DRY RUN MODE - No files will be modified\n");

  const results = [];
  for (const locale of locales) {
    results.push(await cleanLocale(locale));
  }

  const totalChecked = results.reduce((sum, r) => sum + (r.checked || 0), 0);
  const totalRemoved = results.reduce((sum, r) => sum + (r.removed || 0), 0);
  const totalDeduplicated = results.reduce((sum, r) => sum + (r.deduplicated || 0), 0);

  console.log("\n" + "=".repeat(60));
  console.log(
    `📊 Summary: Checked ${totalChecked} references, removed ${totalRemoved} bad ones, deduplicated ${totalDeduplicated}`
  );
  console.log("=".repeat(60));

  if ((totalRemoved > 0 || totalDeduplicated > 0) && !dryRun) {
    console.log("✅ Files updated. Remember to commit the changes.");
  }
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
