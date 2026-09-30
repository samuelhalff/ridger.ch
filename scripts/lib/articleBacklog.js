"use strict";

/**
 * Backlog-driven topic picker for the Ridger article pipeline.
 *
 * data/article-backlog.json holds the editorial backlog (themes, seeds and
 * hypothesised keywords per locale). Published items are recognised by the
 * `backlogId` stored on each generated article, so the backlog never needs to
 * be edited by the bot. Hand-written articles that predate the pipeline carry
 * no backlogId; `legacyArticles` in the backlog maps their slug to a theme and
 * audience (and optionally the backlog item they cover), so theme rotation,
 * audience alternation and coverage tracking also see them.
 *
 * Diversity policy (enforced here AND re-checked on the finished article):
 *   - never the same category twice in a row
 *   - no theme repeated within the last THEME_WINDOW generated articles
 *   - skip items that near-duplicate an existing article (all-time check)
 *   - prefer categories under-represented in the last CATEGORY_WINDOW articles,
 *     seasonal items in their months, higher priority, and alternate audiences
 */

const fs = require("fs");
const path = require("path");
const { findAllTimeNearDuplicate } = require("./articleTopicGuardrails");

const ALLOWED_CATEGORIES = [
  "family-office",
  "reporting",
  "fiscalite",
  "patrimoine",
  "gouvernance",
  "emploi-domestique",
  "vie-pratique",
  "travaux-intendance",
];

const AUDIENCES = ["accessible", "affluent", "uhnw"];

const THEME_WINDOW = 4;
const CATEGORY_WINDOW = 8;

function loadBacklog(root = process.cwd()) {
  const file = path.join(root, "data", "article-backlog.json");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Newest first. Ties on date keep array order (later in the array = newer),
 * which is how the pipeline appends.
 */
function sortArticlesNewestFirst(articles) {
  return (Array.isArray(articles) ? articles : [])
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (y.a.date || "").localeCompare(x.a.date || "") || y.i - x.i)
    .map((x) => x.a);
}

function validateBacklog(backlog) {
  const problems = [];
  const items = Array.isArray(backlog?.items) ? backlog.items : [];
  const ids = new Set();
  for (const item of items) {
    if (!item.id || ids.has(item.id)) problems.push(`duplicate or missing id: ${item.id}`);
    ids.add(item.id);
    if (!ALLOWED_CATEGORIES.includes(item.category)) problems.push(`${item.id}: bad category ${item.category}`);
    if (!backlog.themes || !backlog.themes[item.theme]) problems.push(`${item.id}: unknown theme ${item.theme}`);
    for (const loc of ["fr", "en", "de", "es", "pt"]) {
      if (!item.seeds || !item.seeds[loc]) problems.push(`${item.id}: missing seed ${loc}`);
      if (!item.targetKeywords || !Array.isArray(item.targetKeywords[loc]) || !item.targetKeywords[loc].length) {
        problems.push(`${item.id}: missing targetKeywords ${loc}`);
      }
    }
  }
  const legacy = backlog?.legacyArticles || {};
  for (const [slug, entry] of Object.entries(legacy)) {
    if (!backlog.themes || !backlog.themes[entry?.theme]) problems.push(`legacy ${slug}: unknown theme ${entry?.theme}`);
    if (!AUDIENCES.includes(entry?.audience)) problems.push(`legacy ${slug}: bad audience ${entry?.audience}`);
    if (entry?.backlogId && !ids.has(entry.backlogId)) problems.push(`legacy ${slug}: unknown backlogId ${entry.backlogId}`);
  }
  return problems;
}

/**
 * Backlog view of an article: its backlog id (if any), theme and audience.
 * Generated articles carry `backlogId`; hand-written ones are resolved through
 * `backlog.legacyArticles[slug]`.
 */
function articleBacklogInfo(article, backlogById, legacyArticles = {}) {
  if (!article) return null;
  if (article.backlogId) {
    const item = backlogById.get(article.backlogId);
    return {
      backlogId: article.backlogId,
      theme: item ? item.theme : null,
      audience: item ? item.audience : null,
    };
  }
  const legacy = legacyArticles[article.slug];
  if (legacy) {
    const item = legacy.backlogId ? backlogById.get(legacy.backlogId) : null;
    return {
      backlogId: legacy.backlogId || null,
      theme: legacy.theme || (item ? item.theme : null),
      audience: legacy.audience || (item ? item.audience : null),
    };
  }
  return null;
}

function themeOfArticle(article, backlogById, legacyArticles) {
  return articleBacklogInfo(article, backlogById, legacyArticles)?.theme || null;
}

/**
 * Coverage/drift check: every article must be traceable to the backlog
 * (a backlogId, or a legacyArticles entry), and legacy entries must point to
 * existing articles. Returns a list of problems (empty = OK). Pure.
 */
function checkBacklogCoverage(backlog, articles) {
  const problems = [];
  const legacy = backlog?.legacyArticles || {};
  const slugs = new Set();
  for (const article of Array.isArray(articles) ? articles : []) {
    slugs.add(article.slug);
    if (!article.backlogId && !legacy[article.slug]) {
      problems.push(`article ${article.slug} has no backlogId and no legacyArticles entry`);
    }
    if (article.backlogId && legacy[article.slug]) {
      problems.push(`article ${article.slug} has both a backlogId and a legacyArticles entry`);
    }
  }
  for (const slug of Object.keys(legacy)) {
    if (!slugs.has(slug)) problems.push(`legacyArticles entry ${slug} matches no article`);
  }
  return problems;
}

