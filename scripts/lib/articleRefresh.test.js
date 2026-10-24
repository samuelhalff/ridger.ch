"use strict";

/**
 * Tests for the transactional article refresh (scripts/lib/articleRefresh.js)
 * and its CLI wiring (--refresh=<slug> in scripts/ai-ressources-update.js).
 * No network, no Azure: every model call is a fake injected through `deps` or
 * through AI_MOCK_MODULE. All files are written in a temp directory.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rules = require("./ridgerArticleRules");
const refresh = require("./articleRefresh");

const ROOT = path.join(__dirname, "..", "..");
const LOCALES = ["fr", "en", "de", "es", "pt"];
const TODAY = "2026-10-24";
const SLUG = "reporting-consolide-patrimoine-multi-banques";
const SERVICE = "/services/consolidated-reporting";
const maps = rules.loadServicePathMaps(ROOT);

const REFS = [
  { labelKey: "Fedlex – Code civil suisse", url: "https://www.fedlex.admin.ch/eli/cc/24/233_245_233/fr" },
  { labelKey: "FINMA – Gestionnaires de fortune", url: "https://www.finma.ch/fr/autorisation/gestionnaires-de-fortune-et-trustees/" },
  { labelKey: "Fedlex – LEFin", url: "https://www.fedlex.admin.ch/eli/cc/2018/801/fr" },
];

const WORDS = {
  fr: "la famille consolide ses vues bancaires avec calme et méthode afin de lire un ensemble clair",
  en: "the family consolidates its bank views with calm and method in order to read one clear picture",
  de: "die Familie bündelt ihre Bankansichten mit Ruhe und Methode um ein klares Gesamtbild zu lesen",
  es: "la familia consolida sus vistas bancarias con calma y método para leer un conjunto claro",
  pt: "a família consolida as suas vistas bancárias com calma e método para ler um conjunto claro",
};
const HEAD = {
  fr: { a: "Pourquoi consolider ?", role: "Notre rôle", anchor: "reporting consolidé du patrimoine", ver: "Sources officielles consultées le" },
  en: { a: "Why consolidate?", role: "Our role", anchor: "consolidated wealth reporting", ver: "Official sources consulted on" },
  de: { a: "Warum bündeln?", role: "Unsere Rolle", anchor: "konsolidiertes Vermögensreporting", ver: "Amtliche Quellen eingesehen am" },
  es: { a: "¿Por qué consolidar?", role: "Nuestro papel", anchor: "informes patrimoniales consolidados", ver: "Fuentes oficiales consultadas el" },
  pt: { a: "Porquê consolidar?", role: "O nosso papel", anchor: "relatórios patrimoniais consolidados", ver: "Fontes oficiais consultadas em" },
};

function para(locale, n, tag) {
  const base = WORDS[locale].split(" ");
  const out = [];
  for (let i = 0; i < n; i++) out.push(base[i % base.length]);
  return `${out.join(" ")} ${tag}.`;
}

/** Valid refreshed body (~700 words) for a locale, ending with the Notre rôle section + dated line. */
function body(locale, { today = TODAY, service = SERVICE, extra = "", omitDate = false, omitLink = false } = {}) {
  const h = HEAD[locale];
  const link = omitLink ? h.anchor : `[${h.anchor}](${rules.localizedServiceUrl(locale, service, maps)})`;
  return [
    para(locale, 90, "Introduction sobre"),
    `## ${h.a}`,
    para(locale, 200, "premier"),
    para(locale, 200, "second"),
    `## ${h.role}`,
    `${para(locale, 120, "coordination")} ${link}.`,
    extra,
    omitDate ? "" : `${h.ver} ${today}. ${para(locale, 20, "fait foi")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function oldBody(locale) {
  return [para(locale, 150, "ancien"), `## ${HEAD[locale].a}`, para(locale, 500, "ancien deux")].join("\n\n");
}

function makeArticle(locale, slug, extra = {}) {
  const refs = REFS.map((r) => ({ ...r }));
  return {
    slug,
    author: "Ridger",
    image: "abstract-background-dark.avif",
    date: "2026-07-03",
    references: refs,
    title: locale === "fr" ? "Reporting consolidé multi-banques" : `Reporting ${locale} multi banks`,
    description: `Description ${locale}`,
    content: `${oldBody(locale)}\n\n---\n### ${rules.REFERENCES_HEADINGS[locale]}\n${refs.map((r) => `- [${r.labelKey}](${r.url})`).join("\n")}\n`,
    category: "reporting",
    tags: ["reporting", "banques", "patrimoine"],
    ...extra,
  };
}

function makeCorpus(extra = {}) {
  const corpus = {};
  for (const l of LOCALES) {
    corpus[l] = {
      Title: `title ${l}`,
      Articles: [
        makeArticle(l, "autre-article-un", { date: "2026-05-01", category: "gouvernance" }),
        makeArticle(l, SLUG, { topicId: "t-1", topicFamily: "reporting", unknownField: { keep: [1, 2] }, imageAlt: `alt ${l}`, ...extra }),
        makeArticle(l, "autre-article-deux", { date: "2026-06-01", category: "fiscalite" }),
        makeArticle(l, "second-cible", { date: "2026-08-01", category: "reporting" }),
      ],
    };
  }
  return corpus;
}

function tmpTranslations(corpus = makeCorpus()) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ridger-refresh-"));
  const tdir = path.join(dir, "src", "translations");
  for (const l of LOCALES) {
    fs.mkdirSync(path.join(tdir, l), { recursive: true });
    fs.writeFileSync(path.join(tdir, l, "ressources.json"), `${JSON.stringify(corpus[l], null, 2)}\n`);
  }
  return { dir, tdir };
}

