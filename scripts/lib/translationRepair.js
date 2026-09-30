"use strict";

/**
 * Targeted, rule-preserving repairs for the translation step of the article
 * pipeline (scripts/ai-ressources-update.js). None of these helpers relaxes a
 * validation rule: they only ask the model for a narrow correction and accept
 * the answer when it satisfies the SAME limits the validator enforces.
 *
 *   - fitFieldLengths(): title / seoTitle / metaDescription / imageAlt outside
 *     the SEO limits → one small "rewrite these fields to ≤ N characters,
 *     keeping the primary keyword" call instead of retranslating the article.
 *   - linkParity() / repairLinks(): every link of the French body (external
 *     URL, or internal path mapped to the locale) must appear in the
 *     translation as often as in French; when some were dropped, one targeted
 *     call returns the body with the missing links placed at the sentences that
 *     carry them in French. If the result still lacks links it is discarded.
 *   - requirementsBlock(): exact limits + required counts, used in every
 *     translation prompt (and with the exact errors on retries).
 *
 * The model is injected as `call(prompt, label) → Promise<object>` so tests can
 * mock it without Azure.
 */

const rules = require("./ridgerArticleRules");
const { containsKeywordLoosely } = require("./keywordResearch");

const REFERENCES_HEADING_RE = "(Références|References|Referenzen|Referencias|Referências)";

function stripReferencesSection(content) {
  return String(content || "")
    .replace(new RegExp(`\\n+-{3,}\\s*\\n+#{2,3}\\s+${REFERENCES_HEADING_RE}\\b[\\s\\S]*$`, "i"), "")
    .replace(new RegExp(`\\n+#{2,3}\\s+${REFERENCES_HEADING_RE}\\b[\\s\\S]*$`, "i"), "")
    .trimEnd();
}

// ─── Field lengths ─────────────────────────────────────────────────────────

const L = rules.SEO_LIMITS;
const FIELD_LIMITS = {
  title: { min: L.titleMin, max: L.titleMax, keyword: true },
  seoTitle: { min: L.seoTitleMin, max: L.seoTitleMax, keyword: true, note: "without the brand; the site appends it" },
  metaDescription: { min: L.metaMin, max: L.metaMax, keyword: true },
  imageAlt: { min: L.imageAltMin, max: L.imageAltMax, keyword: false },
};

/** Why a candidate value does not fit (null when it does). */
function fieldMisfit(field, value, primary) {
  const lim = FIELD_LIMITS[field];
  const v = String(value || "").trim();
  if (!v) return "empty";
  if (v.length < lim.min || v.length > lim.max) return `${v.length} characters (allowed ${lim.min}–${lim.max})`;
  if (field === "seoTitle" && /ridger/i.test(v)) return "contains the brand";
  if (lim.keyword && primary && !containsKeywordLoosely(v, primary, 0.6)) return `lost the primary keyword "${primary}"`;
  return null;
}

function fieldFits(field, value, primary) {
  return fieldMisfit(field, value, primary) === null;
}

/** Fields whose length is outside the validator's limits. */
function fieldLengthProblems(article) {
  const out = [];
  for (const [field, lim] of Object.entries(FIELD_LIMITS)) {
    const len = String(article?.[field] || "").trim().length;
    if (len < lim.min || len > lim.max) out.push({ field, length: len, min: lim.min, max: lim.max });
  }
  return out;
}

