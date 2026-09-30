"use strict";

/**
 * Regression tests for the article-pipeline review findings:
 * official-only references, backlog source policy, unique slug per locale,
 * all-or-nothing locale writes, time budgets and the workflow's credential
 * / re-validation structure. No network, no Azure.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
// js-yaml ships with @eslint/eslintrc (devDependency); no new package.
const YAML = require("js-yaml");

const refs = require("./lib/referenceValidator");
const policy = require("./lib/officialReferencePolicy");
const { writeJsonFilesAtomically } = require("./lib/atomicJsonWrite");
const azure = require("./lib/azureClients");
const { validateArticle } = require("./validate-article-seo");
const { writeArticleAtomically } = require("./ai-ressources-update");
const rules = require("./lib/ridgerArticleRules");

const ROOT = path.join(__dirname, "..");
const LOCALES = rules.LOCALES;

const OFFICIAL = [
  { labelKey: "AFC", url: "https://www.estv.admin.ch/fr" },
  { labelKey: "Fedlex", url: "https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/fr" },
  { labelKey: "Genève", url: "https://www.ge.ch/organisation/administration-fiscale-cantonale" },
];

function legalArticle(overrides = {}) {
  return {
    slug: "test-impot-fortune",
    category: "fiscalite",
    title: "Impôt sur la fortune à Genève",
    description: "Ce que prévoit la loi.",
    content: "L'impôt sur la fortune est régi par l'art. 13 LHID.\n",
    tags: ["impôt"],
    references: OFFICIAL.map((r) => ({ ...r })),
    ...overrides,
  };
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ridger-pipeline-"));
}

// ─── Finding 3: official-only references ─────────────────────────────────

test("official reference domains are a subset of the reference allowlist", () => {
  for (const d of refs.OFFICIAL_REFERENCE_DOMAINS) {
    assert.ok(refs.ALLOWED_REFERENCE_DOMAINS.includes(d), `${d} is official but not allow-listed`);
  }
  assert.equal(refs.isOfficialReference("https://www.estv.admin.ch/fr"), true);
  assert.equal(refs.isOfficialReference("https://fr.wikipedia.org/wiki/Imp%C3%B4t"), false);
  assert.equal(refs.isOfficialReference("https://www.odoo.com/"), false);
  assert.equal(refs.isOfficialReference("https://www.kpmg.ch/"), false);
  assert.equal(refs.isOfficialReference("http://www.estv.admin.ch/fr"), false, "https only");
});

test("legal/tax/permit article with ≥ 3 official references passes", () => {
  assert.deepEqual(policy.checkOfficialOnlyReferences(legalArticle()), []);
});

test("legal/tax/permit article citing any non-official reference is rejected", () => {
  const a = legalArticle({ references: [...OFFICIAL, { labelKey: "Wiki", url: "https://fr.wikipedia.org/wiki/Imp%C3%B4t" }] });
  const problems = policy.checkOfficialOnlyReferences(a);
  assert.ok(problems.some((p) => /non-official reference/.test(p) && /wikipedia/.test(p)), problems.join("\n"));
});

test("legal/tax/permit article with fewer than 3 official references is rejected", () => {
  const problems = policy.checkOfficialOnlyReferences(legalArticle({ references: OFFICIAL.slice(0, 2) }));
  assert.ok(problems.some((p) => /at least 3 official/.test(p)), problems.join("\n"));
});

test("non-official links in the body of a legal article are rejected", () => {
  const a = legalArticle({ content: "Voir [un guide](https://www.odoo.com/fr) sur l'art. 13 LHID.\n" });
  assert.ok(policy.checkOfficialOnlyReferences(a).some((p) => /in the body/.test(p)));
});

test("legal-statement detection covers all 5 locales; non-legal practical articles are exempt", () => {
  for (const text of ["Die Steuer nach Art. 13 StHG", "Swiss tax law", "El impuesto y la ley", "O imposto e a lei", "Le permis B"]) {
    assert.ok(policy.makesLegalTaxPermitStatements({ category: "vie-pratique", content: text }), text);
  }
  const practical = { category: "vie-pratique", title: "Organiser son courrier", content: "Faire suivre son courrier pendant un voyage." };
  assert.equal(policy.makesLegalTaxPermitStatements(practical), false);
  assert.deepEqual(policy.checkOfficialOnlyReferences({ ...practical, references: [] }), []);
});

test("the generator's locale validation rejects an article with a non-official reference", () => {
  const { validateLocaleArticle } = require("./ai-ressources-update");
  const article = legalArticle({ references: [...OFFICIAL, { labelKey: "GitHub", url: "https://github.com/x" }] });
  const res = validateLocaleArticle(article, {
    locale: "fr",
    keywords: { fr: { primary: "impôt sur la fortune", secondary: [] } },
    allowedPaths: { fr: new Set() },
  });
  assert.ok(res.problems.some((p) => /non-official reference/.test(p)), res.problems.join("\n"));
});

// ─── Finding 7: backlog sources follow the policy ─────────────────────────

test("every backlog officialSources entry passes the source policy (allow-listed and official)", () => {
  const backlog = require("../data/article-backlog.json");
  const bad = [];
  for (const item of backlog.items) {
    for (const url of item.officialSources || []) {
      if (refs.isBlockedDomain(url) || !refs.isOfficialReference(url)) bad.push(`${item.id}: ${url}`);
    }
  }
  assert.deepEqual(bad, []);
});

// ─── Finding 2: exactly one article per slug per locale ──────────────────

function loadCorpus() {
  return Object.fromEntries(
    LOCALES.map((l) => [l, JSON.parse(fs.readFileSync(path.join(ROOT, "src", "translations", l, "ressources.json"), "utf8"))]),
  );
}

test("validate-article-seo fails on a duplicate slug in a translation", () => {
  const data = loadCorpus();
  const slug = data.fr.Articles[0].slug;
  data.de.Articles.push({ ...data.de.Articles[0] });
  const errors = validateArticle(data, slug, { servicePathMaps: rules.loadServicePathMaps(ROOT) });
  assert.ok(errors.some((e) => /^\[de\] duplicate slug/.test(e)), errors.join("\n"));
});

test("validate-article-seo fails on a duplicate slug in FR", () => {
  const data = loadCorpus();
  const slug = data.fr.Articles[0].slug;
  data.fr.Articles.push({ ...data.fr.Articles[0] });
  const errors = validateArticle(data, slug, { servicePathMaps: rules.loadServicePathMaps(ROOT) });
  assert.deepEqual(errors.length, 1);
  assert.match(errors[0], /^\[fr\] duplicate slug/);
});

test("validate-article-seo reports a missing slug", () => {
  const errors = validateArticle(loadCorpus(), "does-not-exist", {});
  assert.match(errors[0], /not found/);
});

// ─── Finding 6: all-or-nothing writes ─────────────────────────────────────

function seedFiles(dir, n) {
  const files = [];
  for (let i = 0; i < n; i++) {
    const f = path.join(dir, `f${i}.json`);
    fs.writeFileSync(f, `{"v":${i}}\n`);
    files.push(f);
  }
  return files;
}
const snapshot = (dir) => Object.fromEntries(fs.readdirSync(dir).sort().map((f) => [f, fs.readFileSync(path.join(dir, f), "utf8")]));

test("atomic write replaces every file when all serializations validate", () => {
  const dir = tmpDir();
  const files = seedFiles(dir, 5);
  writeJsonFilesAtomically(files.map((file, i) => ({ file, data: { v: i + 10 } })));
  files.forEach((f, i) => assert.deepEqual(JSON.parse(fs.readFileSync(f, "utf8")), { v: i + 10 }));
  assert.deepEqual(fs.readdirSync(dir).sort(), files.map((f) => path.basename(f)).sort(), "no temp/backup leftovers");
});

test("atomic write leaves the tree unchanged when one validation fails", () => {
  const dir = tmpDir();
  const files = seedFiles(dir, 5);
  const before = snapshot(dir);
  assert.throws(() =>
    writeJsonFilesAtomically(files.map((file, i) => ({ file, data: { v: i + 10 } })), {
      validate: (parsed, file) => {
        if (file === files[3]) throw new Error("bad locale");
      },
    }),
  /bad locale/);
  assert.deepEqual(snapshot(dir), before);
});

test("atomic write leaves the tree unchanged when one serialization fails", () => {
  const dir = tmpDir();
  const files = seedFiles(dir, 5);
  const before = snapshot(dir);
  assert.throws(() => writeJsonFilesAtomically(files.map((file, i) => ({ file, data: i === 4 ? { v: 1n } : { v: i } }))));
  assert.deepEqual(snapshot(dir), before);
});

test("atomic write rolls back already-swapped files when a later rename fails", () => {
  const dir = tmpDir();
  const files = seedFiles(dir, 5);
  const before = snapshot(dir);
  let renames = 0;
  const fsImpl = {
    ...fs,
    renameSync(from, to) {
      renames += 1;
      if (renames === 4) throw new Error("simulated rename failure");
      return fs.renameSync(from, to);
    },
  };
  assert.throws(
    () => writeJsonFilesAtomically(files.map((file, i) => ({ file, data: { v: i + 10 } })), { fsImpl }),
    /simulated rename failure/,
  );
  assert.equal(renames, 4, "three files were swapped before the failure");
  assert.deepEqual(snapshot(dir), before, "swapped files restored, no temp/backup leftovers");
});

test("writeArticleAtomically writes 5 locales + log, or nothing when a locale fails validation", () => {
  const dir = tmpDir();
  const files = { researchLog: path.join(dir, "log.json") };
  const data = {};
  for (const l of LOCALES) {
    files[l] = path.join(dir, `${l}.json`);
    data[l] = { Title: l, Articles: [{ slug: "existing" }] };
    fs.writeFileSync(files[l], `${JSON.stringify(data[l], null, 2)}\n`);
  }
  fs.writeFileSync(files.researchLog, '{"entries":[]}\n');
  const before = snapshot(dir);

  const bad = Object.fromEntries(LOCALES.map((l) => [l, legalArticle()]));
  bad.pt = legalArticle({ references: [...OFFICIAL, { labelKey: "Wiki", url: "https://pt.wikipedia.org/wiki/Imposto" }] });
  assert.throws(() => writeArticleAtomically({ data, byLocale: bad, researchLog: { entries: [{ x: 1 }] }, files }), /pt: .*non-official/);
  assert.deepEqual(snapshot(dir), before, "tree unchanged on failure");

  const good = Object.fromEntries(LOCALES.map((l) => [l, legalArticle()]));
  writeArticleAtomically({ data, byLocale: good, researchLog: { entries: [{ x: 1 }] }, files });
  for (const l of LOCALES) {
    const out = JSON.parse(fs.readFileSync(files[l], "utf8"));
    assert.deepEqual(out.Articles.map((a) => a.slug), ["existing", "test-impot-fortune"]);
  }
  assert.deepEqual(JSON.parse(fs.readFileSync(files.researchLog, "utf8")), { entries: [{ x: 1 }] });
});

// ─── Finding 4: time budgets ──────────────────────────────────────────────

const workflow = YAML.load(fs.readFileSync(path.join(ROOT, ".github/workflows/ai-ressources.yml"), "utf8"));
const job = workflow.jobs.update;
const step = (re) => job.steps.find((s) => re.test(s.name));

test("attempt timeouts are clamped to the deadline; retries only when they fit", () => {
  const now = 1_000_000;
  assert.equal(azure.computeAttemptTimeoutMs({ timeoutMs: 240000, deadlineAt: Infinity, now }), 240000);
  assert.equal(azure.computeAttemptTimeoutMs({ timeoutMs: 240000, deadlineAt: now + 100000, now, minAttemptMs: 30000 }), 100000);
  assert.equal(azure.computeAttemptTimeoutMs({ timeoutMs: 240000, deadlineAt: now + 10000, now, minAttemptMs: 30000 }), 0);
  assert.equal(azure.canAffordRetry({ delayMs: 20000, deadlineAt: now + 60000, now, minAttemptMs: 30000 }), true);
  assert.equal(azure.canAffordRetry({ delayMs: 40000, deadlineAt: now + 60000, now, minAttemptMs: 30000 }), false);
});

test("CI generation budgets fit comfortably inside the step timeout", () => {
  const gen = step(/generate article/);
  const env = gen.env;
  const budgets = azure.worstCaseBudgets(env);
  const deadline = Number(env.AI_PIPELINE_DEADLINE_MS);
  const reserve = Number(env.AZURE_AGENT_FALLBACK_RESERVE_MS);
  const m = /timeout -k (\d+)s (\d+)m/.exec(gen.run);
  assert.ok(m, "generator runs under `timeout`");
  const killMs = Number(m[2]) * 60000;
  const stepMs = gen["timeout-minutes"] * 60000;

  assert.ok(deadline > 0, "a global deadline is set");
  // After the deadline only one reference-check round can still run (< 2 min).
  assert.ok(deadline + 2 * 60000 <= killMs, `deadline ${deadline} + 2 min must fit before timeout ${killMs}`);
  assert.ok(killMs + Number(m[1]) * 1000 < stepMs, "timeout (incl. kill grace) < step timeout");
  // The agent can never consume the fallback window.
  assert.ok(budgets.agentMs + reserve <= deadline, `agent ${budgets.agentMs} + reserve ${reserve} ≤ deadline ${deadline}`);
  // A single OpenAI call (all retries) fits in the fallback window + slack.
  assert.ok(budgets.openaiMs <= deadline, `openai ${budgets.openaiMs} ≤ deadline`);
  assert.ok(budgets.agentMs <= 10 * 60000);
});

// ─── Findings 1 & 5: workflow structure ───────────────────────────────────

test("workflow: least privilege, no persisted credentials, token only in the push step", () => {
  assert.deepEqual(workflow.permissions, {}, "no workflow-level permissions");
  assert.deepEqual(job.permissions, { contents: "write", actions: "write" });
  const checkout = step(/^Checkout$/);
  assert.equal(checkout.with["persist-credentials"], false);
  assert.equal(checkout.with.token, undefined, "no write token on checkout");
  const install = step(/Install dependencies/);
  assert.equal(install.env, undefined, "npm ci runs without credentials");
  assert.ok(/npm ci/.test(install.run));

  const tokenSteps = job.steps.filter((s) => /PAT_TOKEN|github\.token|GITHUB_TOKEN/.test(JSON.stringify({ env: s.env, with: s.with, run: s.run })));
  assert.deepEqual(
    tokenSteps.map((s) => s.name).sort(),
    ["Commit and push", "Dispatch build-and-deploy (GITHUB_TOKEN pushes do not trigger workflows)"].sort(),
  );
  const push = step(/^Commit and push$/);
  assert.match(push.env.PUSH_TOKEN, /secrets\.PAT_TOKEN \|\| github\.token/);
  assert.doesNotMatch(push.run, /remote set-url|git config[^\n]*extraheader/, "token never written to .git/config");
});

test("workflow: full gate before the first push and again after every rebase (max 3)", () => {
  const gate = step(/Validation gate/);
  assert.match(gate.run, /scripts\/article-gate\.sh/);
  const gateScript = fs.readFileSync(path.join(ROOT, "scripts/article-gate.sh"), "utf8");
  for (const needle of [
    "validate-article-seo.js --slug",
    "validate-latest-article-guardrails.js --slug",
    "validate-reference-source-policy.js --all-locales --slug",
    "validate-article-facts.js",
    "validate-article-translations.js",
    "fix-article-internal-links.js --check",
    "npm test",
    "npm run build",
  ]) assert.ok(gateScript.includes(needle), `gate runs ${needle}`);

  const push = step(/^Commit and push$/).run;
  assert.match(push, /for i in 1 2 3; do/);
  const rebaseAt = push.indexOf("git rebase origin/main");
  const gateAt = push.indexOf("\n              gate\n") >= 0 ? push.indexOf("\n              gate\n") : push.search(/^\s*gate\s*$/m);
  const pushAt = push.indexOf("git_auth push");
  assert.ok(rebaseAt > 0 && gateAt > rebaseAt && pushAt > gateAt, "rebase → gate → push");
  assert.match(push, /gate\(\) \{ env -u AUTH_HEADER -u PUSH_TOKEN/, "re-gate runs without credentials");
  assert.match(push, /exit 1\s*$/, "fails after 3 attempts");
});