function snapshot(tdir) {
  const out = {};
  for (const l of LOCALES) out[l] = fs.readFileSync(path.join(tdir, l, "ressources.json"), "utf8");
  return out;
}

function leftovers(tdir) {
  return LOCALES.flatMap((l) => fs.readdirSync(path.join(tdir, l)).filter((f) => f !== "ressources.json"));
}

function fakeDeps(overrides = {}) {
  const calls = { research: 0, draft: 0, translate: [] };
  const deps = {
    research: async () => {
      calls.research++;
      return REFS.map((r) => ({ ...r }));
    },
    draft: async (prompt, ctx) => {
      calls.draft++;
      return {
        article: {
          title: "Reporting consolidé multi-banques : points de repère",
          description: "Description mise à jour",
          tags: ["reporting", "banques", "patrimoine", "suisse"],
          content: body("fr"),
        },
        changeSummary: ["date de vérification mise à jour"],
      };
    },
    translate: async (prompt, ctx) => {
      calls.translate.push({ locale: ctx.locale, attempt: ctx.attempt, problems: ctx.problems });
      const l = ctx.locale;
      return {
        title: `Reporting consolidated ${l} points`,
        description: `Updated description ${l}`,
        tags: ctx.frArticle.tags.map((t) => `${t}-${l}`),
        referenceLabels: REFS.map((r) => `${l} ${r.labelKey}`),
        content: body(l),
      };
    },
    ...overrides,
  };
  return { deps, calls };
}

function run(tdir, deps, opts = {}) {
  return refresh.refreshArticles({
    slugs: [SLUG],
    today: TODAY,
    translationsDir: tdir,
    servicePathMaps: maps,
    serviceFor: () => SERVICE,
    localeNames: { en: "English", de: "German", es: "Spanish", pt: "Portuguese" },
    deps,
    log: () => {},
    ...opts,
  });
}

const read = (tdir, l) => JSON.parse(fs.readFileSync(path.join(tdir, l, "ressources.json"), "utf8"));

// ─── Transaction ──────────────────────────────────────────────────────────

