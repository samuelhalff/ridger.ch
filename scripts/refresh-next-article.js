#!/usr/bin/env node
"use strict";

/**
 * Autonomous article refresh, driven by .github/workflows/ai-ressources-refresh.yml.
 * Every run must end in a committed, terminal queue state (done or failed), so
 * three modes cooperate through data/refresh-queue.json and a small status file
 * (.refresh-run.json, never committed):
 *
 *   --pick [--commit]   take the head of the queue (empty queue: the single
 *                       oldest article by updated ?? date older than 12 months;
 *                       none: "nothing to do"). Counts the attempt in
 *                       queue.attempts; a slug already attempted twice is moved
 *                       to "failed" instead. With --commit the claim (queue
 *                       only) is pushed right away, so the attempt cap holds
 *                       even if the run is later killed.
 *   --refresh           run `ai-ressources-update.js --refresh=<slug> --apply
 *                       --upgrade-legacy` and write {slug, phase, ok, reason} to
 *                       the status file. Never touches the queue. Exits 1 on
 *                       failure so the later validator steps are skipped.
 *   --finalize [--commit]  `if: always()` step. Reads the outcome of the earlier
 *                       steps from OUTCOME_<STEP> env vars. All "success" ->
 *                       slug "done", translations kept. Anything else (failure,
 *                       cancelled, timed out, skipped, missing) -> translations
 *                       restored with `git checkout`, slug "failed" with the step
 *                       name and a short message, never re-queued. With --commit
 *                       it commits (translations + queue on success, queue only
 *                       on failure) and pushes with a bounded fetch / rebase /
 *                       push loop (max 3); after a rebase on the success path the
 *                       slug validator and the gate run again, and if they fail
 *                       the run is downgraded to a queue-only "failed" commit.
 *                       If the push finally fails the script exits non-zero.
 *
 * GITHUB_OUTPUT: pick -> refresh_status (picked|none), refresh_slug;
 *                finalize -> final_status (done|failed|none), pushed.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.env.REFRESH_ROOT || path.join(__dirname, ".."); // REFRESH_ROOT: tests run the CLI against a temp repo
const QUEUE_PATH = path.join(ROOT, "data", "refresh-queue.json");
const RUN_PATH = path.join(ROOT, ".refresh-run.json");
const LOG_DIR = path.join(ROOT, ".refresh-logs");
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");
const LOCALES = ["fr", "en", "de", "es", "pt"];
const STALE_MONTHS = 12;
const MAX_ATTEMPTS = 2; // a slug is attempted at most twice, then it is "failed"
const REFRESH_TIMEOUT_MS = 23 * 60 * 1000; // < the step's timeout-minutes (25)

// Steps whose GitHub `outcome` is passed to --finalize as OUTCOME_<KEY>.
const STEPS = [
  { key: "REFRESH", name: "Refresh next article", log: "refresh" },
  { key: "FIX", name: "Fix internal links", log: "fix" },
  { key: "VALIDATE", name: "Validate refreshed article", log: "validate" },
  { key: "GATE", name: "Validation gate", log: "gate" },
];

function isoToday(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────────
// Queue
// ─────────────────────────────────────────────────────────────────────────

function loadQueue(file = QUEUE_PATH) {
  const q = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  const attempts = q.attempts && typeof q.attempts === "object" && !Array.isArray(q.attempts) ? q.attempts : {};
  return {
    queue: Array.isArray(q.queue) ? q.queue : [],
    done: Array.isArray(q.done) ? q.done : [],
    failed: Array.isArray(q.failed) ? q.failed : [],
    attempts,
  };
}

function saveQueue(q, file = QUEUE_PATH) {
  const out = { queue: q.queue, done: q.done, failed: q.failed };
  if (q.attempts && Object.keys(q.attempts).length) out.attempts = q.attempts;
  fs.writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
}

function dropSlug(q, slug) {
  q.queue = q.queue.filter((s) => s !== slug);
  q.done = q.done.filter((d) => d.slug !== slug);
  q.failed = q.failed.filter((d) => d.slug !== slug);
  delete q.attempts[slug];
}

/** Terminal states. Idempotent: safe to re-apply on top of a different queue file. */
function markDone(q, slug, today) {
  dropSlug(q, slug);
  q.done.push({ slug, date: today });
  return q;
}

