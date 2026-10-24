"use strict";

/**
 * Autonomous refresh: queue (pick / attempts cap), finalize (done keeps files,
 * failure restores + marks failed, push loop, downgrade after a bad rebase),
 * the slug-targeted validator and the link fixer's --slug. No network, no model
 * calls; git runs against a local bare repository in a temp dir.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rules = require("./lib/ridgerArticleRules");
const mock = require("./mock/article-pipeline-mock");
const { refreshArticles } = require("./lib/articleRefresh");
const { validateRefreshed, loadFromGit, loadWorkingTree } = require("./validate-refreshed-article");
const { fixRessourcesJson } = require("./fix-article-internal-links");
const R = require("./refresh-next-article");

const ROOT = path.join(__dirname, "..");
const LOCALES = ["fr", "en", "de", "es", "pt"];
const NOW = new Date("2026-10-24T00:00:00Z");
const TODAY = "2026-10-24";
const quiet = () => {};
const maps = rules.loadServicePathMaps(ROOT);

const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
const writeJson = (f, o) => (fs.mkdirSync(path.dirname(f), { recursive: true }), fs.writeFileSync(f, JSON.stringify(o, null, 2) + "\n"));
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

// ─────────────────────────────────────────────────────────────────────────
// pick / attempts
// ─────────────────────────────────────────────────────────────────────────

function pickFixture({ queue = [], failed = [], done = [], attempts, articles }) {
  const dir = tmp("refresh-pick-");
  const tdir = path.join(dir, "translations");
  for (const l of LOCALES) writeJson(path.join(tdir, l, "ressources.json"), { Articles: articles });
  const queuePath = path.join(dir, "queue.json");
  writeJson(queuePath, { queue, done, failed, ...(attempts ? { attempts } : {}) });
  return { dir, tdir, queuePath, runPath: path.join(dir, "run.json"), read: () => readJson(queuePath) };
}
const ARTICLES = [
  { slug: "a", date: "2025-01-10" },
  { slug: "b", date: "2024-03-01", updated: "2026-05-01" },
  { slug: "c", date: "2024-06-01" },
  { slug: "d", date: "2026-06-01" },
];
const pick = (f) => R.pickNext({ queuePath: f.queuePath, translationsDir: f.tdir, runPath: f.runPath, now: NOW, log: quiet });

test("pick takes the queue head, counts the attempt and writes the status file", () => {
  const f = pickFixture({ queue: ["a", "d"], articles: ARTICLES });
  assert.deepEqual(pick(f), { status: "picked", slug: "a" });
  assert.deepEqual(f.read().queue, ["a", "d"]); // still in progress
  assert.deepEqual(f.read().attempts, { a: 1 });
  assert.equal(readJson(f.runPath).slug, "a");
});

test("attempts cap: a slug picked twice without being finalized becomes failed on the third pick, never retried", () => {
  const f = pickFixture({ queue: ["a", "d"], articles: ARTICLES });
  pick(f);
  pick(f);
  assert.deepEqual(f.read().attempts, { a: 2 });
  const r = pick(f); // a is capped -> failed, d is next
  assert.equal(r.slug, "d");
  const q = f.read();
  assert.deepEqual(q.queue, ["d"]);
  assert.equal(q.failed.length, 1);
  assert.equal(q.failed[0].slug, "a");
  assert.match(q.failed[0].reason, /2 attempts/);
});

test("empty queue auto-fills with the oldest article older than 12 months (updated ?? date), skipping failed", () => {
  const f = pickFixture({ queue: [], articles: ARTICLES });
  assert.equal(pick(f).slug, "c"); // b is oldest by date but was updated recently
  const g = pickFixture({ queue: [], failed: [{ slug: "c" }], articles: ARTICLES });
  assert.equal(pick(g).slug, "a");
});

test("empty queue and nothing stale: nothing to do", () => {
  const f = pickFixture({ queue: [], articles: [{ slug: "d", date: "2026-06-01" }] });
  assert.deepEqual(pick(f), { status: "none", slug: null });
  assert.equal(fs.existsSync(f.runPath), false);
});

// ─────────────────────────────────────────────────────────────────────────
// outcomes
// ─────────────────────────────────────────────────────────────────────────

const allOk = { OUTCOME_REFRESH: "success", OUTCOME_FIX: "success", OUTCOME_VALIDATE: "success", OUTCOME_GATE: "success" };

test("evaluateOutcomes: only all-success is ok; failure, cancelled, skipped and missing are failures", () => {
  assert.equal(R.evaluateOutcomes(allOk).ok, true);
  for (const bad of ["failure", "cancelled", "skipped"]) {
    const v = R.evaluateOutcomes({ ...allOk, OUTCOME_VALIDATE: bad });
    assert.equal(v.ok, false);
    assert.match(v.reason, /Validate refreshed article: /);
    assert.ok(v.reason.includes(bad));
  }
  const missing = { ...allOk };
  delete missing.OUTCOME_GATE;
  assert.match(R.evaluateOutcomes(missing).reason, /Validation gate: missing/);
});

test("evaluateOutcomes carries the refresh reason or the tail of the step log", () => {
  const dir = tmp("refresh-logs-");
  fs.writeFileSync(path.join(dir, "validate.log"), "x\n❌ failed\n  - [en] word count 50 outside 1100-1900\n");
  assert.match(R.evaluateOutcomes({ ...allOk, OUTCOME_VALIDATE: "failure" }, {}, dir).reason, /word count 50/);
  assert.match(R.evaluateOutcomes({ ...allOk, OUTCOME_REFRESH: "failure" }, { ok: false, reason: "refresh exited with code 1" }, dir).reason, /code 1/);
});

test("runRefreshStep records the result in the status file and never touches the queue", async () => {
  const f = pickFixture({ queue: ["a"], articles: ARTICLES });
  pick(f);
  const before = fs.readFileSync(f.queuePath);
  const ok = await R.runRefreshStep({ runPath: f.runPath, runRefresh: () => ({ ok: true }), log: quiet });
  assert.equal(ok.ok, true);
  assert.equal(readJson(f.runPath).ok, true);
  const bad = await R.runRefreshStep({ runPath: f.runPath, runRefresh: () => { throw new Error("boom"); }, log: quiet });
  assert.equal(bad.ok, false);
  assert.match(readJson(f.runPath).reason, /boom/);
  assert.ok(fs.readFileSync(f.queuePath).equals(before));
});

// ─────────────────────────────────────────────────────────────────────────
// finalize on a real (temp) git repo with a bare origin
// ─────────────────────────────────────────────────────────────────────────

function sh(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
}
function realGit(cwd) {
  return (args) => {
    const r = spawnSync("git", args, { cwd, encoding: "utf8" });
    return { status: r.status ?? 1, stdout: r.stdout || "", stderr: r.stderr || "" };
  };
}

/** Bare origin + a working clone with the 5 translation files and the queue committed on main. */
function gitFixture({ articles = [{ slug: "a", date: "2025-01-10", title: "T" }], queue = ["a"] } = {}) {
  const base = tmp("refresh-git-");
  const origin = path.join(base, "origin.git");
  const work = path.join(base, "work");
  sh(base, "init", "--bare", "-b", "main", origin);
  sh(base, "clone", origin, work);
  sh(work, "config", "user.email", "t@example.com");
  sh(work, "config", "user.name", "t");
  for (const l of LOCALES) writeJson(path.join(work, "src", "translations", l, "ressources.json"), { Articles: articles });
  writeJson(path.join(work, "data", "refresh-queue.json"), { queue, done: [], failed: [] });
  fs.writeFileSync(path.join(work, ".gitignore"), ".refresh-run.json\n");
  sh(work, "add", "-A");
  sh(work, "commit", "-m", "init");
  sh(work, "push", "origin", "HEAD:main");
  const queuePath = path.join(work, "data", "refresh-queue.json");
  const runPath = path.join(work, ".refresh-run.json");
  const frFile = path.join(work, "src", "translations", "fr", "ressources.json");
  return {
    base, origin, work, queuePath, runPath, frFile,
    remoteFile: (rel) => spawnSync("git", ["show", `main:${rel}`], { cwd: origin, encoding: "utf8" }).stdout,
    remoteQueue: () => JSON.parse(spawnSync("git", ["show", "main:data/refresh-queue.json"], { cwd: origin, encoding: "utf8" }).stdout),
    /** Another clone pushes an unrelated commit to origin/main. */
    moveMain() {
      const other = path.join(base, "other");
      sh(base, "clone", origin, other);
      sh(other, "config", "user.email", "o@example.com");
      sh(other, "config", "user.name", "o");
      fs.writeFileSync(path.join(other, "unrelated.txt"), "x");
      sh(other, "add", "-A");
      sh(other, "commit", "-m", "unrelated");
      sh(other, "push", "origin", "HEAD:main");
    },
  };
}

