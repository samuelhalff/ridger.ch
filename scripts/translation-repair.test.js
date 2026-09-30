"use strict";

/**
 * Translation step reliability (2026-09-30 failure: EN title/seoTitle too
 * long, body links dropped, 3 identical retries). Covers the targeted
 * shorten / link-repair helpers with a mocked model, the retry prompt, the
 * final-attempt escalation, and the dry-run stopping point. No network, no Azure.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rules = require("./lib/ridgerArticleRules");
const tr = require("./lib/translationRepair");

const ROOT = path.join(__dirname, "..");
const servicePathMaps = rules.loadServicePathMaps(ROOT);

// ─── Field lengths ─────────────────────────────────────────────────────────

const PRIMARY = "pension fund buy in switzerland";
const okMeta = "Pension fund buy in Switzerland: how voluntary purchases work, when they are tax deductible and what the three-year lock means.";

function enArticle(over = {}) {
  return {
    title: "Pension fund buy in Switzerland: tax deduction and the three-year lock explained in full",
    seoTitle: "Pension fund buy in Switzerland: tax deduction and lock-in rules",
    metaDescription: okMeta,
    imageAlt: "Documents for a pension fund buy in Switzerland on a desk",
    ...over,
  };
}

test("fieldLengthProblems reports exactly the validator's limits", () => {
  const probs = tr.fieldLengthProblems(enArticle());
  assert.deepEqual(probs.map((p) => p.field).sort(), ["seoTitle", "title"]);
  const t = probs.find((p) => p.field === "title");
  assert.equal(t.max, rules.SEO_LIMITS.titleMax);
  assert.equal(probs.find((p) => p.field === "seoTitle").max, rules.SEO_LIMITS.seoTitleMax);
});

test("fitFieldLengths: one small call fixes too-long fields; the prompt carries limits + keyword", async () => {
  const calls = [];
  const call = async (prompt, label) => {
    calls.push({ prompt, label });
    return { title: "Pension fund buy in Switzerland: tax deduction and lock", seoTitle: "Pension fund buy in Switzerland: tax rules" };
  };
  const res = await tr.fitFieldLengths({ article: enArticle(), locale: "en", primary: PRIMARY, call });
  assert.equal(calls.length, 1);
  assert.match(calls[0].label, /^shorten-en-1$/);
  assert.match(calls[0].prompt, /AT MOST 75 characters/);
  assert.match(calls[0].prompt, /AT MOST 51 characters/);
  assert.match(calls[0].prompt, /pension fund buy in switzerland/);
  assert.doesNotMatch(calls[0].prompt, /metaDescription \(currently/); // only the failing fields
  assert.deepEqual(res.remaining, []);
  assert.deepEqual(res.fixed.sort(), ["seoTitle", "title"]);
  assert.ok(res.article.title.length <= 75 && res.article.seoTitle.length <= 51);
  assert.equal(res.article.metaDescription, okMeta);
});

test("fitFieldLengths never accepts a value that is still too long, lacks the keyword or names the brand", async () => {
  const replies = [
    { title: "x".repeat(80), seoTitle: "Tax rules for voluntary purchases" }, // too long / keyword lost
    { title: "Pension fund buy in Switzerland: the tax deduction", seoTitle: "Pension fund buy in Switzerland | Ridger" }, // brand
  ];
  let i = 0;
  const prompts = [];
  const call = async (prompt) => (prompts.push(prompt), replies[i++]);
  const res = await tr.fitFieldLengths({ article: enArticle(), locale: "en", primary: PRIMARY, call, rounds: 2 });
  assert.equal(i, 2);
  // round 2 is told why round 1's candidates were refused
  assert.match(prompts[1], /Rejected earlier: "x{80}" — 80 characters \(allowed 20–75\)/);
  assert.match(prompts[1], /Rejected earlier: "Tax rules for voluntary purchases" — lost the primary keyword/);
  assert.equal(res.article.title, "Pension fund buy in Switzerland: the tax deduction");
  assert.equal(res.article.seoTitle, enArticle().seoTitle); // unchanged: still invalid → validation keeps failing
  assert.deepEqual(res.remaining.map((r) => r.field), ["seoTitle"]);
});

test("fitFieldLengths makes no call when every field fits", async () => {
  let n = 0;
  const art = enArticle({ title: "Pension fund buy in Switzerland: the tax deduction", seoTitle: "Pension fund buy in Switzerland: tax rules" });
  const res = await tr.fitFieldLengths({ article: art, locale: "en", primary: PRIMARY, call: async () => (n++, {}) });
  assert.equal(n, 0);
  assert.deepEqual(res.article, art);
});

// ─── Link parity / repair ──────────────────────────────────────────────────

const ESTV = "https://www.estv.admin.ch/estv/fr/home.html";
const FEDLEX = "https://www.fedlex.admin.ch/fr/home";
const frService = rules.localizedServiceUrl("fr", "/services/tax-administration", servicePathMaps);
const enService = rules.localizedServiceUrl("en", "/services/tax-administration", servicePathMaps);

const FR_BODY = [
  `Le rachat LPP est déductible ([AFC](${ESTV})).`,
  "",
  "## Points clés",
  "",
  `- Déduction du revenu imposable ([AFC](${ESTV})).`,
  `- Blocage de 3 ans ([LPP](${FEDLEX})).`,
  "",
  "## Quand le rachat est-il déductible ?",
  "",
  `Voir l'article 79b ([LPP, art. 79b](${FEDLEX})). Nous coordonnons [la gestion fiscale et administrative](${frService}).`,
  "",
  "## Questions fréquentes",
  "",
  "### Le rachat est-il bloqué ?",
  "",
  "Oui, pendant 3 ans.",
].join("\n");

const EN_FULL = [
  `A pension fund buy-in is deductible ([FTA](${ESTV})).`,
  "",
  "## Key points",
  "",
  `- Deduction from taxable income ([FTA](${ESTV})).`,
  `- 3-year lock ([BVG](${FEDLEX})).`,
  "",
  "## When is the buy-in deductible?",
  "",
  `See article 79b ([BVG, art. 79b](${FEDLEX})). We coordinate [tax and administrative management](${enService}).`,
  "",
  "## Frequently asked questions",
  "",
  "### Is the buy-in locked?",
  "",
  "Yes, for 3 years.",
].join("\n");

const dropLinks = (c) => c.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1");

test("expectedLinks maps internal FR paths to the locale and keeps external URLs", () => {
  const exp = tr.expectedLinks(FR_BODY, "en", servicePathMaps);
  assert.equal(exp.filter((e) => e.kind === "external").length, 4);
  const internal = exp.find((e) => e.kind === "internal");
  assert.equal(internal.url, enService);
  assert.match(exp[0].frSentence, /rachat LPP/);
  assert.equal(tr.localizeInternalPath("/fr/ressources/articles/foo-bar/", "de", servicePathMaps), "/de/ressources/articles/foo-bar/");
  assert.equal(tr.localizeInternalPath("/fr/approche/", "en", servicePathMaps), "/en/approach/");
});

test("linkParity counts every URL occurrence (multiset), not just the total", () => {
  const exp = tr.expectedLinks(FR_BODY, "en", servicePathMaps);
  assert.equal(tr.linkParity(exp, EN_FULL).ok, true);
  const noLinks = tr.linkParity(exp, dropLinks(EN_FULL));
  assert.equal(noLinks.ok, false);
  assert.deepEqual(noLinks.missing.map((m) => [m.url, m.expected, m.actual]).sort(), [[ESTV, 2, 0], [FEDLEX, 2, 0]].sort());
  // same total, wrong distribution → still a mismatch
  const swapped = EN_FULL.replace(`([BVG](${FEDLEX}))`, `([FTA](${ESTV}))`);
  const p = tr.linkParity(exp, swapped);
  assert.equal(p.ok, false);
  assert.deepEqual(p.extra.map((x) => x.url), [ESTV]);
});

test("repairLinks: targeted call restores dropped links; the prompt lists URLs with the FR sentences", async () => {
  const exp = tr.expectedLinks(FR_BODY, "en", servicePathMaps);
  const calls = [];
  const res = await tr.repairLinks({
    locale: "en",
    localeBody: dropLinks(EN_FULL),
    expected: exp,
    call: async (prompt, label) => (calls.push({ prompt, label }), { content: EN_FULL }),
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].label, "links-en");
  assert.match(calls[0].prompt, new RegExp(ESTV.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")));
  assert.match(calls[0].prompt, /French sentence: « .*rachat LPP/);
  assert.match(calls[0].prompt, /×2/);
  assert.deepEqual(res, { content: EN_FULL, repaired: true });
});

test("repairLinks: no call when parity already holds", async () => {
  let n = 0;
  const res = await tr.repairLinks({ locale: "en", localeBody: EN_FULL, expected: tr.expectedLinks(FR_BODY, "en", servicePathMaps), call: async () => (n++, {}) });
  assert.equal(n, 0);
  assert.equal(res.repaired, false);
});

test("repairLinks rejects an answer that still misses links or changes the structure (caller fails as before)", async () => {
  const exp = tr.expectedLinks(FR_BODY, "en", servicePathMaps);
  const partial = await tr.repairLinks({ locale: "en", localeBody: dropLinks(EN_FULL), expected: exp, call: async () => ({ content: EN_FULL.replace(`([BVG](${FEDLEX}))`, "(BVG)") }) });
  assert.equal(partial, null);
  const restructured = await tr.repairLinks({ locale: "en", localeBody: dropLinks(EN_FULL), expected: exp, call: async () => ({ content: `${EN_FULL}\n\n## Extra section?\n\nText.` }) });
  assert.equal(restructured, null);
  const failing = await tr.repairLinks({ locale: "en", localeBody: dropLinks(EN_FULL), expected: exp, call: async () => { throw new Error("429"); } });
  assert.equal(failing, null);
});

// ─── Retry prompt ──────────────────────────────────────────────────────────

test("translation prompt carries hard limits, required counts, every FR link URL and (on retry) the exact errors", () => {
  const { buildTranslatePrompt } = require("./ai-ressources-update");
  const frArticle = {
    title: "Rachat LPP : déduction fiscale et blocage",
    seoTitle: "Rachat LPP : déduction et blocage",
    metaDescription: "m",
    description: "d",
    imageAlt: "a",
    tags: ["a", "b", "c"],
    references: [{ labelKey: "estv.admin.ch — AFC", url: ESTV }, { labelKey: "fedlex.admin.ch — LPP", url: FEDLEX }],
    content: `${FR_BODY}\n\n---\n### Références\n- [estv](${ESTV})\n- [fedlex](${FEDLEX})\n`,
  };
  const keywords = { en: { primary: PRIMARY, secondary: ["bvg buy in", "tax deduction"] } };
  const errors = ["title length 83 outside 20–75", "structure differs from FR (externalLinks: fr=18 vs 4)"];
  const p = buildTranslatePrompt({ locale: "en", frArticle, keywords, servicePathMaps, problems: errors });
  assert.match(p, /title: 20–75 characters/);
  assert.match(p, /seoTitle: 20–51 characters, WITHOUT the brand/);
  assert.match(p, /external links: 4 · internal links: 1/);
  assert.match(p, /## headings: 3 · ### headings: 1 · FAQ questions: 1/);
  assert.ok(p.includes(ESTV) && p.includes(FEDLEX) && p.includes(enService));
  for (const e of errors) assert.ok(p.includes(`- ${e}`), e);
  assert.match(p, /corrected FULL output/);
  assert.doesNotMatch(p.split("FRENCH SOURCE:")[1], /### Références/); // body only: references are appended by the pipeline
  const first = buildTranslatePrompt({ locale: "en", frArticle, keywords, servicePathMaps });
  assert.doesNotMatch(first, /REJECTED/);
});

// ─── Orchestrator (spawned, mocked model) ──────────────────────────────────

function runPipeline(args, env) {
  const log = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "ridger-tr-")), "calls.jsonl");
  const r = spawnSync(process.execPath, ["scripts/ai-ressources-update.js", ...args], {
    cwd: ROOT,
    env: {
      ...process.env,
      OFFLINE_MODE: "1",
      FORCE_TOPIC: "rachat-lpp-deduction-fiscale-blocage",
      GITHUB_OUTPUT: "",
      MOCK_CALL_LOG: log,
      ...env,
    },
    encoding: "utf8",
    timeout: 60000,
  });
  const calls = fs.existsSync(log) ? fs.readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)) : [];
  return { ...r, out: `${r.stdout}\n${r.stderr}`, calls };
}

test("dry run stops after topic + keywords + research outline: no draft, no translation, nothing written", () => {
  const before = fs.readFileSync(path.join(ROOT, "src/translations/fr/ressources.json"), "utf8");
  const r = runPipeline(["--dry-run"], { AI_MOCK_MODULE: "scripts/mock/article-pipeline-mock.js", MOCK_FORBID_GENERATION: "1" });
  assert.equal(r.status, 0, r.out.slice(-2000));
  assert.match(r.out, /Mode: dry-run/);
  assert.match(r.out, /Keyword source:/);
  assert.match(r.out, /DRY RUN — OUTLINE/);
  assert.match(r.out, /Stopped before article generation — nothing written/);
  assert.doesNotMatch(r.out, /FR article valid|translation attempt|mock: .* called during a dry run/);
  assert.equal(fs.readFileSync(path.join(ROOT, "src/translations/fr/ressources.json"), "utf8"), before);
});

test("translation: dropped links + too-long titles are fixed by targeted calls, not full retranslation", () => {
  const r = runPipeline(["--no-write"], { AI_MOCK_MODULE: "scripts/mock/translation-flaky-mock.js", MOCK_FLAKY: "repairs" });
  assert.equal(r.status, 0, r.out.slice(-3000));
  for (const l of ["en", "de", "es", "pt"]) {
    const mine = r.calls.filter((c) => c.locale === l);
    assert.equal(mine.filter((c) => c.kind === "translate").length, 1, `${l}: one translation call`);
    assert.equal(mine.filter((c) => c.kind === "links").length, 1, `${l}: one link repair`);
    assert.equal(mine.filter((c) => c.kind === "shorten").length, 1, `${l}: one shorten call`);
    assert.match(r.out, new RegExp(`✅ ${l} valid`));
  }
  const shorten = r.calls.find((c) => c.kind === "shorten" && c.locale === "en");
  assert.match(shorten.prompt, /AT MOST 75 characters/);
});

test("translation: the final attempt escalates to the draft deployment and the retry carries the exact errors", () => {
  const r = runPipeline(["--no-write"], { AI_MOCK_MODULE: "scripts/mock/translation-flaky-mock.js", MOCK_FLAKY: "escalate" });
  assert.equal(r.status, 0, r.out.slice(-3000));
  const en = r.calls.filter((c) => c.locale === "en" && c.kind === "translate");
  assert.deepEqual(en.map((c) => c.strong), [false, false, true]);
  assert.equal(en[0].retry, false);
  assert.match(en[1].prompt, /REJECTED by the automatic validator with these exact errors:\n- title length \d+ outside 20–75/);
  assert.match(en[1].prompt, /structure differs from FR \(externalLinks/);
  assert.match(r.out, /translation attempt 3\/3 \(escalated to mock-strong\)/);
});

test("translation still fails (nothing written) when even the escalated attempt is invalid", () => {
  const r = runPipeline(["--no-write"], { AI_MOCK_MODULE: "scripts/mock/translation-flaky-mock.js", MOCK_FLAKY: "escalate", AI_TRANSLATION_RETRIES: "1" });
  assert.notEqual(r.status, 0);
  assert.match(r.out, /en translation failed validation after 1 attempts/);
});