test("dry run validates everything and writes nothing", async () => {
  const { tdir } = tmpTranslations();
  const before = snapshot(tdir);
  const { deps, calls } = fakeDeps();
  const out = await run(tdir, deps, { apply: false });
  assert.equal(out.written, false);
  assert.equal(out.results[0].slug, SLUG);
  assert.equal(calls.draft, 1);
  assert.equal(calls.translate.length, 4);
  assert.deepEqual(snapshot(tdir), before);
  assert.deepEqual(leftovers(tdir), []);
});

test("apply merges only generated fields, sets updated after success, preserves the rest", async () => {
  const { tdir } = tmpTranslations();
  const before = {};
  for (const l of LOCALES) before[l] = read(tdir, l);
  const { deps } = fakeDeps();
  const out = await run(tdir, deps, { apply: true });
  assert.equal(out.written, true);
  assert.deepEqual(leftovers(tdir), []);

  for (const l of LOCALES) {
    const after = read(tdir, l);
    const b = before[l].Articles[1];
    const a = after.Articles[1];
    // untouched articles and unrelated keys are byte-identical
    assert.deepEqual(after.Articles[0], before[l].Articles[0]);
    assert.deepEqual(after.Articles[2], before[l].Articles[2]);
    assert.deepEqual(after.Articles[3], before[l].Articles[3]);
    assert.equal(after.Title, before[l].Title);
    // preserved identity + unknown/SEO fields
    for (const f of ["slug", "date", "category", "author", "image", "topicId", "topicFamily", "imageAlt"]) {
      assert.deepEqual(a[f], b[f], `${l}.${f}`);
    }
    assert.deepEqual(a.unknownField, { keep: [1, 2] });
    // generated fields changed
    assert.notEqual(a.content, b.content);
    assert.notEqual(a.description, b.description);
    assert.equal(a.updated, TODAY);
    assert.ok(a.updated >= a.date);
    assert.equal(a.tags.length, after.Articles[1].tags.length);
    assert.match(a.content, new RegExp(`${TODAY}`));
    assert.match(a.content, new RegExp(`### ${rules.REFERENCES_HEADINGS[l]}`));
  }
  const fr = read(tdir, "fr").Articles[1];
  assert.equal(fr.title, "Reporting consolidé multi-banques : points de repère");
  assert.deepEqual(fr.references, REFS);
  for (const l of LOCALES.slice(1)) {
    const a = read(tdir, l).Articles[1];
    assert.deepEqual(a.references.map((r) => r.url), REFS.map((r) => r.url));
    assert.equal(a.references[0].labelKey, `${l} ${REFS[0].labelKey}`);
    assert.equal(a.tags.length, fr.tags.length);
  }
});

test("a failure on the second slug writes nothing (all-or-nothing across slugs)", async () => {
  const { tdir } = tmpTranslations();
  const before = snapshot(tdir);
  const { deps } = fakeDeps({
    translate: async (prompt, ctx) => {
      if (ctx.frArticle.slug === "second-cible" && ctx.locale === "pt") throw new Error("model down");
      return fakeDeps().deps.translate(prompt, ctx);
    },
    draft: async (prompt, ctx) => ({
      article: { title: "Reporting consolidé multi-banques : repères", description: "d", tags: ["a", "b", "c"], content: body("fr") },
      changeSummary: [],
    }),
  });
  // second-cible needs the same shape; reuse SERVICE for both slugs
  await assert.rejects(run(tdir, deps, { slugs: [SLUG, "second-cible"], apply: true }), /model down/);
  assert.deepEqual(snapshot(tdir), before);
  assert.deepEqual(leftovers(tdir), []);
});

test("translation failing validation is retried with the exact errors, then writes nothing", async () => {
  const { tdir } = tmpTranslations();
  const before = snapshot(tdir);
  const { deps, calls } = fakeDeps({
    translate: async (prompt, ctx) => {
      calls.translate.push({ locale: ctx.locale, attempt: ctx.attempt, problems: ctx.problems });
      return {
        title: "Reporting consolidated points",
        description: "Updated",
        tags: ["a", "b", "c", "d"],
        referenceLabels: [],
        content: body(ctx.locale, { omitLink: true }), // service link dropped
      };
    },
  });
  await assert.rejects(run(tdir, deps, { apply: true }), /en translation failed validation/);
  const en = calls.translate.filter((c) => c.locale === "en");
  assert.equal(en.length, 3);
  assert.equal(en[0].problems.length, 0);
  assert.ok(en[1].problems.some((p) => /service link/.test(p)), "retry carries the validator errors");
  assert.deepEqual(snapshot(tdir), before);
});

