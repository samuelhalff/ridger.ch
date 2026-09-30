"use strict";

/**
 * Unit tests for the deterministic title-casing normaliser
 * (scripts/lib/titleCase.js), exercised on realistic strings for all 5
 * Ridger locales, including the exact damaged strings this module was
 * introduced to fix (rachat-lpp-calcul-deduction-fiscale-conditions-etranger).
 */

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  capitalizeFirst,
  applyAcronyms,
  applyCountryNames,
  normalizeTitleCasing,
  normalizeFaqQuestions,
  normalizeArticleCasing,
  startsWithLowercase,
} = require("./titleCase");

// ─── capitalizeFirst ───────────────────────────────────────────────────────

test("capitalizeFirst uppercases only the first letter, all locales", () => {
  assert.equal(capitalizeFirst("rachat lpp : calcul"), "Rachat lpp : calcul"); // fr
  assert.equal(capitalizeFirst("pension fund buy in switzerland"), "Pension fund buy in switzerland"); // en
  assert.equal(capitalizeFirst("pk einkauf: Berechnung"), "Pk einkauf: Berechnung"); // de (acronym fixed separately)
  assert.equal(capitalizeFirst("aportación voluntaria lpp"), "Aportación voluntaria lpp"); // es
  assert.equal(capitalizeFirst("contribuição voluntária lpp"), "Contribuição voluntária lpp"); // pt
});

test("capitalizeFirst is a no-op on an already-capitalised string", () => {
  assert.equal(capitalizeFirst("Rachat LPP : calcul"), "Rachat LPP : calcul");
});

test("capitalizeFirst leaves empty/non-string input untouched", () => {
  assert.equal(capitalizeFirst(""), "");
  assert.equal(capitalizeFirst(undefined), undefined);
  assert.equal(capitalizeFirst(null), null);
});

// ─── applyAcronyms ──────────────────────────────────────────────────────────

test("applyAcronyms uppercases whole-word Swiss acronyms, all locales", () => {
  assert.equal(applyAcronyms("rachat lpp : calcul"), "rachat LPP : calcul"); // fr
  assert.equal(applyAcronyms("bvg buy in tax deductions"), "BVG buy in tax deductions"); // en
  assert.equal(applyAcronyms("pk einkauf: Berechnung"), "PK einkauf: Berechnung"); // de
  assert.equal(applyAcronyms("aportación voluntaria lpp"), "aportación voluntaria LPP"); // es
  assert.equal(applyAcronyms("contribuição voluntária lpp"), "contribuição voluntária LPP"); // pt
});

test("applyAcronyms is word-bounded (does not touch substrings)", () => {
  assert.equal(applyAcronyms("Pkw und pk-Systeme"), "Pkw und PK-Systeme");
  assert.equal(applyAcronyms("euphoria"), "euphoria");
});

test("applyAcronyms normalises LAMal to its canonical mixed case", () => {
  assert.equal(applyAcronyms("assurance lamal en suisse"), "assurance LAMal en suisse");
});

// ─── applyCountryNames ──────────────────────────────────────────────────────

test("applyCountryNames capitalises country names per locale", () => {
  assert.equal(applyCountryNames("rachat lpp en suisse"), "rachat lpp en Suisse"); // fr
  assert.equal(applyCountryNames("pension fund buy in switzerland"), "pension fund buy in Switzerland"); // en
  assert.equal(applyCountryNames("pk einkauf in der schweiz"), "pk einkauf in der Schweiz"); // de
  assert.equal(applyCountryNames("segundo pilar en suiza"), "segundo pilar en Suiza"); // es
  assert.equal(applyCountryNames("segundo pilar na suíça"), "segundo pilar na Suíça"); // pt
});

// ─── normalizeTitleCasing (combined) ───────────────────────────────────────

test("normalizeTitleCasing fixes the real damaged EN title", () => {
  assert.equal(
    normalizeTitleCasing("pension fund buy in switzerland: buy-in, tax rules", "en"),
    "Pension fund buy in Switzerland: buy-in, tax rules",
  );
});

test("normalizeTitleCasing fixes the real damaged DE title (keeps German noun capitals)", () => {
  assert.equal(
    normalizeTitleCasing("pk einkauf: Berechnung, Steuerabzug und Vorsichtsmassnahmen", "de"),
    "PK einkauf: Berechnung, Steuerabzug und Vorsichtsmassnahmen",
  );
  // DE must never be lowercased: existing capitals on nouns are untouched.
  assert.equal(normalizeTitleCasing("PK-Einkauf: Berechnung", "de"), "PK-Einkauf: Berechnung");
});