const FIN = (f, extra = {}) => ({
  root: f.work, queuePath: f.queuePath, runPath: f.runPath, logDir: path.join(f.work, ".nologs"), now: NOW, commit: true,
  git: realGit(f.work), sleep: async () => {}, log: quiet, ...extra,
});

function claimed(f) {
  R.pickNext({ queuePath: f.queuePath, translationsDir: path.join(f.work, "src", "translations"), runPath: f.runPath, now: NOW, log: quiet });
}

test("finalize on success marks done, keeps the refreshed files and pushes translations + queue", async () => {
  const f = gitFixture();
  claimed(f);
  const refreshed = { Articles: [{ slug: "a", date: "2025-01-10", title: "T", updated: TODAY }] };
  writeJson(f.frFile, refreshed);
  const r = await R.finalize(FIN(f, { env: allOk, revalidate: async () => ({ ok: true }) }));
  assert.equal(r.status, "done");
  assert.equal(r.pushed, true);
  assert.deepEqual(JSON.parse(f.remoteFile("src/translations/fr/ressources.json")), refreshed);
  assert.deepEqual(f.remoteQueue(), { queue: [], done: [{ slug: "a", date: TODAY }], failed: [] });
});

test("finalize on failure restores the translations, marks failed with the step, never re-queues, pushes the queue only", async () => {
  const f = gitFixture();
  claimed(f);
  const original = fs.readFileSync(f.frFile);
  writeJson(f.frFile, { Articles: [{ slug: "a", broken: true }] }); // fixer / refresh left a mess
  const r = await R.finalize(FIN(f, { env: { ...allOk, OUTCOME_GATE: "failure" } }));
  assert.equal(r.status, "failed");
  assert.equal(r.pushed, true);
  assert.ok(fs.readFileSync(f.frFile).equals(original));
  assert.equal(f.remoteFile("src/translations/fr/ressources.json"), original.toString());
  const q = f.remoteQueue();
  assert.deepEqual(q.queue, []);
  assert.deepEqual(q.done, []);
  assert.equal(q.failed[0].slug, "a");
  assert.match(q.failed[0].reason, /Validation gate: failure/);
  // the next run does not pick it again
  const again = R.pickNext({ queuePath: f.queuePath, translationsDir: path.join(f.work, "src", "translations"), runPath: f.runPath, now: NOW, log: quiet });
  assert.equal(again.status, "none");
});

