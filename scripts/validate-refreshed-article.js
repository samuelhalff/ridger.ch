#!/usr/bin/env node
"use strict";

/**
 * Blocking validator for ONE refreshed article, run by the autonomous refresh
 * workflow right after the refresh (and again after a rebase onto a moved main):
 *
 *   node scripts/validate-refreshed-article.js --slug <slug> [--base <git-ref>] [--today YYYY-MM-DD]
 *
 * Env: SEO_MIN_WORDS / SEO_MAX_WORDS (default 1100 / 1900, same as the generator).
 *
 * Reuses validateArticle() from validate-article-seo.js (hard rules, official-only
 * references, keywords, SEO/GEO structure, number + structure parity, tags) and
 * adds what is specific to a refresh: word range, real translation, references
 * policy, localized internal links, slug/date/category unchanged vs the base
 * commit, `updated` == today, outdated VAT rates, and "no other article changed".
 *
 * Ridger has no lead-path rule (no quote tool, no AI agent), so none is checked.
 * Exit 1 on any error.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rules = require("./lib/ridgerArticleRules");
const { validateArticle, locateUnique } = require("./validate-article-seo");
const { MIN_OFFICIAL_REFERENCES } = require("./lib/officialReferencePolicy");
const { extractOutdatedSwissVatRateMatches } = require("./lib/outdatedVatValidator");

const PRESERVED_FIELDS = ["slug", "date", "category", "backlogId"];
// Locale word counts follow the language (German is shorter, Spanish longer):
// they must stay within this band of the FR count.
const LOCALE_WORD_BAND = [0.7, 1.3];

function words(text) {
  return rules.countWords(rules.stripMarkdownLinks(String(text || "")));
}

/** Short all-capitalised strings (proper nouns, acronyms) may legitimately be identical across languages. */
function looksLikeProperNoun(s) {
  const t = String(s || "").trim().split(/\s+/).filter(Boolean);
  return t.length > 0 && t.length <= 3 && t.every((w) => /^[\p{Lu}\d]/u.test(w));
}