test("normalizeTitleCasing fixes the real damaged PT title", () => {
  assert.equal(
    normalizeTitleCasing("contribuição voluntária lpp: cálculo e dedução", "pt"),
    "Contribuição voluntária LPP: cálculo e dedução",
  );
});

test("normalizeTitleCasing is idempotent on already-correct FR and ES titles", () => {
  assert.equal(
    normalizeTitleCasing("Rachat LPP : calcul, déduction fiscale et points de vigilance", "fr"),
    "Rachat LPP : calcul, déduction fiscale et points de vigilance",
  );
  assert.equal(
    normalizeTitleCasing("Aportación voluntaria LPP: cálculo, deducción fiscal y precauciones", "es"),
    "Aportación voluntaria LPP: cálculo, deducción fiscal y precauciones",
  );
});

test("normalizeTitleCasing never reorders, removes or adds characters (case-only)", () => {
  const before = "pk einkauf: Berechnung, Steuerabzug und Vorsichtsmassnahmen";
  const after = normalizeTitleCasing(before, "de");
  assert.equal(after.length, before.length);
  assert.equal(after.toLowerCase(), before.toLowerCase());
});

// ─── normalizeFaqQuestions ──────────────────────────────────────────────────

test("normalizeFaqQuestions capitalises FAQ question headings only, all locales", () => {
  const content = [
    "Some intro paragraph.",
    "",
    "## Frequently asked questions",
    "",
    "### what is a pension fund buy-in?",
    "",
    "Answer text mentions lpp in the body (left untouched).",
    "",
    "### how does a bvg buy-in work?",
  ].join("\n");
  const fixed = normalizeFaqQuestions(content);
  assert.match(fixed, /### What is a pension fund buy-in\?/);
  assert.match(fixed, /### How does a BVG buy-in work\?/);
  assert.match(fixed, /Answer text mentions lpp in the body \(left untouched\)\./);
});

test("normalizeFaqQuestions is a no-op when there is no FAQ heading", () => {
  const content = "Just a paragraph with no headings at all.";
  assert.equal(normalizeFaqQuestions(content), content);
});

// ─── normalizeArticleCasing ─────────────────────────────────────────────────

test("normalizeArticleCasing fixes title, seoTitle and FAQ questions in place, per locale", () => {
  const cases = [
    { locale: "fr", title: "rachat lpp : calcul", seoTitle: "rachat lpp : calcul" },
    { locale: "en", title: "pension fund buy in switzerland: buy-in rules", seoTitle: "pension fund buy in switzerland" },
    { locale: "de", title: "pk einkauf: Berechnung", seoTitle: "pk einkauf: Bedingungen" },
    { locale: "es", title: "aportación voluntaria lpp: cálculo", seoTitle: "aportación voluntaria lpp" },
    { locale: "pt", title: "contribuição voluntária lpp: cálculo", seoTitle: "contribuição voluntária lpp" },
  ];
  for (const c of cases) {
    const article = {
      title: c.title,
      seoTitle: c.seoTitle,
      content: "### why does this matter?",
    };
    const out = normalizeArticleCasing(article, c.locale);
    assert.equal(startsWithLowercase(out.title), false, `[${c.locale}] title still lowercase-started`);
    assert.equal(startsWithLowercase(out.seoTitle), false, `[${c.locale}] seoTitle still lowercase-started`);
    assert.match(out.content, /### Why does this matter\?/);
    assert.equal(out, article, "mutates and returns the same object");
  }
});

test("normalizeArticleCasing tolerates missing/non-string fields", () => {
  assert.equal(normalizeArticleCasing(null, "en"), null);
  const article = { title: 42, content: undefined };
  assert.doesNotThrow(() => normalizeArticleCasing(article, "en"));
});

// ─── startsWithLowercase (the validator predicate) ─────────────────────────

test("startsWithLowercase detects the exact damage this feature targets", () => {
  assert.equal(startsWithLowercase("pension fund buy in switzerland: buy-in rules"), true); // en
  assert.equal(startsWithLowercase("pk einkauf: Berechnung"), true); // de
  assert.equal(startsWithLowercase("contribuição voluntária lpp: cálculo"), true); // pt
  assert.equal(startsWithLowercase("Rachat LPP : calcul"), false); // fr, already fine
  assert.equal(startsWithLowercase("Aportación voluntaria LPP"), false); // es, already fine
});

test("startsWithLowercase treats empty/non-string input as not-lowercase-started", () => {
  assert.equal(startsWithLowercase(""), false);
  assert.equal(startsWithLowercase(undefined), false);
});