function buildShortenPrompt({ locale, localeName, fields, primary, context = "" }) {
  const lines = fields.map((f) => {
    const lim = FIELD_LIMITS[f.field];
    const verb = f.length > f.max ? `shorten to AT MOST ${f.max} characters` : `lengthen to AT LEAST ${f.min} characters`;
    const rejected = (f.rejected || []).map((r) => `\n  Rejected earlier: ${JSON.stringify(r.value)} — ${r.reason}`).join("");
    return `- ${f.field} (currently ${f.length} characters): ${verb} — allowed range ${f.min}–${f.max} characters${lim.note ? ` (${lim.note})` : ""}${lim.keyword ? `; must keep the primary keyword "${primary}" (its words may be reordered or inflected, not dropped)` : ""}.\n  Current: ${JSON.stringify(f.value)}${rejected}`;
  });
  return [
    `Rewrite the following ${localeName || locale} metadata fields of a Swiss family-office article so that each fits its character limit.`,
    "Keep the meaning, the language, the tone (discreet, precise) and every number. Do not add facts. Count characters including spaces; aim a few characters BELOW the maximum.",
    "",
    ...lines,
    context ? `\nArticle context: ${context}` : "",
    "",
    `Output STRICT JSON with exactly these keys: ${JSON.stringify(Object.fromEntries(fields.map((f) => [f.field, ""])))}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * Ask for shorter (or longer) title/seoTitle/metaDescription/imageAlt until
 * they fit, max `rounds` calls. Only values that fit the validator's limits
 * (and keep the primary keyword where required) are accepted.
 * @returns {Promise<{article: object, fixed: string[], remaining: object[]}>}
 */
async function fitFieldLengths({ article, locale, localeName, primary, call, rounds = 3, context = "", log = () => {} }) {
  let current = { ...article };
  const fixed = [];
  const rejected = {};
  for (let round = 1; round <= rounds; round++) {
    const bad = fieldLengthProblems(current).map((f) => ({ ...f, value: String(current[f.field] || ""), rejected: rejected[f.field] || [] }));
    if (!bad.length) break;
    log(`   ✂️ ${locale}: fitting ${bad.map((f) => `${f.field} ${f.length}→${f.length > f.max ? `≤${f.max}` : `≥${f.min}`}`).join(", ")} (round ${round}/${rounds})`);
    let out;
    try {
      out = await call(buildShortenPrompt({ locale, localeName, fields: bad, primary, context }), `shorten-${locale}-${round}`);
    } catch (error) {
      log(`   ⚠️ ${locale}: shorten call failed (${error.message})`);
      break;
    }
    for (const f of bad) {
      const v = typeof out?.[f.field] === "string" ? out[f.field].trim() : "";
      const reason = fieldMisfit(f.field, v, primary);
      if (!reason) {
        current = { ...current, [f.field]: v };
        fixed.push(f.field);
      } else {
        (rejected[f.field] ||= []).push({ value: v, reason });
        log(`   ↳ ${locale}: ${f.field} candidate rejected (${reason}): ${JSON.stringify(v)}`);
      }
    }
  }
  return { article: current, fixed, remaining: fieldLengthProblems(current) };
}

// ─── Link parity ───────────────────────────────────────────────────────────

/**
 * Map a French internal path to the locale's path: service pages via
 * servicePathMaps, static pages by index, articles keep their slug.
 */
function localizeInternalPath(href, locale, servicePathMaps) {
  const withSlash = (p) => (p.endsWith("/") ? p : `${p}/`);
  const h = withSlash(href.split("#")[0]);
  for (const svc of rules.CANONICAL_SERVICES) {
    if (withSlash(rules.localizedServiceUrl("fr", svc, servicePathMaps)) === h) {
      return withSlash(rules.localizedServiceUrl(locale, svc, servicePathMaps));
    }
  }
  const art = h.match(/^\/fr\/ressources\/articles\/([^/]+)\/$/);
  if (art) return `/${locale}/ressources/articles/${art[1]}/`;
  const STATIC = {
    fr: ["/", "/services", "/approche", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
    other: ["/", "/services", "/approach", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
  };
  const rest = h.replace(/^\/fr/, "").replace(/\/$/, "") || "/";
  const i = STATIC.fr.indexOf(rest);
  if (i >= 0) return withSlash(`/${locale}${STATIC.other[i] === "/" ? "" : STATIC.other[i]}`);
  return h.replace(/^\/fr\//, `/${locale}/`);
}

function sentenceAround(content, index) {
  const s = String(content);
  const start = Math.max(s.lastIndexOf("\n", index), s.lastIndexOf(". ", index)) + 1;
  let end = s.indexOf("\n", index);
  if (end < 0) end = s.length;
  return s.slice(start, end).trim().slice(0, 400);
}

/** Every link of the French body, with its expected target in `locale`. */
function expectedLinks(frBody, locale, servicePathMaps) {
  const out = [];
  for (const m of String(frBody || "").matchAll(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g)) {
    const href = m[2].trim();
    const internal = href.startsWith("/");
    out.push({
      kind: internal ? "internal" : "external",
      frHref: href,
      url: internal ? localizeInternalPath(href, locale, servicePathMaps) : href,
      frAnchor: m[1].trim(),
      frSentence: sentenceAround(frBody, m.index),
    });
  }
  return out;
}

const norm = (u) => (u.startsWith("/") ? (u.split("#")[0].endsWith("/") ? u.split("#")[0] : `${u.split("#")[0]}/`) : u);

/**
 * Compare the translation body's links with the French body's (multiset of
 * target URLs). @returns {{ok, missing:[{url, expected, actual}], extra:[…]}}
 */
function linkParity(expected, localeBody) {
  const want = new Map();
  for (const e of expected) want.set(norm(e.url), (want.get(norm(e.url)) || 0) + 1);
  const have = new Map();
  for (const m of String(localeBody || "").matchAll(/\[[^\]]+\]\(((?:https?:\/\/|\/)[^)\s]+)\)/g)) {
    const u = norm(m[1].trim());
    have.set(u, (have.get(u) || 0) + 1);
  }
  const missing = [];
  const extra = [];
  for (const [url, n] of want) if ((have.get(url) || 0) < n) missing.push({ url, expected: n, actual: have.get(url) || 0 });
  for (const [url, n] of have) if (n > (want.get(url) || 0)) extra.push({ url, expected: want.get(url) || 0, actual: n });
  return { ok: !missing.length && !extra.length, missing, extra };
}

function buildLinkRepairPrompt({ locale, localeName, localeBody, expected, parity }) {
  const missingUrls = new Set(parity.missing.map((m) => m.url));
  const places = expected.filter((e) => missingUrls.has(norm(e.url)));
  return [
    `The ${localeName || locale} translation below of a French article lost some Markdown links. Put them back.`,
    "",
    "RULES:",
    "- Return the SAME translated body; change nothing except adding the missing links (turn the matching words of the corresponding sentence into a Markdown link [anchor](url)). Do not add or remove headings, bullets, FAQ items, numbers or facts.",
    "- Use each URL exactly as given (character for character). Anchors are descriptive words in the target language (never \"here\" / \"read more\").",
    `- Required link counts per URL in the final body (exactly): ${[...new Set(expected.map((e) => norm(e.url)))].map((u) => `${u} ×${expected.filter((e) => norm(e.url) === u).length}`).join(" ; ")}.`,
    parity.extra.length ? `- Remove these surplus links (keep their anchor text as plain text): ${parity.extra.map((x) => `${x.url} (has ${x.actual}, expected ${x.expected})`).join(" ; ")}.` : "",
    "- Do not write a references list at the end.",
    "",
    "MISSING LINKS — where they sit in the French original:",
    ...places.map((p, i) => `${i + 1}. url: ${p.url}\n   French anchor: « ${p.frAnchor} »\n   French sentence: « ${p.frSentence} »`),
    "",
    `Missing per URL: ${parity.missing.map((m) => `${m.url} (has ${m.actual}, needs ${m.expected})`).join(" ; ")}`,
    "",
    "TRANSLATED BODY:",
    localeBody,
    "",
    'Output STRICT JSON: {"content": "<the full corrected Markdown body>"}',
  ]
    .filter((l) => l !== "")
    .join("\n");
}

/**
 * One targeted call that re-inserts dropped links. Returns the repaired body
 * only when link parity is then exact and the heading/FAQ structure did not
 * change; otherwise null (the caller keeps failing as before).
 */
async function repairLinks({ locale, localeName, localeBody, expected, call, log = () => {} }) {
  const parity = linkParity(expected, localeBody);
  if (parity.ok) return { content: localeBody, repaired: false };
  log(`   🔗 ${locale}: link parity off (missing ${parity.missing.reduce((n, m) => n + m.expected - m.actual, 0)}, surplus ${parity.extra.reduce((n, m) => n + m.actual - m.expected, 0)}) — targeted repair`);
  let out;
  try {
    out = await call(buildLinkRepairPrompt({ locale, localeName, localeBody, expected, parity }), `links-${locale}`);
  } catch (error) {
    log(`   ⚠️ ${locale}: link repair call failed (${error.message})`);
    return null;
  }
  const content = stripReferencesSection(String(out?.content || "").replace(/^#\s+.*\n+/, ""));
  if (!content) return null;
  const after = linkParity(expected, content);
  const sig = (c) => ["h2", "h3"].map((lv) => rules.extractHeadings(c, lv === "h2" ? 2 : 3).length).join("/") + `/${rules.extractFaq(c).length}`;
  if (!after.ok || sig(content) !== sig(localeBody)) {
    log(`   ⚠️ ${locale}: link repair rejected (${after.ok ? "structure changed" : `still missing ${after.missing.length} URL(s)`})`);
    return null;
  }
  log(`   ✅ ${locale}: links restored`);
  return { content, repaired: true };
}

// ─── Prompt requirements ───────────────────────────────────────────────────

/** Required counts of the French BODY (references list excluded). */
function requiredCounts(frBody) {
  return {
    h2: rules.extractHeadings(frBody, 2).length,
    h3: rules.extractHeadings(frBody, 3).length,
    faq: rules.extractFaq(frBody).length,
    keyFacts: rules.extractKeyFacts(frBody).length,
    externalLinks: rules.extractExternalLinks(frBody).length,
    internalLinks: rules.extractInternalLinks(frBody).length,
  };
}

function requirementsBlock({ frBody, expected, primary }) {
  const c = requiredCounts(frBody);
  const urls = [...new Set(expected.map((e) => e.url))];
  return [
    "HARD LIMITS (characters, spaces included — checked by a program, any overflow = rejection):",
    `- title: ${L.titleMin}–${L.titleMax} characters (aim ≤ ${L.titleMax - 7}). Must contain "${primary}" in its natural written form (accents, capitals, acronyms in caps), not the raw lowercase query.`,
    `- seoTitle: ${L.seoTitleMin}–${L.seoTitleMax} characters, WITHOUT the brand (added at render; aim ≤ ${L.seoTitleMax - 5}). Must contain "${primary}" in its natural written form (accents, capitals, acronyms in caps), not the raw lowercase query.`,
    `- metaDescription: ${L.metaMin}–${L.metaMax} characters. Must contain "${primary}" in its natural written form (accents, capitals, acronyms in caps), not the raw lowercase query.`,
    `- imageAlt: 40–120 characters.`,
    "REQUIRED COUNTS in content (identical to the French body):",
    `- ## headings: ${c.h2} · ### headings: ${c.h3} · FAQ questions: ${c.faq} · key-facts bullets: ${c.keyFacts}`,
    `- external links: ${c.externalLinks} · internal links: ${c.internalLinks} (same order and same sentences as in French)`,
    `- every one of these link targets must appear (with the same number of occurrences as in French): ${urls.join(" , ")}`,
  ].join("\n");
}

module.exports = {
  FIELD_LIMITS,
  buildLinkRepairPrompt,
  buildShortenPrompt,
  expectedLinks,
  fieldFits,
  fieldLengthProblems,
  fitFieldLengths,
  linkParity,
  localizeInternalPath,
  repairLinks,
  requiredCounts,
  requirementsBlock,
  stripReferencesSection,
};