function hashString(s) {
  let h = 2166136261;
  for (const ch of String(s)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Rank eligible backlog items. Pure.
 *
 * @param {object} args
 * @param {object} args.backlog
 * @param {object[]} args.articles — FR articles
 * @param {Date|string} [args.today]
 * @param {boolean} [args.skipRotation]
 * @returns {{ranked: Array<{item:object, score:number, reasons:string[]}>, excluded: Array<{id:string, reason:string}>, lastCategory:string|null}}
 */
function rankBacklogCandidates({ backlog, articles, today = new Date(), skipRotation = false }) {
  const items = Array.isArray(backlog?.items) ? backlog.items : [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const legacy = backlog?.legacyArticles || {};
  const sorted = sortArticlesNewestFirst(articles);
  const info = (a) => articleBacklogInfo(a, byId, legacy);
  const published = new Set(sorted.map((a) => info(a)?.backlogId).filter(Boolean));
  const lastCategory = sorted[0]?.category || null;
  const recentThemes = sorted
    .slice(0, THEME_WINDOW)
    .map((a) => themeOfArticle(a, byId, legacy))
    .filter(Boolean);
  const recentCategories = sorted.slice(0, CATEGORY_WINDOW).map((a) => a.category);
  const lastAudience = sorted.length ? info(sorted[0])?.audience || null : null;
  const month = (today instanceof Date ? today : new Date(today)).getUTCMonth() + 1;
  const dateKey = (today instanceof Date ? today : new Date(today)).toISOString().slice(0, 10);

  const ranked = [];
  const excluded = [];
  for (const item of items) {
    if (published.has(item.id)) {
      excluded.push({ id: item.id, reason: "already published" });
      continue;
    }
    if (!skipRotation && item.category === lastCategory) {
      excluded.push({ id: item.id, reason: `same category as last article (${lastCategory})` });
      continue;
    }
    if (!skipRotation && recentThemes.includes(item.theme)) {
      excluded.push({ id: item.id, reason: `theme ${item.theme} used in last ${THEME_WINDOW}` });
      continue;
    }
    const probe = {
      slug: item.id,
      title: (item.targetKeywords?.fr || []).slice(0, 2).join(" : ") || item.seeds?.fr || item.id,
      description: item.angle || "",
    };
    const dup = findAllTimeNearDuplicate(sorted, probe);
    if (dup) {
      excluded.push({ id: item.id, reason: `near-duplicate of ${dup.previousSlug}` });
      continue;
    }

    const reasons = [];
    let score = (4 - (item.priority || 3)) * 10;
    reasons.push(`priority ${item.priority || 3}`);
    if (Array.isArray(item.months) && item.months.includes(month)) {
      score += 12;
      reasons.push("seasonal");
    }
    const catUses = recentCategories.filter((c) => c === item.category).length;
    score += (CATEGORY_WINDOW - catUses) * 1.5;
    reasons.push(`category used ${catUses}× in last ${CATEGORY_WINDOW}`);
    if (lastAudience && item.audience && item.audience !== lastAudience) {
      score += 3;
      reasons.push("audience alternation");
    }
    // Small deterministic jitter so equal scores rotate day to day.
    score += hashString(`${dateKey}:${item.id}`) * 2;
    ranked.push({ item, score, reasons });
  }
  ranked.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
  return { ranked, excluded, lastCategory };
}

/**
 * Final choice among the top candidates, weighting in an observed demand
 * signal (autocomplete richness) when available. Pure.
 */
function chooseWithDemand(ranked, demandById = {}, { top = 3 } = {}) {
  const pool = ranked.slice(0, top);
  if (!pool.length) return null;
  const maxDemand = Math.max(0, ...pool.map((c) => demandById[c.item.id] || 0));
  let best = null;
  for (const c of pool) {
    const demand = demandById[c.item.id] || 0;
    const demandScore = maxDemand > 0 ? (demand / maxDemand) * 10 : 0;
    const total = c.score + demandScore;
    if (!best || total > best.total) best = { ...c, demand, total };
  }
  return best;
}

/**
 * Resolve a FORCE_TOPIC override: a backlog id, or free text turned into an
 * ad-hoc item (keywords/category optional).
 */
function resolveForcedTopic(backlog, { topic, keywords = [], category = "" }) {
  const t = String(topic || "").trim();
  if (!t) return null;
  const hit = (backlog?.items || []).find((i) => i.id === t);
  if (hit) return hit;
  const kws = keywords.length ? keywords : [t];
  return {
    id: `adhoc-${t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}`,
    theme: "adhoc",
    category: ALLOWED_CATEGORIES.includes(category) ? category : "family-office",
    audience: "affluent",
    priority: 1,
    service: "/services/family-office-coordination",
    angle: t,
    seeds: { fr: t, en: t, de: t, es: t, pt: t },
    targetKeywords: { fr: kws, en: kws, de: kws, es: kws, pt: kws },
    officialSources: [],
    adhoc: true,
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  AUDIENCES,
  articleBacklogInfo,
  checkBacklogCoverage,
  CATEGORY_WINDOW,
  THEME_WINDOW,
  chooseWithDemand,
  loadBacklog,
  rankBacklogCandidates,
  resolveForcedTopic,
  sortArticlesNewestFirst,
  validateBacklog,
};