test("FR draft with a hard-rule hit, a missing date line or a bad link is rejected, retried, then fails with nothing written", async () => {
  for (const [name, content, pattern] of [
    ["price", body("fr", { extra: "Le coût est de CHF 5000 par an." }), /PRICE|prix|CHF|fee/i],
    ["no date line", body("fr", { omitDate: true }), /verification line/],
    ["no service link", body("fr", { omitLink: true }), /service link/],
    ["unknown internal link", body("fr", { extra: "[page inconnue](/fr/nimportequoi/)" }), /does not resolve/],
  ]) {
    const { tdir } = tmpTranslations();
    const before = snapshot(tdir);
    let seen = null;
    const { deps, calls } = fakeDeps({
      draft: async (prompt, ctx) => {
        if (ctx.attempt === 2) seen = ctx.problems;
        return { article: { title: "Reporting consolidé multi-banques : repères", description: "d", tags: ["a", "b", "c"], content }, changeSummary: [] };
      },
    });
    await assert.rejects(run(tdir, deps, { apply: true }), pattern, name);
    assert.ok(seen && seen.length, `${name}: errors fed back`);
    assert.equal(calls.translate.length, 0, `${name}: no translation spent on an invalid FR`);
    assert.deepEqual(snapshot(tdir), before, name);
  }
});

test("non-official or invented references are rejected", async () => {
  const { tdir } = tmpTranslations();
  const before = snapshot(tdir);
  const { deps } = fakeDeps({
    research: async () => [{ labelKey: "Blog", url: "https://exemple-cabinet.com/article" }, ...REFS.slice(0, 2)],
  });
  await assert.rejects(run(tdir, deps, { apply: true }), /non-official|official/);
  assert.deepEqual(snapshot(tdir), before);
  const empty = fakeDeps({ research: async () => [] });
  await assert.rejects(run(tdir, empty.deps, { apply: true }), /no usable references/);
});

test("external links not in the reference list are reduced to text", async () => {
  const { tdir } = tmpTranslations();
  const { deps } = fakeDeps({
    draft: async () => ({
      article: {
        title: "Reporting consolidé multi-banques : repères",
        description: "d",
        tags: ["a", "b", "c"],
        content: body("fr", { extra: "Voir [un site](https://exemple-cabinet.com/x) et https://exemple.com/y." }),
      },
      changeSummary: [],
    }),
  });
  await run(tdir, deps, { apply: true });
  const fr = read(tdir, "fr").Articles[1].content;
  assert.doesNotMatch(fr, /exemple-cabinet|exemple\.com/);
  assert.match(fr, /un site/);
});

test("an article dated in the future, an unknown slug or misaligned locales abort before any model call", async () => {
  const future = makeCorpus();
  for (const l of LOCALES) future[l].Articles[1].date = "2026-12-31";
  const a = tmpTranslations(future);
  const f1 = fakeDeps();
  await assert.rejects(run(a.tdir, f1.deps, { apply: true }), /in the future/);
  assert.equal(f1.calls.draft, 0);

  const b = tmpTranslations();
  await assert.rejects(run(b.tdir, fakeDeps().deps, { slugs: ["nope"] }), /not found/);

  const mis = makeCorpus();
  mis.de.Articles.reverse();
  const c = tmpTranslations(mis);
  const f3 = fakeDeps();
  await assert.rejects(run(c.tdir, f3.deps, { apply: true }), /not index-aligned/);
  assert.equal(f3.calls.research, 0);
});

