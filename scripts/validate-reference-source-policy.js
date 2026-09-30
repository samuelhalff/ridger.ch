#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  DISALLOWED_FIRM_SOURCE_DOMAINS,
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
// --slug <slug>: scope the scan to one article (the pipeline's new article).
// Without it the whole corpus is scanned exactly as before.
const onlySlug = value("--slug", "");

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

// Quasi-official bodies accepted as article sources on top of the shared
// allowlist in lib/referenceValidator.js. They are not authorities, but they
// carry a statutory or officially recognised role, so they are not "private
// sources" in the sense of the policy (unlike Big-4 firms, banks or lobbies):
//   - esisuisse.ch: the Swiss depositor protection scheme (art. 37h LB)
//   - steuerkonferenz.ch / ssk-csi.ch: Swiss Tax Conference (CSI/SSK), the
//     conference of the cantonal tax administrations (steuerkonferenz.ch now
//     redirects to ssk-csi.ch)
//   - osfin.ch / osfincontrol.ch: FINMA-authorised supervisory organisation
//     for portfolio managers and trustees (osfin.ch now redirects to
//     osfincontrol.ch)
//   - zewo.ch: the officially recognised Swiss certification for charities
//     collecting donations
//   - swissbanking.ch: the banking sector's self-regulation body, whose
//     agreements (e.g. CDB due diligence convention) FINMA recognises as
//     minimum standards
// Firm/competitor domains stay blocked: these hosts are only exempted from
// the "not on the allowlist" rule.
const QUASI_OFFICIAL_DOMAINS = [
  "esisuisse.ch",
  "steuerkonferenz.ch",
  "ssk-csi.ch",
  "osfin.ch",
  "osfincontrol.ch",
  "zewo.ch",
  "swissbanking.ch",
];

function isQuasiOfficial(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const matches = (d) => host === d || host.endsWith(`.${d}`);
    return (
      QUASI_OFFICIAL_DOMAINS.some(matches) &&
      !DISALLOWED_FIRM_SOURCE_DOMAINS.some(matches)
    );
  } catch {
    return false;
  }
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

  if (isBlockedDomain(url) && !isQuasiOfficial(url)) {
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

  for (const item of onlySlug ? [] : Array.isArray(data.Files) ? data.Files : []) {
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
    if (onlySlug && slug !== onlySlug) continue;
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
  if (onlySlug) {
    const found = locales.every((loc) => {
      const fp = path.join(TRANSLATIONS_DIR, loc, "ressources.json");
      const d = fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf8")) : {};
      return (d.Articles || []).some((a) => a?.slug === onlySlug);
    });
    if (!found) {
      console.error(`Article ${onlySlug} not found in every checked locale.`);
      process.exit(1);
    }
  }

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
