"use strict";

/**
 * Deterministic casing normaliser for generated/translated article titles.
 *
 * The AI pipeline occasionally copies a lowercase autocomplete keyword
 * straight into `title` / `seoTitle` (e.g. "pension fund buy in
 * switzerland: …", "pk einkauf: …"). This module is a small, rule-based
 * (no-LLM) fixer applied after generation/translation and before
 * validation:
 *
 *   - capitalise the first letter of the string;
 *   - uppercase a whitelist of Swiss acronyms, matched as whole words
 *     (so "pk einkauf" → "PK einkauf", "lpp" → "LPP");
 *   - capitalise known country names (Switzerland/Suisse/Schweiz/Suíça/Suiza);
 *   - never lowercase anything — German capitalises common nouns
 *     ("PK-Einkauf", "Pensionskasse") and this module must not undo that.
 *
 * It is intentionally dumb: it never rewords, reorders or removes text —
 * only casing of existing characters can change. That keeps it safe to run
 * on every locale, every time, with no LLM round-trip and no invariant to
 * verify (unlike scripts/fix-article-casing.js, which is an LLM-based,
 * one-off repair tool for already-published damaged prose).
 */

// Swiss/legal acronyms that must render in upper case as whole words.
// Key = canonical display form. Matched case-insensitively, word-bounded.
const ACRONYMS = [
  "LPP",
  "BVG",
  "PK",
  "AVS",
  "AHV",
  "LAMal",
  "KVG",
  "IFD",
  "DBG",
  "LIFD",
  "AFC",
  "ESTV",
  "SEM",
  "CHF",
  "UE",
  "EU",
  "EFTA",
  "AELE",
  "OPP2",
];

// Proper nouns (country names) that must be capitalised whenever they occur.
const COUNTRY_NAMES = ["Switzerland", "Suisse", "Schweiz", "Suíça", "Suiza"];

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Capitalise the first alphabetic character of a string, leaving any
 * leading punctuation/whitespace/markdown markers untouched.
 */
function capitalizeFirst(str) {
  if (typeof str !== "string" || !str) return str;
  const m = str.match(/^([^A-Za-zÀ-ÖØ-öø-ÿ]*)([A-Za-zÀ-ÖØ-öø-ÿ])(.*)$/s);
  if (!m) return str;
  const [, lead, first, rest] = m;
  return lead + first.toUpperCase() + rest;
}

/** Uppercase every whole-word occurrence of a known Swiss acronym. */
function applyAcronyms(str) {
  if (typeof str !== "string" || !str) return str;
  let out = str;
  for (const acro of ACRONYMS) {
    const re = new RegExp(`\\b${escapeRegExp(acro)}\\b`, "gi");
    out = out.replace(re, acro);
  }
  return out;
}

/** Capitalise every whole-word occurrence of a known country name. */
function applyCountryNames(str) {
  if (typeof str !== "string" || !str) return str;
  let out = str;
  for (const name of COUNTRY_NAMES) {
    const re = new RegExp(`\\b${escapeRegExp(name)}\\b`, "gi");
    out = out.replace(re, name);
  }
  return out;
}

/**
 * Normalise a single title-like field (title, seoTitle, metaDescription,
 * description, imageAlt, a FAQ question, …) for any of the 5 locales.
 *
 * `locale` is accepted for symmetry / future locale-specific rules, but the
 * current rule set is locale-agnostic: it only ever raises case, never
 * lowers it, which already satisfies "for DE don't lowercase anything".
 */
function normalizeTitleCasing(str, _locale) {
  if (typeof str !== "string" || !str) return str;
  let out = str;
  out = applyAcronyms(out);
  out = applyCountryNames(out);
  out = capitalizeFirst(out);
  return out;
}

// Matches a FAQ question heading: "### <question>"
const FAQ_QUESTION_LINE_RE = /^(###\s+)(.*)$/;

/**
 * Apply normalizeTitleCasing to the first letter (+ acronyms/country names)
 * of every "### …" FAQ question heading in an article's markdown body.
 * Non-heading lines are left untouched.
 */
function normalizeFaqQuestions(content) {
  if (typeof content !== "string" || !content) return content;
  return content
    .split("\n")
    .map((line) => {
      const m = line.match(FAQ_QUESTION_LINE_RE);
      if (!m) return line;
      return m[1] + normalizeTitleCasing(m[2]);
    })
    .join("\n");
}

/**
 * Normalise the casing-sensitive fields of a freshly generated/translated
 * article in place: title, seoTitle (both double as the H1, since the page
 * renders `title` as H1) and every FAQ question heading in `content`.
 * Returns the same object (mutated) for convenient chaining.
 */
function normalizeArticleCasing(article, locale) {
  if (!article || typeof article !== "object") return article;
  if (typeof article.title === "string") article.title = normalizeTitleCasing(article.title, locale);
  if (typeof article.seoTitle === "string") article.seoTitle = normalizeTitleCasing(article.seoTitle, locale);
  if (typeof article.content === "string") article.content = normalizeFaqQuestions(article.content);
  return article;
}

/** True when `str` starts with a lowercase letter (the validator rule). */
function startsWithLowercase(str) {
  if (typeof str !== "string" || !str) return false;
  const m = str.match(/^[^A-Za-zÀ-ÖØ-öø-ÿ]*([A-Za-zÀ-ÖØ-öø-ÿ])/);
  if (!m) return false;
  const ch = m[1];
  return ch === ch.toLowerCase() && ch !== ch.toUpperCase();
}

module.exports = {
  ACRONYMS,
  COUNTRY_NAMES,
  capitalizeFirst,
  applyAcronyms,
  applyCountryNames,
  normalizeTitleCasing,
  normalizeFaqQuestions,
  normalizeArticleCasing,
  startsWithLowercase,
};
