/**
 * FAQ content checks: every page FAQ ("Faq", locations.json
 * "Cities.<city>.Faq") and every article FAQ must give valid FAQPage JSON-LD
 * (name + acceptedAnswer text) built from the exact text the page shows, and
 * every page keeps the same FAQ pages in all five locales. Typography
 * (U+202F in French, no em dash) is enforced on page FAQs.
 */
import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import { parseFaq } from "./page-faq.ts";
import { extractArticleFaq } from "./articleSeo.ts";
import { buildFAQPage } from "./structuredData.ts";

const LOCALES = ["fr", "en", "de", "es", "pt"];
const dir = (l: string) => path.join(process.cwd(), "src", "translations", l);
const read = (l: string, ns: string) => JSON.parse(fs.readFileSync(path.join(dir(l), `${ns}.json`), "utf8"));

/** Every page FAQ of a locale: "ns" or "ns:Cities.<city>" -> raw Faq. */
function pageFaqs(l: string): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const file of fs.readdirSync(dir(l)).filter((f) => f.endsWith(".json"))) {
    const ns = file.replace(/\.json$/, "");
    const data = read(l, ns);
    if (data.Faq) out.set(ns, data.Faq);
    for (const [city, c] of Object.entries((data.Cities ?? {}) as Record<string, { Faq?: unknown }>)) {
      if (c?.Faq) out.set(`${ns}:Cities.${city}`, c.Faq);
    }
  }
  return out;
}

function checkEntries(where: string, locale: string, entries: { question: string; answer: string }[], min: number, max: number, style = true) {
  assert.ok(entries.length >= min && entries.length <= max, `${where}: ${entries.length} questions`);
  const ld = JSON.parse(JSON.stringify(buildFAQPage(entries)));
  assert.equal(ld["@type"], "FAQPage");
  ld.mainEntity.forEach((q: { name: string; acceptedAnswer: { text: string } }, i: number) => {
    assert.equal(q.name, entries[i].question, `${where}: JSON-LD question differs from visible text`);
    assert.equal(q.acceptedAnswer.text, entries[i].answer, `${where}: JSON-LD answer differs from visible text`);
    assert.match(q.name, /[?？]$/, `${where}: question without "?": ${q.name}`);
    if (style) assert.ok(!/—/.test(q.name + q.acceptedAnswer.text), `${where}: em dash`);
    if (style && locale === "fr") assert.ok(!/ [?!:;]/.test(q.name + " " + q.acceptedAnswer.text), `${where}: plain space before ?!:; (needs U+202F)`);
  });
}

test("page FAQs are complete and valid in every locale", () => {
  let pages = 0;
  for (const locale of LOCALES) {
    for (const [where, raw] of pageFaqs(locale)) {
      const faq = parseFaq(raw);
      assert.ok(faq, `${locale}/${where}: Faq unreadable`);
      checkEntries(`${locale}/${where}`, locale, faq.entries, 3, 6);
      pages++;
    }
  }
  assert.ok(pages >= 100, `only ${pages} page FAQs`);
});

test("every locale has the same page FAQs, with as many questions, as French", () => {
  const shape = (l: string) =>
    [...pageFaqs(l)].map(([k, raw]) => `${k}:${parseFaq(raw)?.entries.length ?? 0}`).sort();
  for (const l of LOCALES) assert.deepEqual(shape(l), shape("fr"), `${l}: FAQ pages differ from fr`);
});

test("articles have an FAQ that gives valid FAQPage JSON-LD", () => {
  for (const locale of LOCALES) {
    for (const a of read(locale, "ressources").Articles as { slug: string; content?: string }[]) {
      const entries = extractArticleFaq(a.content ?? "");
      checkEntries(`${locale}/${a.slug}`, locale, entries, 3, 8, false);
    }
  }
});

test("the references heading after an FAQ is not an FAQ entry", () => {
  const entries = extractArticleFaq("## Questions fréquentes\n\n### Une question ?\n\nUne réponse.\n\n### Références\n\n- [Source](https://example.org)");
  assert.deepEqual(entries, [{ question: "Une question ?", answer: "Une réponse." }]);
});