function isValidHttps(u) {
  try {
    return new URL(u).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * @param {object} o
 * @param {string} o.slug
 * @param {Record<string,{Articles:object[]}>} o.current  locale -> parsed ressources.json (working tree)
 * @param {Record<string,{Articles:object[]}>} o.baseline locale -> parsed ressources.json at the base commit
 * @param {string} o.today  YYYY-MM-DD
 * @returns {string[]} error strings (empty = valid)
 */
function validateRefreshed({ slug, current, baseline, today, minWords = 1100, maxWords = 1900, servicePathMaps }) {
  const errors = [];
  const L = rules.LOCALES;

  // The standard article validator (also reports missing/duplicate slugs).
  errors.push(...validateArticle(current, slug, { servicePathMaps }));
  const frIdx = locateUnique(current.fr?.Articles, slug);
  if (frIdx.length !== 1) return errors;
  const fr = current.fr.Articles[frIdx[0]];

  const frWords = words(fr.content);
  if (frWords < minWords || frWords > maxWords) errors.push(`[fr] word count ${frWords} outside ${minWords}–${maxWords}`);

  const frUrls = (fr.references || []).map((r) => r && r.url);
  for (const locale of L) {
    const idx = locateUnique(current[locale]?.Articles, slug);
    if (idx.length !== 1) continue; // already reported by validateArticle
    const a = current[locale].Articles[idx[0]];
    const tag = `[${locale}]`;

    for (const f of ["title", "description", "content"]) {
      if (!String(a[f] || "").trim()) errors.push(`${tag} ${f} is empty`);
    }
    if (!Array.isArray(a.tags) || a.tags.filter((t) => String(t).trim()).length < 3) errors.push(`${tag} fewer than 3 tags`);

    if (locale !== "fr") {
      if (a.description === fr.description && !looksLikeProperNoun(a.description)) errors.push(`${tag} description identical to FR (not translated)`);
      if (a.title === fr.title && !looksLikeProperNoun(a.title)) errors.push(`${tag} title identical to FR (not translated)`);
      const w = words(a.content);
      const lo = Math.floor(frWords * LOCALE_WORD_BAND[0]);
      const hi = Math.ceil(frWords * LOCALE_WORD_BAND[1]);
      if (w < lo || w > hi) errors.push(`${tag} word count ${w} outside ${lo}–${hi} (FR has ${frWords})`);
    }

    // References: unique valid https URLs, at least the repo minimum, same set as FR.
    const urls = (a.references || []).map((r) => r && r.url);
    if (urls.length < MIN_OFFICIAL_REFERENCES) errors.push(`${tag} ${urls.length} references (min ${MIN_OFFICIAL_REFERENCES})`);
    if (urls.some((u) => typeof u !== "string" || !isValidHttps(u))) errors.push(`${tag} reference with a missing or non-https URL`);
    if (new Set(urls).size !== urls.length) errors.push(`${tag} duplicate reference URLs`);
    if (locale !== "fr" && JSON.stringify([...urls].sort()) !== JSON.stringify([...frUrls].sort())) errors.push(`${tag} reference URLs differ from FR`);

    // Internal links: localized (resolution is checked by validateArticle).
    for (const link of rules.extractInternalLinks(a.content)) {
      const p = link.href.split(/[?#]/)[0];
      if (p !== `/${locale}` && !p.startsWith(`/${locale}/`)) errors.push(`${tag} internal link is not localized: ${link.href}`);
    }

    if (extractOutdatedSwissVatRateMatches(a).length) errors.push(`${tag} mentions an outdated Swiss VAT rate`);
    if (a.updated !== today) errors.push(`${tag} updated is "${a.updated}", expected ${today}`);

    // Against the base commit: identity fields unchanged, nothing else touched.
    const baseArticles = baseline?.[locale]?.Articles;
    if (!Array.isArray(baseArticles)) {
      errors.push(`${tag} baseline not available`);
      continue;
    }
    const baseIdx = locateUnique(baseArticles, slug);
    if (baseIdx.length !== 1) {
      errors.push(`${tag} article not found in baseline exactly once`);
      continue;
    }
    const b = baseArticles[baseIdx[0]];
    for (const f of PRESERVED_FIELDS) {
      if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) errors.push(`${tag} ${f} changed (${JSON.stringify(b[f])} -> ${JSON.stringify(a[f])})`);
    }
    const cur = current[locale].Articles;
    if (cur.length !== baseArticles.length) errors.push(`${tag} article count changed (${baseArticles.length} -> ${cur.length})`);
    else {
      cur.forEach((x, i) => {
        if (i !== idx[0] && JSON.stringify(x) !== JSON.stringify(baseArticles[i])) errors.push(`${tag} unrelated article changed: ${x.slug}`);
      });
    }
    for (const k of Object.keys(current[locale])) {
      if (k !== "Articles" && JSON.stringify(current[locale][k]) !== JSON.stringify(baseline[locale][k])) errors.push(`${tag} unrelated key changed: ${k}`);
    }
  }
  return errors;
}

function loadWorkingTree(root) {
  return Object.fromEntries(
    rules.LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(root, "src", "translations", l, "ressources.json"), "utf8"))]),
  );
}

function loadFromGit(ref, root) {
  const out = {};
  for (const l of rules.LOCALES) {
    const r = spawnSync("git", ["show", `${ref}:src/translations/${l}/ressources.json`], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (r.status !== 0) throw new Error(`git show ${ref}:${l}/ressources.json failed: ${(r.stderr || "").trim()}`);
    out[l] = JSON.parse(r.stdout);
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const val = (name) => {
    const i = argv.indexOf(name);
    return i !== -1 ? argv[i + 1] || "" : "";
  };
  const slug = val("--slug");
  if (!slug) {
    console.error("usage: validate-refreshed-article.js --slug <slug> [--base <ref>] [--today YYYY-MM-DD]");
    process.exit(2);
  }
  const root = process.cwd();
  const today = val("--today") || new Date().toISOString().slice(0, 10);
  const minWords = parseInt(process.env.SEO_MIN_WORDS || "1100", 10);
  const maxWords = parseInt(process.env.SEO_MAX_WORDS || "1900", 10);
  const errors = validateRefreshed({
    slug,
    current: loadWorkingTree(root),
    baseline: loadFromGit(val("--base") || "HEAD", root),
    today,
    minWords,
    maxWords,
    servicePathMaps: rules.loadServicePathMaps(root),
  });
  if (errors.length) {
    console.error(`❌ Refreshed article validation failed for ${slug}:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✅ ${slug}: refreshed article valid in ${rules.LOCALES.length} locales (${minWords}–${maxWords} words, updated ${today})`);
}

if (require.main === module) main();

module.exports = { validateRefreshed, loadFromGit, loadWorkingTree };