test("finalize on a timed-out / cancelled refresh (later steps skipped) fails the slug too", async () => {
  const f = gitFixture();
  claimed(f);
  const r = await R.finalize(FIN(f, { env: { OUTCOME_REFRESH: "cancelled", OUTCOME_FIX: "skipped", OUTCOME_VALIDATE: "skipped", OUTCOME_GATE: "skipped" } }));
  assert.equal(r.status, "failed");
  assert.match(f.remoteQueue().failed[0].reason, /Refresh next article: cancelled/);
});

test("main moved: rebase, re-validate with base origin/main, push", async () => {
  const f = gitFixture();
  claimed(f);
  writeJson(f.frFile, { Articles: [{ slug: "a", date: "2025-01-10", title: "T", updated: TODAY }] });
  f.moveMain();
  const refs = [];
  const r = await R.finalize(FIN(f, { env: allOk, revalidate: async (ref) => (refs.push(ref), { ok: true }) }));
  assert.deepEqual(refs, ["origin/main"]);
  assert.equal(r.status, "done");
  assert.equal(r.pushed, true);
  assert.equal(f.remoteFile("unrelated.txt"), "x");
  assert.equal(f.remoteQueue().done[0].slug, "a");
});

test("main moved and re-validation fails: downgraded to a queue-only failed commit", async () => {
  const f = gitFixture();
  claimed(f);
  const original = fs.readFileSync(f.frFile, "utf8");
  writeJson(f.frFile, { Articles: [{ slug: "a", date: "2025-01-10", title: "T", updated: TODAY }] });
  f.moveMain();
  const r = await R.finalize(FIN(f, { env: allOk, revalidate: async () => ({ ok: false, reason: "article gate" }) }));
  assert.equal(r.status, "failed");
  assert.equal(r.pushed, true);
  assert.match(r.downgraded, /revalidation after rebase failed/);
  assert.equal(f.remoteFile("src/translations/fr/ressources.json"), original);
  const q = f.remoteQueue();
  assert.equal(q.failed[0].slug, "a");
  assert.deepEqual(q.queue, []);
});

