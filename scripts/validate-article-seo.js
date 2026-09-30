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

  const servicePathMaps = rules.loadServicePathMaps(ROOT);
  const slugs = fr.map((a) => a.slug);
  const errors = [];
  const frArticle = fr.find((a) => a.slug === slug);
  if (!frArticle) {
    console.error(`❌ ${slug} not found in fr/ressources.json`);
    process.exit(1);
  }
  const frIndex = fr.indexOf(frArticle);

  for (const locale of rules.LOCALES) {
    const articles = data[locale].Articles || [];
    const article = articles.find((a) => a.slug === slug);
    if (!article) {
      errors.push(`[${locale}] missing article`);
      continue;
    }
    if (articles.indexOf(article) !== frIndex) errors.push(`[${locale}] article index differs from FR (key-parity is index-based)`);
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

  if (errors.length) {
    console.error(`❌ Article SEO/GEO validation failed for ${slug}:`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
  console.log(`✅ ${slug}: hard rules, SEO/GEO structure, number & structure parity OK in ${rules.LOCALES.length} locales`);
}

main();