test("a failing atomic swap restores every file", async () => {
  const { tdir } = tmpTranslations();
  const before = snapshot(tdir);
  let renames = 0;
  const fsImpl = {
    ...fs,
    renameSync(a, b) {
      if (++renames === 3) throw new Error("disk full");
      return fs.renameSync(a, b);
    },
  };
  await assert.rejects(run(tdir, fakeDeps().deps, { apply: true, writeOptions: { fsImpl } }), /disk full/);
  assert.deepEqual(snapshot(tdir), before);
  assert.deepEqual(leftovers(tdir), []);
});

// ─── Merge / prompts ──────────────────────────────────────────────────────

test("pipeline-shaped articles keep title, SEO fields and keywords; locale entries keep theirs", () => {
  const existing = {
    slug: "s", date: "2026-01-01", category: "fiscalite", backlogId: "b-1", title: "Titre verrouillé du mot clé",
    seoTitle: "seo", metaDescription: "meta", imageAlt: "alt", keywords: { primary: "p", secondary: ["a"] },
    description: "old", content: "old", tags: ["x", "y", "z"], references: [], extra: 1,
  };
  const merged = refresh.mergeRefreshedArticle(existing, { title: "Nouveau", description: "new", content: "c", tags: ["Un", "deux", "trois"], seoTitle: "HACK", keywords: {} });
  assert.equal(merged.title, existing.title);
  assert.equal(merged.seoTitle, "seo");
  assert.deepEqual(merged.keywords, existing.keywords);
  assert.equal(merged.extra, 1);
  assert.equal(merged.description, "new");
  assert.deepEqual(merged.tags, ["un", "deux", "trois"]);
  assert.equal(merged.updated, undefined, "updated is never set by the merge");

  const local = { slug: "s", title: "Titre local", seoTitle: "lseo", metaDescription: "lmeta", imageAlt: "lalt", keywords: { primary: "lp", secondary: ["la"] }, tags: ["a", "b", "c"], content: "x", description: "y", date: "2026-01-01", category: "fiscalite", backlogId: "b-1" };
  const entry = refresh.buildLocalizedArticle({ ...merged, updated: "2026-10-24" }, local, { title: "IGNORED", description: "d", tags: ["q", "r", "s"], content: "c" }, []);
  assert.equal(entry.title, "Titre local");
  assert.equal(entry.seoTitle, "lseo");
  assert.deepEqual(entry.keywords, local.keywords);
  assert.equal(entry.updated, "2026-10-24");
});

test("legacy articles may change title; empty or invalid generated values never overwrite", () => {
  const existing = { slug: "s", title: "Ancien titre", description: "d", content: "c", tags: ["a", "b", "c"], references: [{ labelKey: "l", url: "https://x.admin.ch" }], date: "2026-01-01" };
  const merged = refresh.mergeRefreshedArticle(existing, { title: "  ", description: "", content: "nouveau", tags: ["x"], references: [] });
  assert.equal(merged.title, "Ancien titre");
  assert.equal(merged.description, "d");
  assert.equal(merged.content, "nouveau");
  assert.deepEqual(merged.tags, ["a", "b", "c"]);
  assert.deepEqual(merged.references, existing.references);
  assert.equal(refresh.mergeRefreshedArticle(existing, { title: "Nouveau titre" }).title, "Nouveau titre");
});