test("push that keeps failing exits with an error after 3 bounded attempts; the slug is still at the queue head upstream", async () => {
  const f = gitFixture();
  claimed(f);
  const hook = path.join(f.origin, "hooks", "pre-receive");
  fs.writeFileSync(hook, "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  let sleeps = 0;
  const r = await R.finalize(FIN(f, { env: allOk, revalidate: async () => ({ ok: true }), sleep: async () => { sleeps++; } }));
  assert.equal(r.pushed, false);
  assert.match(r.error, /push failed/);
  assert.equal(sleeps, 2);
  assert.deepEqual(f.remoteQueue().queue, ["a"]);
});

test("claim pushes the attempt counter (queue only) so the cap survives a killed run", async () => {
  const f = gitFixture();
  claimed(f);
  await R.claim({ git: realGit(f.work), root: f.work, queuePath: f.queuePath, runPath: f.runPath, sleep: async () => {}, log: quiet });
  assert.deepEqual(f.remoteQueue().attempts, { a: 1 });
});

const lastRemoteMessage = (f) => spawnSync("git", ["log", "-1", "--format=%s", "main"], { cwd: f.origin, encoding: "utf8" }).stdout.trim();

test("claim returns true and its commit message carries [skip ci]", async () => {
  const f = gitFixture();
  claimed(f);
  assert.equal(await R.claim({ git: realGit(f.work), root: f.work, queuePath: f.queuePath, runPath: f.runPath, sleep: async () => {}, log: quiet }), true);
  assert.match(lastRemoteMessage(f), /^chore\(ressources\): claim refresh of a \[skip ci\]$/);
});

test("claim that cannot be pushed returns false (caller aborts before any model call) and leaves origin untouched", async () => {
  const f = gitFixture();
  claimed(f);
  fs.writeFileSync(path.join(f.origin, "hooks", "pre-receive"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const ok = await R.claim({ git: realGit(f.work), root: f.work, queuePath: f.queuePath, runPath: f.runPath, sleep: async () => {}, log: quiet });
  assert.equal(ok, false);
  assert.equal(f.remoteQueue().attempts, undefined);
});

test("pick --commit: the CLI exits non-zero and sets no picked output when the claim push fails", () => {
  const f = gitFixture();
  fs.writeFileSync(path.join(f.origin, "hooks", "pre-receive"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const out = path.join(f.base, "gh-output");
  const r = spawnSync(process.execPath, [path.join(__dirname, "refresh-next-article.js"), "--pick", "--commit"], {
    cwd: f.work, encoding: "utf8", env: { ...process.env, GITHUB_OUTPUT: out, REFRESH_ROOT: f.work },
  });
  assert.notEqual(r.status, 0);
  assert.ok(!fs.existsSync(out) || !/refresh_status=picked/.test(fs.readFileSync(out, "utf8")));
});

test("pickNext that marks a capped slug failed and returns none: pushQueueState pushes that terminal state ([skip ci])", async () => {
  const f = gitFixture();
  const q = readJson(f.queuePath);
  q.attempts = { a: R.MAX_ATTEMPTS };
  writeJson(f.queuePath, q);
  sh(f.work, "add", "-A");
  sh(f.work, "commit", "-m", "capped");
  sh(f.work, "push", "origin", "HEAD:main");
  const r = R.pickNext({ queuePath: f.queuePath, translationsDir: path.join(f.work, "src", "translations"), runPath: f.runPath, now: NOW, log: quiet });
  assert.equal(r.status, "none");
  assert.equal(await R.pushQueueState({ git: realGit(f.work), root: f.work, queuePath: f.queuePath, sleep: async () => {}, log: quiet }), true);
  assert.equal(f.remoteQueue().failed[0].slug, "a");
  assert.deepEqual(f.remoteQueue().queue, []);
  assert.match(lastRemoteMessage(f), /\[skip ci\]$/);
});

test("finalize: failure/queue-only commit has [skip ci], the success commit does not", async () => {
  const f = gitFixture();
  claimed(f);
  writeJson(f.frFile, { Articles: [{ slug: "a", date: "2025-01-10", title: "T", updated: TODAY }] });
  await R.finalize(FIN(f, { env: allOk, revalidate: async () => ({ ok: true }) }));
  assert.equal(lastRemoteMessage(f), "chore(ressources): refresh article a");
  const g = gitFixture();
  claimed(g);
  await R.finalize(FIN(g, { env: { ...allOk, OUTCOME_GATE: "failure" } }));
  assert.match(lastRemoteMessage(g), /failed \(queue only\) \[skip ci\]$/);
});

// ─────────────────────────────────────────────────────────────────────────
// Legacy article through refresh -> link fixer -> slug validator -> finalize
// ─────────────────────────────────────────────────────────────────────────

const SLUG = "reporting-consolide-patrimoine-multi-banques";
const SERVICE = "/services/consolidated-reporting";
const KEYWORDS = Object.fromEntries(
  LOCALES.map((l) => [l, { primary: "reporting patrimoine", secondary: ["consolidation bancaire", "suivi multi banques", "tableau de bord", "performance nette", "frais bancaires"] }]),
);
const REFS = [
  { labelKey: "estv.admin.ch — Administration fédérale des contributions", url: "https://www.estv.admin.ch/estv/fr/home.html" },
  { labelKey: "fedlex.admin.ch — Recueil systématique", url: "https://www.fedlex.admin.ch/fr/home" },
  { labelKey: "ch.ch — Impôts", url: "https://www.ch.ch/fr/impots/" },
];
const legacyArticle = (l) => readJson(path.join(ROOT, "src", "translations", l, "ressources.json")).Articles.find((a) => a.slug === SLUG);

/** Mocked model output shaped like the real draft / translate payloads. */
function mockDeps(today = TODAY) {
  return {
    research: async () => REFS,
    draft: async () => {
      const a = mock.buildArticle("fr", { keywords: KEYWORDS, references: REFS, serviceUrl: rules.localizedServiceUrl("fr", SERVICE, maps), today });
      return {
        article: {
          title: a.title, description: a.description, tags: ["reporting", "banques", "patrimoine"], seoTitle: a.seoTitle,
          metaDescription: a.metaDescription, imageAlt: a.imageAlt, keywords: KEYWORDS.fr, content: a.content,
        },
        changeSummary: ["mock"],
      };
    },
    translate: async (_prompt, { locale }) => {
      const a = mock.buildArticle(locale, { keywords: KEYWORDS, references: REFS, serviceUrl: rules.localizedServiceUrl(locale, SERVICE, maps), today });
      return {
        title: a.title, description: a.description, tags: ["reporting", "banks", "wealth"], seoTitle: a.seoTitle, metaDescription: a.metaDescription,
        imageAlt: a.imageAlt, keywords: KEYWORDS[locale], referenceLabels: REFS.map((r) => `${r.labelKey} (${locale})`), content: a.content,
      };
    },
  };
}

/** Git repo holding the real legacy article of `SLUG` in the 5 locales + the queue. */
function legacyFixture() {
  const f = gitFixture({ articles: [], queue: [SLUG] });
  for (const l of LOCALES) {
    const other = { slug: "other", date: "2025-02-02", title: "Autre", description: "d", content: "c", category: "gouvernance", tags: ["a", "b", "c"] };
    writeJson(path.join(f.work, "src", "translations", l, "ressources.json"), { Articles: [legacyArticle(l), other] });
  }
  sh(f.work, "add", "-A");
  sh(f.work, "commit", "-m", "legacy fixture");
  sh(f.work, "push", "origin", "HEAD:main");
  return f;
}
const refreshIn = (f, opts = {}) =>
  refreshArticles({
    slugs: [SLUG], today: TODAY, translationsDir: path.join(f.work, "src", "translations"), servicePathMaps: maps,
    serviceFor: () => SERVICE, minWords: 1100, maxWords: 1900, apply: true, deps: mockDeps(), log: quiet, ...opts,
  });
const validate = (f, over = {}) =>
  validateRefreshed({
    slug: SLUG, current: loadWorkingTree(f.work), baseline: loadFromGit("HEAD", f.work), today: TODAY, minWords: 1100, maxWords: 1900, servicePathMaps: maps, ...over,
  });

test("legacy article (no keywords / seoTitle / metaDescription / imageAlt / structure) is upgraded and passes the slug gate, then finalize pushes it", async () => {
  const f = legacyFixture();
  assert.equal(legacyArticle("fr").keywords, undefined);
  claimed(f);
  await refreshIn(f, { upgradeLegacy: true });
  const fr = readJson(f.frFile).Articles[0];
  for (const k of ["seoTitle", "metaDescription", "imageAlt", "keywords"]) assert.ok(fr[k], `fr.${k}`);
  assert.ok(rules.extractFaq(fr.content).length >= 4);
  assert.equal(validate(f).length, 0, validate(f).join("\n"));
  // The real article-gate.sh validators that need neither network nor build, as child processes
  // against the temp repo (cwd). npm test / npm run build stay out of the unit test.
  fs.mkdirSync(path.join(f.work, "src", "lib"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, "src", "lib", "paths.ts"), path.join(f.work, "src", "lib", "paths.ts"));
  const gateCmds = [
    ["validate-article-seo.js", `--slug=${SLUG}`],
    ["validate-latest-article-guardrails.js", "--slug", SLUG],
    ["validate-reference-source-policy.js", "--all-locales", "--slug", SLUG],
    ["validate-article-facts.js"],
  ];
  for (const [script, ...args] of gateCmds) {
    const c = spawnSync(process.execPath, [path.join(__dirname, script), ...args], {
      cwd: f.work, encoding: "utf8", env: { ...process.env, REQUIRE_TRANSLATIONS: "1" },
    });
    assert.equal(c.status, 0, `${script} ${args.join(" ")}\n${c.stdout}\n${c.stderr}`);
  }
  const r = await R.finalize(FIN(f, { env: allOk, revalidate: async () => ({ ok: true }) }));
  assert.equal(r.status, "done");
  const pushed = JSON.parse(f.remoteFile("src/translations/en/ressources.json")).Articles[0];
  assert.ok(pushed.keywords && pushed.seoTitle && pushed.imageAlt && pushed.updated === TODAY);
  assert.equal(f.remoteQueue().done[0].slug, SLUG);
});

test("the same legacy article refreshed WITHOUT the upgrade is rejected by the gate (missing pipeline fields) and finalize records the failure", async () => {
  const f = legacyFixture();
  claimed(f);
  const legacyDeps = mockDeps();
  const baseDraft = legacyDeps.draft;
  legacyDeps.draft = async (...a) => {
    const d = await baseDraft(...a);
    for (const k of ["seoTitle", "metaDescription", "imageAlt", "keywords"]) delete d.article[k];
    return d;
  };
  legacyDeps.translate = async (...a) => {
    const t = await mockDeps().translate(...a);
    for (const k of ["seoTitle", "metaDescription", "imageAlt", "keywords"]) delete t[k];
    return t;
  };
  await refreshIn(f, { upgradeLegacy: false, deps: legacyDeps });
  const errors = validate(f);
  assert.ok(errors.some((e) => /missing keywords/.test(e)), errors.join("\n"));
  const r = await R.finalize(FIN(f, { env: { ...allOk, OUTCOME_VALIDATE: "failure" } }));
  assert.equal(r.status, "failed");
  assert.equal(JSON.parse(f.remoteFile("src/translations/fr/ressources.json")).Articles[0].keywords, undefined);
  assert.equal(f.remoteQueue().failed[0].slug, SLUG);
});

test("validator rejects too-short, untranslated, bad-link, changed-date and non-updated articles", async () => {
  const f = legacyFixture();
  await refreshIn(f, { upgradeLegacy: true });
  const ok = loadWorkingTree(f.work);
  const clone = () => JSON.parse(JSON.stringify(ok));
  const idx = (d, l) => d[l].Articles.findIndex((a) => a.slug === SLUG);
  const errs = (cur, over = {}) => validate(f, { current: cur, ...over });

  assert.equal(errs(ok).length, 0);
  assert.ok(errs(ok, { minWords: 5000, maxWords: 6000 }).some((e) => /\[fr\] word count .* outside 5000/.test(e)), "too short");

  let c = clone();
  c.de.Articles[idx(c, "de")].description = c.fr.Articles[idx(c, "fr")].description;
  assert.ok(errs(c).some((e) => /\[de\] description identical to FR/.test(e)), "untranslated description");

  c = clone();
  c.en.Articles[idx(c, "en")].content = c.fr.Articles[idx(c, "fr")].content;
  assert.ok(errs(c).some((e) => /\[en\]/.test(e) && /identical to FR|not translated/.test(e)), "untranslated content");

  c = clone();
  const en = c.en.Articles[idx(c, "en")];
  en.content = en.content.replace(/\(\/en\/[^)]*\)/, "(/en/does-not-exist/)");
  assert.ok(errs(c).some((e) => /\[en\] .*does not resolve/.test(e)), "bad link");

  c = clone();
  const es = c.es.Articles[idx(c, "es")];
  es.content = es.content.replace(/\(\/es\/[^)]*\)/, "(/fr/services/)");
  assert.ok(errs(c).some((e) => /\[es\] internal link is not localized/.test(e)), "link not localized");

  c = clone();
  c.fr.Articles[idx(c, "fr")].date = "2026-10-01";
  assert.ok(errs(c).some((e) => /\[fr\] date changed/.test(e)), "changed date");

  c = clone();
  c.pt.Articles[idx(c, "pt")].updated = "2026-01-01";
  assert.ok(errs(c).some((e) => /\[pt\] updated is "2026-01-01"/.test(e)), "updated != today");

  c = clone();
  c.fr.Articles.find((a) => a.slug === "other").title = "Touched";
  assert.ok(errs(c).some((e) => /unrelated article changed: other/.test(e)), "unrelated article changed");

  c = clone();
  c.fr.Articles[idx(c, "fr")].references = c.fr.Articles[idx(c, "fr")].references.slice(0, 2);
  assert.ok(errs(c).some((e) => /\[fr\] 2 references \(min 3\)/.test(e)), "references below minimum");
});

// ─────────────────────────────────────────────────────────────────────────
// link fixer --slug
// ─────────────────────────────────────────────────────────────────────────

test("link fixer with a slug changes only that article", () => {
  const bad = "voir [Contact](/services/[taxes](/services/taxes))";
  const mk = () => ({ Articles: [{ slug: "x", content: bad }, { slug: "y", content: bad }] });
  const all = fixRessourcesJson(mk());
  assert.equal(all.changes, 2);
  const one = fixRessourcesJson(mk(), { slug: "x" });
  assert.equal(one.changes, 1);
  assert.equal(one.json.Articles[0].content, "voir [Contact](/services/taxes)");
  assert.equal(one.json.Articles[1].content, bad);
});

// ─────────────────────────────────────────────────────────────────────────
// outdated Swiss VAT rates: historical context is accepted
// ─────────────────────────────────────────────────────────────────────────

test("VAT validator rejects old rates as current but accepts them in clearly historical context", () => {
  const { extractOutdatedSwissVatRateMatches: find } = require("./lib/outdatedVatValidator");
  const n = (content) => find({ slug: "tva-suisse", title: "TVA", content }).length;
  // rejected: old rate stated as the current one
  assert.equal(n("Le taux normal de TVA est de 7.7%."), 1);
  assert.equal(n("Die Mehrwertsteuer beträgt 2.5% für Lebensmittel."), 1);
  assert.equal(n("Le taux réduit de la TVA est de 3,7%. Le taux normal est de 7.7% aussi."), 2);
  assert.equal(n("Historique complet.\nLa TVA reste à 7.7% pour tous."), 1); // marker/year in another sentence does not count
  // accepted: current rate in the same sentence
  assert.equal(n("Le taux normal de TVA est passé de 7.7% à 8.1%."), 0);
  assert.equal(n("The VAT rate rose from 7.7% to 8.1% for most goods."), 0);
  // accepted: historical markers
  assert.equal(n("Avant la hausse, la TVA était de 7,7%."), 0);
  assert.equal(n("La TVA a été de 7.7% jusqu'en décembre."), 0);
  assert.equal(n("VAT was 2.5% until the increase."), 0);
  assert.equal(n("Previously the VAT rate was 3.7% for accommodation."), 0);
  assert.equal(n("Mehrwertsteuer: 7.7% bis Ende des Jahres."), 0);
  assert.equal(n("Früher lag die Mehrwertsteuer bei 7.7%."), 0);
  assert.equal(n("El IVA fue 7.7% hasta la reforma."), 0);
  assert.equal(n("O IVA era 7.7% até à reforma."), 0);
  assert.equal(n("O IVA foi anteriormente de 2.5%."), 0);
  assert.equal(n("L'ancien taux de TVA de 7.7% a disparu."), 0);
  // accepted: year <= 2023
  assert.equal(n("En 2022, la TVA était de 7.7%."), 0);
  assert.equal(n("La TVA de 7.7% s'appliquait jusqu'à fin 2023."), 0);
  // rejected: year after 2023 does not make it historical
  assert.equal(n("En 2025, la TVA est de 7.7%."), 1);
  // rejected: a current rate or marker elsewhere in the sentence is not enough
  assert.equal(n("TVA normale 7.7%, taux spécial 3.8%."), 1);
  assert.equal(n("Before choosing a provider, VAT is 7.7%."), 1);
  assert.equal(n("Avant de choisir, sachez que la TVA est de 7.7% et le taux spécial de 3.8%."), 1);
});