function markFailed(q, slug, today, reason) {
  dropSlug(q, slug);
  q.failed.push({ slug, date: today, reason: String(reason || "unknown failure").slice(0, 500) });
  return q;
}

function readArticles(translationsDir = TRANSLATIONS_DIR) {
  const data = JSON.parse(fs.readFileSync(path.join(translationsDir, "fr", "ressources.json"), "utf8"));
  return Array.isArray(data.Articles) ? data.Articles : [];
}

/** Oldest article by (updated ?? date) strictly older than 12 months, skipping `exclude`. */
function pickOldestStale(articles, { today, exclude = [] }) {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - STALE_MONTHS);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  const skip = new Set(exclude);
  const candidates = articles
    .filter((a) => a && a.slug && !skip.has(a.slug))
    .map((a) => ({ slug: a.slug, when: String(a.updated || a.date || "") }))
    .filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a.when) && a.when < cutoffIso)
    .sort((a, b) => (a.when < b.when ? -1 : a.when > b.when ? 1 : a.slug.localeCompare(b.slug)));
  return candidates[0] ? candidates[0].slug : null;
}

// ─────────────────────────────────────────────────────────────────────────
// Status file
// ─────────────────────────────────────────────────────────────────────────

function readRun(file = RUN_PATH) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
}

function writeRun(run, file = RUN_PATH) {
  fs.writeFileSync(file, `${JSON.stringify(run)}\n`);
}

// ─────────────────────────────────────────────────────────────────────────
// --pick
// ─────────────────────────────────────────────────────────────────────────

/**
 * @returns {{status:"picked"|"none", slug:string|null}}
 */
