"use strict";

const fs = require("fs");
const path = require("path");

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const FAIL_ON_DRIFT =
  args.has("--fail-on-drift") || process.env.SEO_SUGGEST_FAIL === "1";
const MAX_SUGGEST = parseInt(process.env.SEO_SUGGEST_MAX || "10", 10);
const DRIFT_RATIO = parseFloat(process.env.SEO_SUGGEST_DRIFT_RATIO || "0.4");
const SEEDS_PER_SERVICE = parseInt(
  process.env.SEO_SUGGEST_SEEDS_PER_SERVICE || "1",
  10,
);
const REQUEST_DELAY_MS = parseInt(
  process.env.SEO_SUGGEST_DELAY_MS || "250",
  10,
);

const LOCALES = ["fr", "en", "de", "es", "pt"];
const SERVICE_PATHS = {
  accounting: "/services/accounting",
  taxes: "/services/taxes",
  payroll: "/services/payroll",
  corporate: "/services/corporate",
  domiciliation: "/services/domiciliation",
  incorporation: "/services/incorporation",
  outsourcing: "/services/outsourcing",
  mna: "/services/mergers-acquisitions",
  odoo: "/services/odoo",
  "family-office": "/services/family-office",
  immigration: "/services/immigration",
};

const BASELINE_PATH = path.join(__dirname, "seo-suggest-baseline.json");
const LATEST_PATH = path.join(__dirname, "seo-suggest-latest.json");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function fetchGoogleSuggest(query, locale) {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${locale}&q=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
  return suggestions.slice(0, MAX_SUGGEST);
}

async function fetchBingSuggest(query) {
  const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
  const data = await fetchJson(url);
  const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
  return suggestions.slice(0, MAX_SUGGEST);
}

function loadMetadataSeeds(locale) {
  const metadataPath = path.join(
    process.cwd(),
    "src",
    "translations",
    locale,
    "metadata.json",
  );
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  const seeds = {};

  for (const [serviceKey, pathKey] of Object.entries(SERVICE_PATHS)) {
    const entry = metadata.pages?.[pathKey];
    const keywordString = entry?.keywords || "";
    const list = keywordString
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (list.length === 0) continue;
    seeds[pathKey] = list.slice(0, SEEDS_PER_SERVICE);
  }

  return seeds;
}

function buildSeedMap() {
  const seeds = {};
  for (const locale of LOCALES) {
    seeds[locale] = loadMetadataSeeds(locale);
  }
  return seeds;
}

function normalizeList(list) {
  return list.map((item) => item.toLowerCase().trim());
}

function compareSuggestions(baseline, current) {
  const baseSet = new Set(normalizeList(baseline));
  const currentSet = new Set(normalizeList(current));
  const intersection = [...currentSet].filter((item) => baseSet.has(item));
  const ratio = baseSet.size === 0 ? 1 : 1 - intersection.length / baseSet.size;
  return {
    ratio,
    added: [...currentSet].filter((item) => !baseSet.has(item)),
    removed: [...baseSet].filter((item) => !currentSet.has(item)),
  };
}

async function run() {
  const seedMap = buildSeedMap();
  const baselineExists = fs.existsSync(BASELINE_PATH);
  const baseline = baselineExists
    ? JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
    : null;

  if (!baselineExists && !APPLY) {
    console.log(
      "⚠️ SEO suggest baseline missing. Run with --apply to create it.",
    );
  }

  const results = {
    generatedAt: new Date().toISOString(),
    config: {
      maxSuggestions: MAX_SUGGEST,
      driftRatio: DRIFT_RATIO,
      seedsPerService: SEEDS_PER_SERVICE,
      providers: ["google", "bing"],
    },
    seeds: seedMap,
    results: {},
    errors: {},
  };

  const driftWarnings = [];
  let totalChecks = 0;
  let driftCount = 0;

  for (const locale of LOCALES) {
    results.results[locale] = {};
    results.errors[locale] = {};
    const localeSeeds = seedMap[locale] || {};

    for (const [pathKey, seeds] of Object.entries(localeSeeds)) {
      results.results[locale][pathKey] = {};
      for (const seed of seeds) {
        results.results[locale][pathKey][seed] = {
          google: [],
          bing: [],
        };
        results.errors[locale][pathKey] = results.errors[locale][pathKey] || {};

        try {
          const google = await fetchGoogleSuggest(seed, locale);
          results.results[locale][pathKey][seed].google = google;
        } catch (error) {
          results.errors[locale][pathKey][seed] =
            results.errors[locale][pathKey][seed] || {};
          results.errors[locale][pathKey][seed].google = error.message;
        }
        await sleep(REQUEST_DELAY_MS);

        try {
          const bing = await fetchBingSuggest(seed);
          results.results[locale][pathKey][seed].bing = bing;
        } catch (error) {
          results.errors[locale][pathKey][seed] =
            results.errors[locale][pathKey][seed] || {};
          results.errors[locale][pathKey][seed].bing = error.message;
        }
        await sleep(REQUEST_DELAY_MS);

        if (baseline) {
          const baseLocale = baseline.results?.[locale]?.[pathKey]?.[seed];
          if (baseLocale) {
            totalChecks += 2;
            const googleCompare = compareSuggestions(
              baseLocale.google || [],
              results.results[locale][pathKey][seed].google || [],
            );
            if (googleCompare.ratio >= DRIFT_RATIO) {
              driftCount += 1;
              driftWarnings.push({
                locale,
                pathKey,
                seed,
                provider: "google",
                ratio: googleCompare.ratio,
                added: googleCompare.added,
                removed: googleCompare.removed,
              });
            }

            const bingCompare = compareSuggestions(
              baseLocale.bing || [],
              results.results[locale][pathKey][seed].bing || [],
            );
            if (bingCompare.ratio >= DRIFT_RATIO) {
              driftCount += 1;
              driftWarnings.push({
                locale,
                pathKey,
                seed,
                provider: "bing",
                ratio: bingCompare.ratio,
                added: bingCompare.added,
                removed: bingCompare.removed,
              });
            }
          }
        }
      }
    }
  }

  if (APPLY) {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(results, null, 2) + "\n");
    console.log(`✅ SEO suggest baseline saved to ${BASELINE_PATH}`);
  }

  fs.writeFileSync(LATEST_PATH, JSON.stringify(results, null, 2) + "\n");
  console.log(`✅ SEO suggest latest snapshot saved to ${LATEST_PATH}`);

  if (driftWarnings.length > 0) {
    console.log(
      `⚠️ SEO suggest drift detected in ${driftWarnings.length} checks (threshold ${DRIFT_RATIO}).`,
    );
    for (const warning of driftWarnings) {
      const message = `[${warning.provider}] ${warning.locale} ${warning.pathKey} (${warning.seed}) drift ${(warning.ratio * 100).toFixed(0)}%`;
      console.log(`::warning::${message}`);
      console.log(`  added: ${warning.added.slice(0, 6).join(", ")}`);
      console.log(`  removed: ${warning.removed.slice(0, 6).join(", ")}`);
    }
  } else if (baseline) {
    console.log(
      `✅ SEO suggest drift check passed (${totalChecks} comparisons).`,
    );
  }

  if (FAIL_ON_DRIFT && driftWarnings.length > 0) {
    console.error("❌ Drift threshold exceeded.");
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("❌ SEO suggest drift check failed:", error.message);
  process.exit(0);
});
