#!/usr/bin/env node
"use strict";

/**
 * Pre-research keywords for every todo (not yet published) backlog item and
 * store them in data/article-backlog.json as
 *   researchedKeywords: { date, perLocale: { <locale>: { primary, secondary[], questions[] } } }
 *
 * Run from a normal (non-datacenter) machine: Google autocomplete blocks
 * GitHub Actions runners, so the article pipeline falls back to these stored
 * results when live research comes back empty (see researchAllLocales).
 *
 *   npm run keywords:refresh                        # all todo items, best priority first
 *   npm run keywords:refresh -- --missing-only      # only items without researchedKeywords
 *   npm run keywords:refresh -- --id <backlog id>   # one item
 *   options: --max-minutes 20 (runtime cap), --interval-ms 300 (pause between requests)
 *
 * Each item is written as soon as it is researched, re-reading the backlog
 * from disk first so concurrent edits to other fields are never clobbered.
 * Locales where live research returned no candidates keep their stored value.
 */

const fs = require("fs");
const path = require("path");
const { loadBacklog, rankBacklogCandidates } = require("./lib/articleBacklog");
const { researchAllLocales, LOCALES } = require("./lib/keywordResearch");

const ROOT = path.join(__dirname, "..");
const BACKLOG_FILE = path.join(ROOT, "data", "article-backlog.json");

/** Pure: merge live research into item.researchedKeywords. Returns updated locales. */
function applyResearch(item, research, date) {
  const perLocale = { ...(item.researchedKeywords?.perLocale || {}) };
  const updated = [];
  for (const locale of Object.keys(research)) {
    const r = research[locale];
    if (!String(r?.stats?.source || "").startsWith("autocomplete") || !r.stats.uniqueCandidates) continue;
    perLocale[locale] = { primary: r.primary, secondary: r.secondary, questions: r.questions };
    updated.push(locale);
  }
  if (updated.length) item.researchedKeywords = { date, perLocale };
  return updated;
}

/** Todo = not yet published (rotation rules ignored), in pipeline rank order. */
function todoItems(backlog, frArticles) {
  const { ranked } = rankBacklogCandidates({ backlog, articles: frArticles, skipRotation: true });
  return ranked.map((r) => r.item);
}

function saveItemKeywords(id, researchedKeywords) {
  const text = fs.readFileSync(BACKLOG_FILE, "utf8");
  const backlog = JSON.parse(text);
  const item = backlog.items.find((i) => i.id === id);
  if (!item) return false;
  item.researchedKeywords = researchedKeywords;
  const tmp = `${BACKLOG_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(backlog, null, 2)}\n`);
  fs.renameSync(tmp, BACKLOG_FILE);
  return true;
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
  };
  const maxMinutes = Number(opt("--max-minutes", "20")) || 20;
  const intervalMs = Number(opt("--interval-ms", "300")) || 300;
  const onlyId = opt("--id", null);
  const missingOnly = argv.includes("--missing-only");

  const backlog = loadBacklog(ROOT);
  const fr = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "translations", "fr", "ressources.json"), "utf8"));
  const items = todoItems(backlog, Array.isArray(fr.Articles) ? fr.Articles : [])
    .filter((i) => !onlyId || i.id === onlyId)
    .filter((i) => !missingOnly || !i.researchedKeywords);
  const deadline = Date.now() + maxMinutes * 60_000;
  const date = new Date().toISOString().slice(0, 10);
  console.log(`[refresh-keywords] ${items.length} todo items, cap ${maxMinutes} min, ${intervalMs} ms between requests`);
  let done = 0;
  for (const item of items) {
    if (Date.now() > deadline) {
      console.log(`[refresh-keywords] runtime cap reached — ${items.length - done} items left (rerun with --missing-only)`);
      break;
    }
    const research = await researchAllLocales(item, {
      avoidTermsByLocale: backlog.arkCoreTerms || {},
      delayMs: intervalMs,
      useStored: false,
      log: (m) => console.log(m),
    });
    const updated = applyResearch(item, research, date);
    if (updated.length) saveItemKeywords(item.id, item.researchedKeywords);
    done++;
    const summary = LOCALES.map((l) => `${l}=${research[l].stats.provider || "none"}/${research[l].stats.uniqueCandidates}`).join(" ");
    console.log(`[${done}/${items.length}] ${item.id}: ${summary}${updated.length ? "" : " — nothing stored"}`);
  }
  console.log(`[refresh-keywords] refreshed ${done} item(s)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { applyResearch, todoItems };