function pickNext({ queuePath = QUEUE_PATH, translationsDir = TRANSLATIONS_DIR, runPath = RUN_PATH, now = new Date(), log = console.log } = {}) {
  const today = isoToday(now);
  const q = loadQueue(queuePath);
  for (;;) {
    if (!q.queue.length) {
      const exclude = [...q.failed.map((f) => f.slug), ...q.done.map((d) => d.slug)];
      const slug = pickOldestStale(readArticles(translationsDir), { today, exclude });
      if (!slug) {
        saveQueue(q, queuePath);
        log(`Nothing to do: queue empty and no article older than ${STALE_MONTHS} months.`);
        return { status: "none", slug: null };
      }
      log(`Queue empty: auto-filled with the oldest stale article ${slug}.`);
      q.queue.push(slug);
    }
    const slug = q.queue[0];
    const n = q.attempts[slug] || 0;
    if (n >= MAX_ATTEMPTS) {
      markFailed(q, slug, today, `gave up after ${n} attempts that did not finish`);
      log(`${slug}: already attempted ${n} times, marked failed.`);
      continue;
    }
    q.attempts[slug] = n + 1;
    saveQueue(q, queuePath);
    writeRun({ slug, phase: "picked", ok: null, attempt: n + 1, date: today }, runPath);
    log(`Picked ${slug} (attempt ${n + 1}/${MAX_ATTEMPTS}).`);
    return { status: "picked", slug };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// --refresh
// ─────────────────────────────────────────────────────────────────────────

function defaultRunRefresh(slug) {
  const r = spawnSync(process.execPath, [path.join(__dirname, "ai-ressources-update.js"), `--refresh=${slug}`, "--apply", "--upgrade-legacy"], {
    cwd: ROOT,
    env: process.env,
    stdio: "inherit",
    timeout: REFRESH_TIMEOUT_MS,
    killSignal: "SIGKILL",
  });
  if (r.error) return { ok: false, reason: `refresh process error: ${r.error.message}` };
  if (r.status !== 0) return { ok: false, reason: `refresh exited with code ${r.status ?? r.signal}` };
  return { ok: true };
}

/** Runs the refresh and records the result; never touches the queue. */
async function runRefreshStep({ runPath = RUN_PATH, runRefresh = defaultRunRefresh, log = console.log } = {}) {
  const run = readRun(runPath);
  if (!run.slug) throw new Error("no slug picked (missing .refresh-run.json)");
  let result;
  try {
    result = (await runRefresh(run.slug)) || { ok: false, reason: "refresh returned no result" };
  } catch (e) {
    result = { ok: false, reason: `refresh threw: ${e && e.message ? e.message : e}` };
  }
  const reason = result.ok ? "" : String(result.reason || "unknown failure").slice(0, 500);
  writeRun({ ...run, phase: "refresh", ok: Boolean(result.ok), reason }, runPath);
  log(result.ok ? `Refreshed ${run.slug}.` : `Refresh of ${run.slug} failed: ${reason}`);
  return { ok: Boolean(result.ok), reason };
}

// ─────────────────────────────────────────────────────────────────────────
// --finalize
// ─────────────────────────────────────────────────────────────────────────

function tailMessage(logName, logDir = LOG_DIR) {
  try {
    const lines = fs.readFileSync(path.join(logDir, `${logName}.log`), "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
    return lines.slice(-3).join(" | ").slice(0, 300);
  } catch {
    return "";
  }
}

/**
 * All steps must be "success". Anything else, including a missing value (a
 * step that never ran), counts as a failure.
 * @returns {{ok:boolean, reason:string}}
 */
function evaluateOutcomes(env, run = {}, logDir = LOG_DIR) {
  for (const s of STEPS) {
    const outcome = String(env[`OUTCOME_${s.key}`] || "missing");
    if (outcome === "success") continue;
    const msg = (s.key === "REFRESH" && run.ok === false && run.reason) || tailMessage(s.log, logDir);
    return { ok: false, reason: `${s.name}: ${outcome}${msg ? ` - ${msg}` : ""}`.slice(0, 500) };
  }
  return { ok: true, reason: "" };
}

function makeGit(cwd, token) {
  const header = token ? `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}` : "";
  if (header) {
    console.log(`::add-mask::${header}`);
    console.log(`::add-mask::${token}`);
  }
  return (args, { auth = false } = {}) => {
    const full = auth && header ? ["-c", `http.https://github.com/.extraheader=${header}`, ...args] : args;
    const r = spawnSync("git", full, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return { status: r.status ?? 1, stdout: r.stdout || "", stderr: r.stderr || "" };
  };
}

/**
 * Commits `files` and pushes with a bounded fetch / rebase / push loop.
 *
 * @param {object} o
 * @param {Function} o.git  (args, {auth}) => {status, stdout, stderr}
 * @param {string[]} o.files
 * @param {string} o.message
 * @param {boolean} o.success  true when the commit carries a refreshed article (must be re-validated after a rebase)
 * @param {(ref:string)=>Promise<{ok:boolean,reason?:string}>} [o.revalidate]
 * @param {(reason:string)=>string|null} [o.fallback]  called after `git reset --hard origin/main`; must rewrite the
 *        queue as a terminal "failed" state and return the commit message (null = give up, nothing to push)
 * @returns {Promise<{pushed:boolean, downgraded:string|null, committed:boolean}>}
 */
async function commitAndPush({ git, files, message, author, success, revalidate, fallback, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), maxAttempts = 3, queueFile = "data/refresh-queue.json", log = console.log }) {
  git(["add", "--", ...files]);
  if (git(["diff", "--cached", "--quiet"]).status === 0) {
    log("No changes to commit.");
    return { pushed: false, downgraded: null, committed: false };
  }
  const commit = git(["commit", "-m", message, ...(author ? ["--author", author] : [])]);
  if (commit.status !== 0) throw new Error(`git commit failed: ${commit.stderr.trim()}`);
  let base = git(["rev-parse", "HEAD~1"]).stdout.trim();
  let ok = success;
  let downgraded = null;

  const downgrade = (reason) => {
    git(["reset", "--hard", "origin/main"]);
    const msg = fallback ? fallback(reason) : null;
    if (!msg) return false;
    git(["add", "--", queueFile]);
    const c = git(["commit", "-m", msg, ...(author ? ["--author", author] : [])]);
    if (c.status !== 0) throw new Error(`git commit failed: ${c.stderr.trim()}`);
    ok = false;
    downgraded = reason;
    log(`Downgraded to a queue-only failed commit: ${reason}`);
    return true;
  };

  for (let i = 1; i <= maxAttempts; i++) {
    const f = git(["fetch", "--no-tags", "origin", "main"], { auth: true });
    if (f.status === 0) {
      const remote = git(["rev-parse", "origin/main"]).stdout.trim();
      if (remote !== base) {
        log(`main moved (${base.slice(0, 8)} -> ${remote.slice(0, 8)}): rebasing (attempt ${i}/${maxAttempts})`);
        const rb = git(["rebase", "origin/main"]);
        let reason = null;
        if (rb.status !== 0) {
          git(["rebase", "--abort"]);
          reason = "rebase conflict with a moved main";
        } else if (ok && revalidate) {
          const v = await revalidate("origin/main");
          if (!v.ok) reason = `revalidation after rebase failed: ${v.reason || "see log"}`;
        }
        if (reason && !downgrade(reason)) return { pushed: false, downgraded: reason, committed: true };
        base = remote;
      }
    } else {
      log(`fetch failed (attempt ${i}/${maxAttempts}): ${f.stderr.trim()}`);
    }
    const p = git(["push", "origin", "HEAD:main"], { auth: true });
    if (p.status === 0) return { pushed: true, downgraded, committed: true };
    log(`Push rejected (attempt ${i}/${maxAttempts}): ${p.stderr.trim().slice(0, 200)}`);
    if (i < maxAttempts) await sleep(i * 10000);
  }
  return { pushed: false, downgraded, committed: true };
}

function defaultRevalidate(slug, root = ROOT) {
  return async (ref) => {
    const env = { ...process.env };
    delete env.PUSH_TOKEN;
    const run = (cmd, args) => spawnSync(cmd, args, { cwd: root, env: { ...env, SLUG: slug }, stdio: "inherit" });
    const v = run(process.execPath, ["scripts/validate-refreshed-article.js", "--slug", slug, "--base", ref]);
    if (v.status !== 0) return { ok: false, reason: "slug validator" };
    const g = run("bash", ["scripts/article-gate.sh"]);
    if (g.status !== 0) return { ok: false, reason: "article gate" };
    return { ok: true };
  };
}

function defaultRestore(files, root = ROOT) {
  const r = spawnSync("git", ["checkout", "--", ...files], { cwd: root, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git checkout failed: ${(r.stderr || "").trim()}`);
}

/**
 * @returns {Promise<{status:"done"|"failed"|"none", slug:string|null, reason:string, pushed:boolean, downgraded:string|null}>}
 */
async function finalize({
  env = process.env,
  root = ROOT,
  queuePath = QUEUE_PATH,
  runPath = RUN_PATH,
  logDir = LOG_DIR,
  now = new Date(),
  commit = false,
  git,
  restore = defaultRestore,
  revalidate,
  sleep,
  author = "samuelhalff <660062+samuelhalff@users.noreply.github.com>",
  log = console.log,
} = {}) {
  const today = isoToday(now);
  const run = readRun(runPath);
  const slug = run.slug || "";
  if (!slug) {
    log("Nothing was picked: nothing to finalize.");
    return { status: "none", slug: null, reason: "", pushed: false, downgraded: null };
  }
  const verdict = evaluateOutcomes(env, run, logDir);
  const translationFiles = LOCALES.map((l) => `src/translations/${l}/ressources.json`);
  const queueFile = path.relative(root, queuePath) || "data/refresh-queue.json";

  const q = loadQueue(queuePath);
  if (verdict.ok) {
    markDone(q, slug, today);
    log(`${slug}: done.`);
  } else {
    restore(translationFiles, root); // the refresh and the link fixer only touch these
    markFailed(q, slug, today, verdict.reason);
    log(`${slug}: failed (${verdict.reason}); translations restored.`);
  }
  saveQueue(q, queuePath);

  const out = { status: verdict.ok ? "done" : "failed", slug, reason: verdict.reason, pushed: false, downgraded: null };
  if (!commit) return out;

  const message = verdict.ok ? `chore(ressources): refresh article ${slug}` : `chore(ressources): refresh article ${slug} failed (queue only) [skip ci]`;
  const res = await commitAndPush({
    git,
    files: verdict.ok ? [...translationFiles, queueFile] : [queueFile],
    message,
    author,
    success: verdict.ok,
    revalidate: revalidate || defaultRevalidate(slug, root),
    fallback: (reason) => {
      const fresh = loadQueue(queuePath); // origin's queue after the hard reset
      markFailed(fresh, slug, today, reason);
      saveQueue(fresh, queuePath);
      return `chore(ressources): refresh article ${slug} failed (queue only) [skip ci]`;
    },
    sleep,
    queueFile,
    log,
  });
  out.pushed = res.pushed;
  out.downgraded = res.downgraded;
  if (res.downgraded) out.status = "failed";
  if (res.committed && !res.pushed) out.error = "push failed after 3 attempts";
  return out;
}

/**
 * Pushes the claim (queue only, "[skip ci]"). Returns true only when the claim
 * is on origin; the caller must abort WITHOUT calling the model otherwise, so
 * the attempt cap holds even if the job is killed later.
 */
async function claim({ git, root = ROOT, queuePath = QUEUE_PATH, runPath = RUN_PATH, author, sleep, log = console.log }) {
  const queueFile = path.relative(root, queuePath) || "data/refresh-queue.json";
  const saved = fs.readFileSync(queuePath);
  try {
    const slug = readRun(runPath).slug || "";
    const res = await commitAndPush({
      git, files: [queueFile], message: `chore(ressources): claim refresh of ${slug} [skip ci]`, author, success: false, fallback: null, sleep, queueFile, log,
    });
    if (res.pushed) return true;
    log("Claim not pushed: aborting before any model call.");
    // Drop our local claim commit unless a rebase conflict already reset us to origin/main.
    if (res.committed && !res.downgraded) {
      git(["reset", "--hard", "HEAD~1"]);
      fs.writeFileSync(queuePath, saved);
    }
    return false;
  } catch (e) {
    log(`Claim failed (${e.message}); aborting before any model call.`);
    return false;
  }
}

/** Pushes the terminal queue state written by pickNext (e.g. a capped slug marked failed). */
async function pushQueueState({ git, root = ROOT, queuePath = QUEUE_PATH, author, sleep, log = console.log }) {
  const queueFile = path.relative(root, queuePath) || "data/refresh-queue.json";
  const res = await commitAndPush({
    git, files: [queueFile], message: "chore(ressources): refresh queue update (queue only) [skip ci]", author, success: false, fallback: null, sleep, queueFile, log,
  });
  return !res.committed || res.pushed;
}

function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) fs.appendFileSync(file, `${name}=${String(value ?? "")}\n`);
}

async function main(argv) {
  const has = (f) => argv.includes(f);
  const commit = has("--commit");
  if (has("--pick")) {
    const r = pickNext();
    const git = commit ? makeGit(ROOT, process.env.PUSH_TOKEN) : undefined;
    delete process.env.PUSH_TOKEN;
    if (commit) {
      const ok = r.status === "picked" ? await claim({ git }) : await pushQueueState({ git });
      if (!ok) {
        console.error("❌ queue state could not be pushed; aborting (no model call).");
        process.exit(1);
      }
    }
    setOutput("refresh_status", r.status);
    setOutput("refresh_slug", r.slug);
    return;
  }
  if (has("--refresh")) {
    const r = await runRefreshStep();
    if (!r.ok) process.exit(1);
    return;
  }
  if (has("--finalize")) {
    const git = commit ? makeGit(ROOT, process.env.PUSH_TOKEN) : undefined;
    delete process.env.PUSH_TOKEN;
    const r = await finalize({ commit, git });
    setOutput("final_status", r.status);
    setOutput("pushed", r.pushed);
    if (r.error) {
      console.error(`❌ ${r.error}`);
      process.exit(1);
    }
    return;
  }
  console.error("usage: refresh-next-article.js --pick [--commit] | --refresh | --finalize [--commit]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(`❌ ${e && e.message ? e.message : e}`);
    process.exit(1);
  });
}

module.exports = {
  MAX_ATTEMPTS,
  STEPS,
  claim,
  pushQueueState,
  commitAndPush,
  evaluateOutcomes,
  finalize,
  loadQueue,
  markDone,
  markFailed,
  pickNext,
  pickOldestStale,
  runRefreshStep,
};
