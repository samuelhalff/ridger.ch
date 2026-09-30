#!/usr/bin/env node
"use strict";

/**
 * Validate one article (default: the newest pipeline-generated one) across all
 * 5 locales against Ridger's hard rules and SEO/GEO structure:
 *
 *   node scripts/validate-article-seo.js --slug <slug>
 *   node scripts/validate-article-seo.js            # newest article with keywords
 *   node scripts/validate-article-seo.js --hard-rules-all   # report hard-rule hits corpus-wide (non-fatal)
 *
 * Exit 1 on any error. Used by .github/workflows/ai-ressources.yml after the
 * generator, so a hand-edit between generation and commit is re-checked too.
 */

const fs = require("fs");
const path = require("path");
const rules = require("./lib/ridgerArticleRules");
const { isBlockedDomain } = require("./lib/referenceValidator");
const { sortArticlesNewestFirst } = require("./lib/articleBacklog");
const { checkOfficialOnlyReferences } = require("./lib/officialReferencePolicy");

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const argValue = (name) => {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : "";
};

function load(locale) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "src", "translations", locale, "ressources.json"), "utf8"));
}

function main() {
  const data = Object.fromEntries(rules.LOCALES.map((l) => [l, load(l)]));
  const fr = data.fr.Articles || [];

  if (argv.includes("--hard-rules-all")) {
    let hits = 0;
    for (const l of rules.LOCALES) {
      for (const a of data[l].Articles || []) {
        for (const v of rules.checkHardRules(a)) {
          hits++;
          console.log(`- [${l}] ${a.slug}: ${v.code} — ${v.excerpt.slice(0, 140)}`);
        }
      }
    }
    console.log(hits ? `ℹ️ ${hits} hard-rule hit(s) in the existing corpus (report only)` : "✅ No hard-rule hits in the corpus");
    return;
  }

  let slug = argValue("--slug") || process.env.LATEST_ARTICLE_SLUG || "";
  if (!slug) {
    const generated = sortArticlesNewestFirst(fr).find((a) => a.keywords && a.keywords.primary);
    if (!generated) {
      console.log("ℹ️ No pipeline-generated article (with keywords) to validate.");
      return;
    }
    slug = generated.slug;
  }

  const errors = validateArticle(data, slug, { servicePathMaps: rules.loadServicePathMaps(ROOT) });
  if (errors.length) {
    console.error(`❌ Article SEO/GEO validation failed for ${slug}:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✅ ${slug}: hard rules, SEO/GEO structure, number & structure parity OK in ${rules.LOCALES.length} locales`);
}

/**
 * Locate the one article with `slug` in a locale. Exactly one is required:
 * 0 → missing, >1 → duplicate (a find() would silently validate only the
 * first copy while the site renders/links whichever it resolves).
 */
function locateUnique(articles, slug) {
  const indexes = [];
  (articles || []).forEach((a, i) => {
    if (a && a.slug === slug) indexes.push(i);
  });
  return indexes;
}

/** Pure validation of one article across all locales; returns error strings. */
function validateArticle(data, slug, { servicePathMaps } = {}) {
  const errors = [];
  const fr = data.fr?.Articles || [];
  const slugs = fr.map((a) => a.slug);
  const frIdx = locateUnique(fr, slug);
  if (frIdx.length === 0) return [`[fr] ${slug} not found in fr/ressources.json`];
  if (frIdx.length > 1) return [`[fr] duplicate slug ${slug} (${frIdx.length} articles at indexes ${frIdx.join(", ")}) — exactly one required`];
  const frIndex = frIdx[0];
  const frArticle = fr[frIndex];

  for (const locale of rules.LOCALES) {
    const articles = data[locale]?.Articles || [];
    const idx = locateUnique(articles, slug);
    if (idx.length === 0) {
      errors.push(`[${locale}] missing article`);
      continue;
    }
    if (idx.length > 1) {
      errors.push(`[${locale}] duplicate slug ${slug} (${idx.length} articles at indexes ${idx.join(", ")}) — exactly one required`);
      continue;
    }
    const article = articles[idx[0]];
    if (idx[0] !== frIndex) errors.push(`[${locale}] article index differs from FR (key-parity is index-based)`);
    checkOfficialOnlyReferences(article).forEach((e) => errors.push(`[${locale}] ${e}`));
    const kw = article.keywords || {};
    if (!kw.primary || !Array.isArray(kw.secondary)) errors.push(`[${locale}] missing keywords {primary, secondary[]}`);
    for (const v of rules.checkHardRules(article)) {
      errors.push(`[${locale}] ${v.code}: ${v.message}${v.excerpt ? ` — « ${v.excerpt.slice(0, 160)} »` : ""}`);
    }
    const seo = rules.checkSeoStructure(article, {
      locale,
      keywords: kw,
      allowedInternalPaths: rules.buildAllowedInternalPaths(locale, { servicePathMaps, articleSlugs: slugs }),
      isTrustedDomain: (url) => !isBlockedDomain(url),
      checkSlug: locale === "fr",
    });
    const seoErrors = locale === "fr" ? seo.errors : seo.errors.filter((e) => !/^word count/.test(e));
    seoErrors.forEach((e) => errors.push(`[${locale}] ${e}`));
    seo.warnings.forEach((w) => console.warn(`⚠️ [${locale}] ${w}`));
    if (locale !== "fr") {
      const num = rules.compareNumberParity(frArticle.content, article.content);
      if (!num.ok) errors.push(`[${locale}] number parity — missing ${num.missing.join(", ") || "-"}; extra ${num.extra.join(", ") || "-"}`);
      const st = rules.compareStructure(frArticle.content, article.content);
      if (!st.ok) errors.push(`[${locale}] structure differs from FR: ${st.diffs.join("; ")}`);
      if (article.content === frArticle.content) errors.push(`[${locale}] content identical to FR (not translated)`);
      if ((article.keywords?.secondary || []).length !== (frArticle.keywords?.secondary || []).length) {
        errors.push(`[${locale}] keywords.secondary length differs from FR`);
      }
      if ((article.tags || []).length !== (frArticle.tags || []).length) errors.push(`[${locale}] tags length differs from FR`);
    }
  }
  return errors;
}

if (require.main === module) main();

module.exports = { locateUnique, validateArticle };
