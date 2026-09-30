"use strict";

/**
 * Keyword & trend research for the Ridger article pipeline.
 *
 * Runs BEFORE any writing: for each locale we query autocomplete (Google, else
 * Bing, else DuckDuckGo — Google blocks datacenter IPs such as GitHub Actions
 * runners) in the markets that matter for Ridger (Swiss first, then the large
 * same-language market), then derive a primary keyword, 5–10 secondary keywords and the
 * question-style queries people actually type. Everything network-facing is
 * best-effort: a failed or blocked request yields no suggestions and the
 * derivation falls back to the item's pre-researched keywords
 * (researchedKeywords, from scripts/refresh-keywords.js), then to the backlog's
 * hypothesised keywords — research can degrade, it never fails the run.
 *
 * Pure parts (parseAutocompleteResponse, deriveKeywords, …) are unit-tested in
 * scripts/article-pipeline.test.js.
 */

const LOCALES = ["fr", "en", "de", "es", "pt"];

// Markets per locale: hl = interface language, gl = country bias.
const AUTOCOMPLETE_MARKETS = {
  fr: [
    { hl: "fr", gl: "ch", weight: 1.5 },
    { hl: "fr", gl: "fr", weight: 1 },
  ],
  en: [
    { hl: "en", gl: "gb", weight: 1.2 },
    { hl: "en", gl: "us", weight: 1 },
  ],
  de: [
    { hl: "de", gl: "ch", weight: 1.5 },
    { hl: "de", gl: "de", weight: 1 },
  ],
  es: [{ hl: "es", gl: "es", weight: 1 }],
  pt: [
    { hl: "pt-PT", gl: "pt", weight: 1.2 },
    { hl: "pt-BR", gl: "br", weight: 1 },
  ],
};

// Question prefixes used to expand the seed ("comment <seed>" …). Autocomplete
// is prefix-based, so these surface the real questions around a topic.
const QUESTION_PREFIXES = {
  fr: ["comment", "pourquoi", "quel", "quelles", "faut-il"],
  en: ["how", "what", "why", "which", "can"],
  de: ["wie", "was", "warum", "welche", "muss"],
  es: ["cómo", "qué", "por qué", "cuándo", "cuál"],
  pt: ["como", "o que", "porque", "quando", "qual"],
};

// Suffix expansion ("rachat lpp comment" → "rachat lpp comment déclarer")
// surfaces far more real questions than prefixes do.
const QUESTION_SUFFIXES = {
  fr: ["comment", "quand", "pourquoi", "c'est quoi"],
  en: ["how", "when", "why", "what is"],
  de: ["wie", "wann", "warum", "was ist"],
  es: ["cómo", "cuándo", "por qué", "qué es"],
  pt: ["como", "quando", "porque", "o que é"],
};

