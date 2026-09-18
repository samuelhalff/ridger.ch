#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  extractDomain,
  isBlockedDomain,
} = require("./lib/referenceValidator");
const { listLocales } = require("./lib/ressources");

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");
const args = process.argv.slice(2);

const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const index = args.indexOf(name);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : fallback;
};

const allLocales = flag("--all-locales");
const locale = value("--locale", "fr");
const asJson = flag("--json");

function normalizeUrl(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/[)\].,;:!?*]+$/g, "");
}

function extractUrls(text) {
  if (typeof text !== "string" || !text) return [];
  return [...text.matchAll(/https?:\/\/[^\s"'<>]+/g)]
    .map((match) => normalizeUrl(match[0]))
    .filter(Boolean);
}

function recordUrl(violations, context, rawUrl) {
  const url = normalizeUrl(rawUrl);
  if (!url) return;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    violations.push({ ...context, url, domain: null, reason: "invalid-url" });
    return;
  }

  if (isBlockedDomain(url)) {
    violations.push({
      ...context,
      url,
      domain: extractDomain(url) || parsed.hostname.toLowerCase(),
      reason: "disallowed-source-domain",
    });
  }
}

function scanLocale(loc) {
  const filePath = path.join(TRANSLATIONS_DIR, loc, "ressources.json");
  const violations = [];

  if (!fs.existsSync(filePath)) {
    return [{ locale: loc, file: filePath, reason: "missing-ressources-file" }];
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  for (const item of Array.isArray(data.Files) ? data.Files : []) {
    if (item?.source_url) {
      recordUrl(violations, {
        locale: loc,
        type: "file-source",
        slug: item.filename || item.title || null,
      }, item.source_url);
    }
  }

  for (const article of Array.isArray(data.Articles) ? data.Articles : []) {
    const slug = article?.slug || null;
    for (const ref of Array.isArray(article?.references) ? article.references : []) {
      recordUrl(violations, {
        locale: loc,
        type: "article-reference",
        slug,
        labelKey: ref?.labelKey || null,
      }, ref?.url);
    }

    for (const url of extractUrls(article?.content)) {
      recordUrl(violations, {
        locale: loc,
        type: "article-content",
        slug,
      }, url);
    }
  }

  return violations;
}

function main() {
  const locales = allLocales
    ? listLocales(TRANSLATIONS_DIR, { requireRessources: true })
    : [locale];
  const violations = locales.flatMap(scanLocale);

  if (asJson) {
    console.log(JSON.stringify({ checkedLocales: locales, violations }, null, 2));
  } else if (violations.length) {
    console.log("Disallowed reference source URLs found:");
    for (const item of violations) {
      const where = [item.locale, item.type, item.slug].filter(Boolean).join(" / ");
      const label = item.labelKey ? ` / ${item.labelKey}` : "";
      console.log(`- ${where}${label}: ${item.url || item.file} (${item.reason})`);
    }
  } else {
    console.log(
      `Reference source policy passed for ${locales.length} locale(s).`,
    );
  }

  if (violations.length) process.exit(1);
}

main();