test("refresh prompts forbid invention and carry the date line, service link and official-only research", () => {
  const article = makeArticle("fr", SLUG);
  const p = refresh.buildRefreshPrompt(article, {
    today: TODAY, serviceUrl: "/fr/services/reporting-consolide/", references: REFS, voice: "VOIX", hardRules: "RÈGLES", facts: ["fait un"],
  });
  assert.match(p, /AUCUNE INVENTION/);
  assert.match(p, /anecdote/);
  assert.match(p, /Sources officielles consultées le 2026-10-24/);
  assert.match(p, /## Notre rôle/);
  assert.match(p, /\/fr\/services\/reporting-consolide\//);
  assert.match(p, /fait un/);
  assert.match(p, /Aucun prix, aucun outil de devis, aucun assistant IA/);
  assert.doesNotMatch(p, /### Références\n/, "the references list is not part of the model input");
  const r = refresh.buildRefreshResearchPrompt(article, { today: TODAY });
  assert.match(r, /OFFICIELLES/);
  assert.match(r, /Aucun cabinet/);
});

// ─── CLI wiring (offline, mocked model) ───────────────────────────────────

function writeMock(dir) {
  const file = path.join(dir, "mock.js");
  fs.writeFileSync(
    file,
    `"use strict";
const rules = require(${JSON.stringify(path.join(ROOT, "scripts/lib/ridgerArticleRules.js"))});
const maps = rules.loadServicePathMaps(${JSON.stringify(ROOT)});
const today = new Date().toISOString().slice(0, 10);
const W = ${JSON.stringify(WORDS)};
const H = ${JSON.stringify(HEAD)};
const REFS = ${JSON.stringify(REFS)};
const p = (l, n, t) => { const b = W[l].split(" "); const o = []; for (let i = 0; i < n; i++) o.push(b[i % b.length]); return o.join(" ") + " " + t + "."; };
const body = (l) => [p(l, 90, "intro"), "## " + H[l].a, p(l, 200, "un"), p(l, 200, "deux"), "## " + H[l].role,
  p(l, 120, "role") + " [" + H[l].anchor + "](" + rules.localizedServiceUrl(l, ${JSON.stringify(SERVICE)}, maps) + ").",
  H[l].ver + " " + today + ". " + p(l, 20, "fait foi")].join("\\n\\n");
module.exports = {
  refreshResearch: async () => REFS,
  refreshDraft: async () => ({ article: { title: "Reporting consolidé multi-banques : repères", description: "Description", tags: ["reporting", "banques", "patrimoine"], content: body("fr") }, changeSummary: ["mock"] }),
  refreshTranslate: async ({ locale }) => ({ title: "Consolidated reporting " + locale, description: "Desc " + locale, tags: ["reporting", "banks", "wealth"], referenceLabels: REFS.map((r) => locale + " " + r.labelKey), content: body(locale) }),
};
`,
  );
  return file;
}

function runCli(args, { corpus } = {}) {
  const { dir, tdir } = tmpTranslations(corpus || makeCorpus());
  fs.mkdirSync(path.join(dir, "src", "lib"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "src/lib/paths.ts"), path.join(dir, "src/lib/paths.ts"));
  fs.mkdirSync(path.join(dir, "data"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "data/article-backlog.json"), path.join(dir, "data/article-backlog.json"));
  const mock = writeMock(dir);
  const before = snapshot(tdir);
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts/ai-ressources-update.js"), ...args], {
    cwd: dir,
    encoding: "utf8",
    env: { PATH: process.env.PATH, AI_MOCK_MODULE: mock, OFFLINE_MODE: "1" },
  });
  return { r, tdir, before };
}

test("CLI: --refresh --dry-run (and --refresh alone) write nothing; --refresh --apply writes all 5 locales", () => {
  for (const flags of [["--dry-run"], []]) {
    const { r, tdir, before } = runCli([`--refresh=${SLUG}`, ...flags]);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /Nothing written/);
    assert.deepEqual(snapshot(tdir), before);
  }
  const { r, tdir, before } = runCli([`--refresh=${SLUG}`, "--apply"]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
  const today = new Date().toISOString().slice(0, 10);
  for (const l of LOCALES) {
    const a = read(tdir, l).Articles[1];
    assert.equal(a.updated, today);
    assert.equal(a.topicId, "t-1");
    assert.notEqual(snapshot(tdir)[l], before[l]);
  }
});

test("CLI: a refresh that cannot succeed exits non-zero and writes nothing", () => {
  const { r, tdir, before } = runCli([`--refresh=${SLUG},does-not-exist`, "--apply"]);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /not found/);
  assert.deepEqual(snapshot(tdir), before);
});