const QUESTION_TOKEN = {
  fr: /\b(comment|pourquoi|quand|quel|quelle|quels|quelles|c'?est quoi|est-ce)\b/,
  en: /\b(how|why|when|what|which|can i|do i|should i)\b/,
  de: /\b(wie|warum|wann|was ist|welche|welcher|muss ich|kann ich)\b/,
  es: /\b(como|cómo|por que|por qué|cuando|cuándo|que es|qué es|cual|cuál)\b/,
  pt: /\b(como|porque|por que|quando|o que e|o que é|qual|quais)\b/,
};

const QUESTION_START = {
  fr: /^(comment|pourquoi|quel|quelle|quels|quelles|qui|quand|où|ou|est-ce|faut-il|peut-on|doit-on|qu'est-ce|que|quoi)\b/,
  en: /^(how|what|why|when|which|who|where|can|do|does|is|are|should|will)\b/,
  de: /^(wie|was|warum|wann|welche|welcher|welches|wer|wo|kann|muss|darf|ist|sind|braucht)\b/,
  es: /^(cómo|como|qué|que|por qué|porque|cuándo|cuando|cuál|cual|quién|dónde|donde|se puede|es)\b/,
  pt: /^(como|o que|porque|por que|quando|qual|quais|quem|onde|pode|é)\b/,
};

// Never target pricing / navigational / job-seeker / low-intent queries.
const EXCLUDE_PATTERNS = [
  // prices & fees — Ridger never publishes pricing
  /\b(prix|co[uû]ts?|tarifs?|combien co[uû]te|pas cher|gratuit|devis)\b/,
  /\b(price|prices|pricing|cost|costs|fees?|cheap|free|quote|how much)\b/,
  /\b(preis|preise|kosten|kostenlos|gebühr|gebühren|offerte|günstig)\b/,
  /\b(precio|precios|coste|costo|tarifa|gratis|barato|presupuesto|cu[aá]nto cuesta)\b/,
  /\b(pre[cç]o|pre[cç]os|custo|custos|gr[aá]tis|barato|or[cç]amento|quanto custa)\b/,
  // navigational / low intent
  /\b(pdf|reddit|wikipedia|wiki|youtube|forum|login|connexion|anmelden|facebook|linkedin|instagram|tiktok)\b/,
  // tool intent (calculators/simulators) — not an article query
  /\b(rechner|calculator|calculateur|calculette|simulateur|simulator|simulador|calculadora)\b/,
  // dictionary / word-game / printable intent — not an article query
  /\b(mots? fl[eé]ch[eé]s|mots? crois[eé]s|synonymes?|synonyms?|crossword|kreuzwortr[aä]tsel|sin[oó]nimos?|sin[oô]nimos?|palavras cruzadas|crucigramas?|traduction|translation|[uü]bersetzung|traducci[oó]n|tradu[cç][aã]o|meaning|[aà] imprimer|printable|zum ausdrucken)\b/,
  // off-market jurisdictions surfaced by Bing/DuckDuckGo market drift
  /\b(canada|australia|new zealand|nederland|netherlands|vlaamse|vlaanderen|canarias|andaluc[ií]a|andaluza|cabildo|catalunya|galicia|junta de|brasil|brazil|india|nigeria|pakistan|philippines)\b/,
  // template artefacts ("… what is $sp")
  /\$/,
  // job seekers
  /\b(emploi|emplois|offre d'emploi|job|jobs|stellen|stellenangebote|empleo|empleos|vagas|salary jobs)\b/,
  // US-person structuring — out of scope for Ridger
  /\b(us person|fatca|irs|green card|us trust|trust am[eé]ricain)\b/,
];

const STOP_WORDS = new Set([
  // fr
  "le", "la", "les", "un", "une", "des", "de", "du", "d", "l", "et", "ou", "en", "au", "aux", "a", "à", "pour", "par", "sur", "dans", "avec", "sans", "est", "que", "qui", "quoi", "son", "sa", "ses", "se",
  // en
  "the", "an", "and", "or", "of", "to", "in", "for", "on", "with", "by", "is", "are", "my", "your", "from", "at",
  // de
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "und", "oder", "in", "im", "für", "mit", "von", "zu", "auf", "am", "bei",
  // es / pt
  "el", "los", "las", "del", "y", "o", "para", "por", "con", "sin", "al", "em", "na", "no", "nos", "nas", "da", "do", "das", "dos", "e", "um", "uma", "com",
]);

function stripAccents(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function normalizeKeyword(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[“”"«»()[\]{}|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function significantTokens(input) {
  return stripAccents(normalizeKeyword(input))
    .split(/[^a-z0-9]+/)
    .filter((t) => t && t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Loose keyword presence: every significant token of `keyword` appears in
 * `text` (accent-insensitive, simple plural tolerance). Used by the SEO checks
 * to verify placement in title / meta / H2s without demanding exact phrasing.
 */
function containsKeywordLoosely(text, keyword, minRatio = 1) {
  const tokens = significantTokens(keyword);
  if (!tokens.length) return false;
  const hay = ` ${stripAccents(normalizeKeyword(text)).replace(/[^a-z0-9]+/g, " ")} `;
  const hits = tokens.filter((t) => {
    const stem = t.length > 4 ? t.replace(/(s|x|en|es|e|n)$/, "") : t;
    return hay.includes(` ${t} `) || hay.includes(` ${stem}`);
  }).length;
  return hits / tokens.length >= minRatio;
}

function slugify(input, maxLength = 80) {
  const slug = stripAccents(normalizeKeyword(input))
    .replace(/'/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  if (slug.length <= maxLength) return slug;
  return slug.slice(0, maxLength).replace(/-[^-]*$/, "");
}

function buildAutocompleteUrl(query, { hl, gl }) {
  const params = new URLSearchParams({
    client: "firefox",
    hl,
    gl,
    ie: "utf-8",
    oe: "utf-8",
    q: query,
  });
  return `https://suggestqueries.google.com/complete/search?${params.toString()}`;
}

/**
 * The firefox client returns `["query", ["s1", "s2", …], …]`. Anything else
 * (HTML consent page, empty body, rate-limit) yields [].
 */
function parseAutocompleteResponse(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data) || !Array.isArray(data[1])) return [];
  return data[1]
    .map((s) => (typeof s === "string" ? normalizeKeyword(s) : ""))
    .filter(Boolean);
}

/** DuckDuckGo returns `[{ "phrase": "…" }, …]`. Anything else yields []. */
function parseDuckDuckGoResponse(raw) {
  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(data)) return [];
  return data
    .map((x) => (x && typeof x.phrase === "string" ? normalizeKeyword(x.phrase) : ""))
    .filter(Boolean);
}

/** Bing market code: fr-CH, en-GB, de-DE, es-ES, pt-PT, pt-BR … */
function bingMarket({ hl, gl }) {
  return hl.includes("-") ? hl : `${hl}-${String(gl).toUpperCase()}`;
}

/** DuckDuckGo region code: ch-fr, fr-fr, uk-en, us-en, ch-de, de-de, es-es, pt-pt, br-pt. */
function ddgRegion({ hl, gl }) {
  const country = gl === "gb" ? "uk" : gl;
  return `${country}-${hl.split("-")[0]}`;
}

/**
 * Autocomplete providers in fallback order. Google suggestqueries blocks most
 * datacenter IPs (GitHub Actions runners get 403/429 or an HTML consent page),
 * so Bing and DuckDuckGo are tried when Google yields nothing for a locale.
 * `parse` returns null when the body is not the expected shape.
 */
const isJsonArray = (text) => {
  try {
    return Array.isArray(JSON.parse(text));
  } catch {
    return false;
  }
};
const AUTOCOMPLETE_PROVIDERS = {
  google: {
    url: buildAutocompleteUrl,
    parse: (text) => (isJsonArray(text) ? parseAutocompleteResponse(text) : null),
  },
  bing: {
    url: (query, market) =>
      `https://api.bing.com/osjson.aspx?${new URLSearchParams({ query, market: bingMarket(market) }).toString()}`,
    parse: (text) => (isJsonArray(text) ? parseAutocompleteResponse(text) : null),
  },
  duckduckgo: {
    url: (query, market) =>
      `https://duckduckgo.com/ac/?${new URLSearchParams({ q: query, kl: ddgRegion(market) }).toString()}`,
    parse: (text) => (isJsonArray(text) ? parseDuckDuckGoResponse(text) : null),
  },
};
const PROVIDER_ORDER = ["google", "bing", "duckduckgo"];

function buildResearchQueries(locale, { seed, targetKeywords = [] }) {
  const base = normalizeKeyword(seed);
  // Question expansion works best on the short head term ("rachat lpp"),
  // not on the full seed phrase (which yields ungrammatical echoes).
  const head = normalizeKeyword(targetKeywords[0] || seed);
  const queries = new Set();
  if (base) {
    queries.add(base);
    queries.add(`${base} `); // trailing space → "seed + next word" completions
  }
  if (head) {
    queries.add(head);
    queries.add(`${head} `);
    for (const prefix of QUESTION_PREFIXES[locale] || []) {
      queries.add(`${prefix} ${head}`);
    }
    for (const suffix of QUESTION_SUFFIXES[locale] || []) {
      queries.add(`${head} ${suffix}`);
    }
  }
  for (const kw of targetKeywords.slice(1, 3)) {
    const k = normalizeKeyword(kw);
    if (k && k !== base) queries.add(k);
  }
  return [...queries];
}

// Stale years ("… 2023") age badly; only the current and next year are kept.
function hasStaleYear(keyword, now = new Date()) {
  const y = now.getUTCFullYear();
  const years = String(keyword).match(/\b(19|20)\d{2}\b/g) || [];
  return years.some((yr) => Number(yr) !== y && Number(yr) !== y + 1);
}

function isExcluded(keyword, avoidTerms = []) {
  const k = normalizeKeyword(keyword);
  const plain = stripAccents(k);
  if (EXCLUDE_PATTERNS.some((re) => re.test(k) || re.test(plain))) return true;
  if (hasStaleYear(k)) return true;
  return avoidTerms.some((term) => {
    const t = stripAccents(normalizeKeyword(term));
    return t && new RegExp(`(^|[^a-z0-9])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(plain);
  });
}

const QUESTION_ANYWHERE = /\b(que es|qu'est-ce que|c'est quoi|what is|what are|was ist|was sind|o que e|o que é|como funciona|how does|how to|comment faire|wie funktioniert)\b/;

function isQuestion(keyword, locale) {
  const k = normalizeKeyword(keyword);
  if (k.endsWith("?")) return true;
  if (QUESTION_ANYWHERE.test(k) || QUESTION_ANYWHERE.test(stripAccents(k))) return true;
  const re = QUESTION_START[locale];
  if (re && re.test(k)) return true;
  const tok = QUESTION_TOKEN[locale];
  return tok ? tok.test(k) || tok.test(stripAccents(k)) : false;
}

// Autocomplete of a trailing-space query sometimes returns truncated tokens
// ("lppj", "202"): vowel-less tokens of 4+ letters or 3-digit "20x" stubs.
function looksTruncated(keyword) {
  return String(keyword)
    .split(/\s+/)
    .some((t) => (/^[a-z]{4,}$/.test(t) && !/[aeiouy]/.test(t)) || /^20\d$/.test(t));
}

function jaccard(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/**
 * Derive keywords for one locale from raw autocomplete results.
 *
 * @param {string} locale
 * @param {object} input
 * @param {string} input.seed — backlog seed for this locale
 * @param {string[]} [input.targetKeywords] — backlog hypotheses (fallback + boost)
 * @param {Array<{query:string, market:{hl,gl,weight}, suggestions:string[]}>} input.results
 * @param {string[]} [input.avoidTerms] — ark-fid.ch core terms (cannibalisation guard)
 * @returns {{primary:string, secondary:string[], questions:string[], stats:object}}
 */
function deriveKeywords(locale, input) {
  const {
    seed = "",
    targetKeywords = [],
    results = [],
    avoidTerms = [],
    minSecondary = 5,
    maxSecondary = 10,
  } = input || {};
  const seedTokens = significantTokens(seed);
  const targets = targetKeywords.map(normalizeKeyword).filter(Boolean);
  const scores = new Map();

  const add = (kw, weight) => {
    const k = normalizeKeyword(kw).replace(/\?$/, "").trim();
    if (!k || k.length > 80) return;
    const words = k.split(" ").length;
    if (words < 2 || words > 9) return;
    if (isExcluded(k, avoidTerms)) return;
    const tokens = significantTokens(k);
    // Relevance: must share at least one significant token with the seed or
    // a target keyword — autocomplete drifts fast otherwise.
    const anchorTokens = new Set([...seedTokens, ...targets.flatMap(significantTokens)]);
    const overlap = tokens.filter((t) => anchorTokens.has(t)).length;
    if (!overlap) return;
    const entry = scores.get(k) || { keyword: k, score: 0, hits: 0, overlap };
    entry.score += weight * (1 + overlap * 0.25);
    entry.hits += 1;
    scores.set(k, entry);
  };

  let suggestionCount = 0;
  for (const r of results) {
    const weight = r?.market?.weight || 1;
    const list = Array.isArray(r?.suggestions) ? r.suggestions : [];
    const query = normalizeKeyword(r?.query || "");
    const questionQuery = (QUESTION_PREFIXES[locale] || []).some((p) => query.startsWith(`${p} `));
    list.forEach((s, idx) => {
      suggestionCount++;
      const sug = normalizeKeyword(s);
      if (sug === query) return; // plain echo
      // "<prefix> <head> <anything>" is an echo of our own expansion, not a
      // real question; genuine questions rephrase ("comment fonctionne …").
      if (questionQuery && sug.startsWith(query)) return;
      if (looksTruncated(sug)) return;
      // Earlier positions carry more demand.
      add(s, weight * (1 - Math.min(idx, 9) * 0.05));
    });
  }

  const ranked = [...scores.values()].sort(
    (a, b) => b.score - a.score || a.keyword.localeCompare(b.keyword),
  );

  // Primary keyword, in order of preference:
  //  1. a backlog target (head term) that autocomplete confirms — i.e. at
  //     least 2 suggestions contain all its tokens (evidence of demand);
  //  2. the best non-question suggestion, weighted by how much of the seed it
  //     covers and penalised for length (long tails make poor primaries);
  //  3. the first backlog target, else the seed.
  const allSuggestionTokens = ranked.map((e) => ({ e, tokens: new Set(significantTokens(e.keyword)) }));
  const targetDemand = targets
    .filter((t) => !isExcluded(t, avoidTerms))
    .map((t) => {
      const tt = significantTokens(t);
      const hits = allSuggestionTokens.filter((x) => tt.length && tt.every((tok) => x.tokens.has(tok)));
      return { t, demand: hits.reduce((sum, x) => sum + x.e.score, 0), count: hits.length };
    })
    .filter((x) => x.count >= 2)
    .sort((a, b) => b.demand - a.demand);
  const coverage = (k) => {
    if (!seedTokens.length) return 0;
    const kt = significantTokens(k);
    return seedTokens.filter((t) => kt.includes(t)).length / seedTokens.length;
  };
  const suggestionPrimary = ranked
    .filter((e) => !isQuestion(e.keyword, locale) && e.keyword.split(" ").length <= 5 && coverage(e.keyword) >= 0.5)
    .map((e) => ({ e, v: e.score * coverage(e.keyword) ** 2 / Math.max(1, e.keyword.split(" ").length - 2) }))
    .sort((a, b) => b.v - a.v)[0];
  const primary =
    (targetDemand[0] && normalizeKeyword(targetDemand[0].t)) ||
    (suggestionPrimary && suggestionPrimary.e.keyword) ||
    targets.find((t) => !isExcluded(t, avoidTerms)) ||
    normalizeKeyword(seed);

  const secondary = [];
  const questions = [];
  // Near-duplicates: same token set, one-token variants of equal length
  // (location/brand swaps like "… geneve" / "… carouge"), or Jaccard ≥ 0.8.
  // Long-tail EXTENSIONS of the primary ("rachat lpp conditions") are kept.
  const tooClose = (k, list) => {
    const kt = significantTokens(k);
    return list.some((x) => {
      const xt = significantTokens(x);
      const j = jaccard(xt, kt);
      if (j >= 0.8) return true;
      if (xt.length === kt.length && xt.length >= 3 && kt.filter((t) => xt.includes(t)).length === kt.length - 1) return true;
      return false;
    });
  };
  const primaryTokens = significantTokens(primary).sort().join(" ");

  for (const e of ranked) {
    if (e.keyword === primary || significantTokens(e.keyword).sort().join(" ") === primaryTokens) continue;
    if (isQuestion(e.keyword, locale)) {
      if (questions.length < 8 && !tooClose(e.keyword, questions)) questions.push(e.keyword);
      continue;
    }
    if (secondary.length >= maxSecondary) continue;
    if (tooClose(e.keyword, secondary)) continue;
    secondary.push(e.keyword);
  }
  // Top up from the backlog hypotheses, then from questions, to reach the minimum.
  for (const t of targets) {
    if (secondary.length >= minSecondary) break;
    if (t === primary || isExcluded(t, avoidTerms) || tooClose(t, [primary, ...secondary])) continue;
    secondary.push(t);
  }
  // Last resort (autocomplete blocked/offline): the seed phrase itself.
  const seedKw = normalizeKeyword(seed);
  if (secondary.length < minSecondary && seedKw && seedKw !== primary && !isExcluded(seedKw, avoidTerms) && !secondary.includes(seedKw)) {
    secondary.push(seedKw);
  }
  for (const q of questions) {
    if (secondary.length >= minSecondary) break;
    if (!secondary.includes(q)) secondary.push(q);
  }

  return {
    primary,
    secondary: secondary.slice(0, maxSecondary),
    questions,
    stats: {
      queries: results.length,
      suggestions: suggestionCount,
      uniqueCandidates: ranked.length,
      source: ranked.length ? "autocomplete" : "backlog-fallback",
    },
  };
}

/**
 * Make keyword arrays structurally identical across locales (the build's
 * key-parity check compares FR and each locale index by index).
 */
function alignKeywordSets(byLocale, { min = 5, max = 10 } = {}) {
  const locales = Object.keys(byLocale);
  const counts = locales.map((l) => (byLocale[l]?.secondary || []).length);
  const n = Math.max(0, Math.min(max, ...counts));
  const out = {};
  for (const l of locales) {
    out[l] = {
      primary: byLocale[l].primary,
      secondary: (byLocale[l].secondary || []).slice(0, n),
    };
  }
  return { aligned: out, count: n, ok: n >= min };
}

async function fetchWithTimeout(url, { timeoutMs = 6000, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
        Accept: "application/json,text/plain,*/*",
        ...headers,
      },
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } finally {
    clearTimeout(timer);
  }
}

const offline = () => process.env.OFFLINE_MODE === "1";
function marketLabel(m) {
  return m.hl.includes("-") ? m.hl : `${m.hl}-${m.gl.toUpperCase()}`;
}

/**
 * One autocomplete request. Never throws: `{ suggestions, error }` where
 * error is e.g. "HTTP 429", "timeout", "unparseable body" (consent page).
 */
async function fetchAutocompleteDetailed(query, market, { fetcher, provider = "google" } = {}) {
  if (!fetcher && offline()) return { suggestions: [], error: null };
  fetcher = fetcher || fetchWithTimeout;
  const p = AUTOCOMPLETE_PROVIDERS[provider];
  try {
    const res = await fetcher(p.url(query, market));
    if (!res.ok) return { suggestions: [], error: `HTTP ${res.status}` };
    const suggestions = p.parse(res.text);
    return suggestions ? { suggestions, error: null } : { suggestions: [], error: "unparseable body" };
  } catch (err) {
    const msg = err && err.name === "AbortError" ? "timeout" : String((err && err.message) || err);
    return { suggestions: [], error: msg.slice(0, 60) };
  }
}

async function fetchAutocomplete(query, market, opts = {}) {
  return (await fetchAutocompleteDetailed(query, market, opts)).suggestions;
}

/** "HTTP 429 ×10, timeout ×2 (fr-CH, fr-FR)" — one line per provider; "" when no errors. */
function summarizeErrors(rows) {
  const counts = new Map();
  const markets = new Set();
  for (const r of rows) {
    if (!r.error) continue;
    counts.set(r.error, (counts.get(r.error) || 0) + 1);
    markets.add(marketLabel(r.market));
  }
  if (!counts.size) return "";
  return `${[...counts].map(([e, n]) => `${e} ×${n}`).join(", ")} (${[...markets].join(", ")})`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const newResearchState = () => ({ blocked: new Set() });

/**
 * Query providers in fallback order until one returns suggestions. A provider
 * whose every request failed is marked blocked in `state` and skipped for the
 * remaining locales. Errors are logged once per provider and locale. Never throws.
 */
async function collectAutocomplete(locale, queries, { fetcher, delayMs = 0, log = () => {}, state = newResearchState(), providers = PROVIDER_ORDER } = {}) {
  const markets = AUTOCOMPLETE_MARKETS[locale] || [];
  const attempts = [];
  for (const provider of providers) {
    if (state.blocked.has(provider)) {
      attempts.push({ provider, skipped: "blocked" });
      continue;
    }
    const results = [];
    for (const market of markets) {
      for (const query of queries) {
        const started = Date.now();
        const { suggestions, error } = await fetchAutocompleteDetailed(query, market, { fetcher, provider });
        results.push({ query, market, suggestions, error, provider });
        // Spacing between request starts (polite rate limit), not an extra pause.
        if (delayMs) await sleep(Math.max(0, delayMs - (Date.now() - started)));
      }
    }
    const count = results.reduce((n, r) => n + r.suggestions.length, 0);
    const failed = results.filter((r) => r.error).length;
    if (failed) log(`   ${locale}: ${provider} ${failed}/${results.length} requests failed — ${summarizeErrors(results)}`);
    attempts.push({ provider, requests: results.length, suggestions: count, failed });
    if (results.length && failed === results.length) state.blocked.add(provider);
    if (count > 0) return { provider, results, attempts };
  }
  return { provider: null, results: [], attempts };
}

/**
 * Live research for one locale. Never throws.
 */
async function researchLocaleKeywords(locale, { seed, targetKeywords = [], avoidTerms = [], delayMs = offline() ? 0 : 120, fetcher, log, state } = {}) {
  const markets = AUTOCOMPLETE_MARKETS[locale] || [];
  const queries = buildResearchQueries(locale, { seed, targetKeywords });
  const { provider, results, attempts } = await collectAutocomplete(locale, queries, { fetcher, delayMs, log, state });
  const derived = deriveKeywords(locale, { seed, targetKeywords, results, avoidTerms });
  if (derived.stats.source === "autocomplete") derived.stats.source = `autocomplete:${provider}`;
  derived.stats.provider = provider;
  derived.stats.attempts = attempts;
  return { ...derived, markets: markets.map(marketLabel) };
}

/**
 * Stored (pre-researched) keywords for a locale, written by
 * scripts/refresh-keywords.js: item.researchedKeywords.perLocale[locale].
 */
function storedLocaleKeywords(item, locale, { avoidTerms = [], minSecondary = 5 } = {}) {
  const rk = item && item.researchedKeywords;
  const s = rk && rk.perLocale && rk.perLocale[locale];
  if (!s || !s.primary) return null;
  // Re-apply the current filters (they may be stricter than when stored).
  const list = (v) => (Array.isArray(v) ? v.map(normalizeKeyword).filter((k) => k && !isExcluded(k, avoidTerms)) : []);
  const primary = normalizeKeyword(s.primary);
  const secondary = list(s.secondary);
  // Top up from the backlog targets so the cross-locale alignment floor holds.
  for (const t of (item.targetKeywords && item.targetKeywords[locale]) || []) {
    const k = normalizeKeyword(t);
    if (secondary.length >= minSecondary) break;
    if (k && k !== primary && !secondary.includes(k) && !isExcluded(k, avoidTerms)) secondary.push(k);
  }
  return { primary, secondary, questions: list(s.questions), date: rk.date || "?" };
}

/**
 * Keyword research for every locale. Source per locale, in order:
 *  1. live autocomplete (Google → Bing → DuckDuckGo) when it yields candidates;
 *  2. item.researchedKeywords (pre-researched from a normal machine);
 *  3. the backlog seeds/targetKeywords (deriveKeywords fallback).
 * `stats.source` says which one was used. Never throws.
 */
async function researchAllLocales(item, { avoidTermsByLocale = {}, fetcher, delayMs, log, state = newResearchState(), useStored = true } = {}) {
  const out = {};
  for (const locale of LOCALES) {
    const live = await researchLocaleKeywords(locale, {
      seed: item?.seeds?.[locale] || item?.seeds?.fr || "",
      targetKeywords: item?.targetKeywords?.[locale] || [],
      avoidTerms: avoidTermsByLocale[locale] || [],
      fetcher,
      delayMs,
      log,
      state,
    });
    const stored = useStored && !live.stats.uniqueCandidates
      ? storedLocaleKeywords(item, locale, { avoidTerms: avoidTermsByLocale[locale] || [] })
      : null;
    if (stored && stored.secondary.length) {
      out[locale] = {
        primary: stored.primary,
        secondary: stored.secondary,
        questions: stored.questions,
        stats: { ...live.stats, source: `stored ${stored.date}` },
        markets: live.markets,
      };
    } else {
      out[locale] = live;
    }
  }
  return out;
}

/**
 * Cheap demand probe used to choose between the top backlog candidates:
 * number of relevant autocomplete suggestions for the FR seed in fr-CH + fr-FR.
 * Uses the first provider that answers (a blocked Google falls through to
 * Bing, then DuckDuckGo) so candidates stay comparable within one run.
 */
async function probeDemand(item, { fetcher, avoidTerms = [], state = newResearchState(), log = () => {} } = {}) {
  const seed = item?.seeds?.fr;
  if (!seed) return 0;
  for (const provider of PROVIDER_ORDER) {
    if (state.blocked.has(provider)) continue;
    let total = 0;
    const rows = [];
    for (const market of AUTOCOMPLETE_MARKETS.fr) {
      for (const q of [normalizeKeyword(seed), `${normalizeKeyword(seed)} `]) {
        const r = await fetchAutocompleteDetailed(q, market, { fetcher, provider });
        rows.push({ ...r, market });
        total += r.suggestions.filter((s) => !isExcluded(s, avoidTerms)).length * market.weight;
      }
    }
    if (rows.some((r) => !r.error)) return total;
    state.blocked.add(provider);
    log(`   demand probe: ${provider} blocked — ${summarizeErrors(rows)}`);
  }
  return 0;
}

function decodeXmlEntities(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

/**
 * Parse Google Trends' daily trending RSS into plain titles.
 */
function parseTrendingRss(xml) {
  const titles = [];
  for (const m of String(xml || "").matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>/g)) {
    const t = normalizeKeyword(decodeXmlEntities(m[1]));
    if (t) titles.push(t);
  }
  return titles;
}

/**
 * Best-effort trend signal. Google Trends has no official API: we read the
 * public "trending now" RSS for Switzerland (FR + DE) and flag overlaps with
 * the article's keywords. Any failure → { available: false }. Never throws.
 */
async function fetchTrendSignal(keywordsByLocale, { fetcher } = {}) {
  if (!fetcher && offline()) return { available: false, checked: 0, matches: [] };
  fetcher = fetcher || fetchWithTimeout;
  const feeds = [
    { geo: "CH", hl: "fr" },
    { geo: "CH", hl: "de" },
  ];
  const trending = [];
  let available = false;
  for (const f of feeds) {
    try {
      const res = await fetcher(
        `https://trends.google.com/trending/rss?geo=${f.geo}&hl=${f.hl}`,
        { timeoutMs: 8000 },
      );
      if (res.ok) {
        available = true;
        trending.push(...parseTrendingRss(res.text));
      }
    } catch {
      // ignore — trend signal is optional
    }
  }
  const matches = matchTrending(trending, keywordsByLocale);
  return { available, checked: trending.length, matches };
}

function matchTrending(trendingTitles, keywordsByLocale) {
  const kwTokens = new Set();
  for (const loc of Object.keys(keywordsByLocale || {})) {
    const k = keywordsByLocale[loc] || {};
    for (const kw of [k.primary, ...(k.secondary || [])]) {
      significantTokens(kw).filter((t) => t.length > 3).forEach((t) => kwTokens.add(t));
    }
  }
  return trendingTitles.filter((title) => {
    const tokens = significantTokens(title).filter((t) => t.length > 3);
    return tokens.filter((t) => kwTokens.has(t)).length >= 2;
  });
}

module.exports = {
  hasStaleYear,
  LOCALES,
  AUTOCOMPLETE_MARKETS,
  AUTOCOMPLETE_PROVIDERS,
  PROVIDER_ORDER,
  QUESTION_PREFIXES,
  QUESTION_SUFFIXES,
  looksTruncated,
  alignKeywordSets,
  bingMarket,
  buildAutocompleteUrl,
  collectAutocomplete,
  ddgRegion,
  fetchAutocompleteDetailed,
  newResearchState,
  parseDuckDuckGoResponse,
  storedLocaleKeywords,
  summarizeErrors,
  buildResearchQueries,
  containsKeywordLoosely,
  deriveKeywords,
  fetchAutocomplete,
  fetchTrendSignal,
  isExcluded,
  isQuestion,
  matchTrending,
  normalizeKeyword,
  parseAutocompleteResponse,
  parseTrendingRss,
  probeDemand,
  researchAllLocales,
  researchLocaleKeywords,
  significantTokens,
  slugify,
  stripAccents,
};
