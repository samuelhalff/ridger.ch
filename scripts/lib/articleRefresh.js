"use strict";

/**
 * Transactional "refresh an existing article" flow for ridger.ch (port of
 * ark-fid.ch's scripts/lib/articleRefresh.js, adapted to Ridger's data layout
 * and hard rules).
 *
 * All 5 locale files are held in memory, every article is regenerated and
 * validated, and only then are the files swapped in atomically
 * (scripts/lib/atomicJsonWrite.js). Any failure, or a dry run, writes nothing.
 *
 * Pure: no network and no module-level side effects. Every model call and the
 * reference research are injected through `deps`, so the flow is testable with
 * fakes (see articleRefresh.test.js).
 */

const fs = require("fs");
const path = require("path");

const rules = require("./ridgerArticleRules");
const translationRepair = require("./translationRepair");
const { writeJsonFilesAtomically } = require("./atomicJsonWrite");
const { checkOfficialOnlyReferences } = require("./officialReferencePolicy");
const { extractOutdatedSwissVatRateMatches } = require("./outdatedVatValidator");

const { stripReferencesSection } = translationRepair;

// Fields a refresh may regenerate on the FR article. Everything else (slug,
// date, category, author, image, backlogId, seoTitle, metaDescription,
// imageAlt, keywords, topic fields, unknown fields...) is preserved as is.
const GENERATED_FIELDS = ["title", "description", "content", "references", "tags"];
// Owned by the FR article and mirrored onto the locale entries when defined.
const MIRRORED_FIELDS = ["date", "updated", "category", "author", "image", "backlogId"];
// Regenerated per locale by the translation step.
const TRANSLATED_FIELDS = ["title", "description", "content", "tags"];

// Pipeline fields a legacy (hand-written) article lacks. With `upgradeLegacy`
// the refresh GENERATES them (FR and every locale) so the refreshed article
// passes the same gate as a newly generated one.
const UPGRADE_FIELDS = ["seoTitle", "metaDescription", "imageAlt", "keywords"];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

/** {primary, secondary[]} from model output, or null when unusable. */
function normalizeKeywords(k) {
  if (!k || typeof k !== "object") return null;
  const primary = String(k.primary || "").trim();
  const secondary = [];
  for (const s of Array.isArray(k.secondary) ? k.secondary : []) {
    const v = String(s || "").trim();
    if (v && !secondary.includes(v) && v !== primary) secondary.push(v);
  }
  return primary ? { primary, secondary } : null;
}

/** Sets `updated`, never touches `date`. Mutates and returns the article. */
function markUpdated(article, today) {
  if (!article || typeof article !== "object") return article;
  article.updated = toIsoDate(today);
  return article;
}

function countWords(text) {
  return rules.countWords(rules.stripMarkdownLinks(String(text || "")));
}

/** Articles produced by the pipeline carry keywords; their title is keyword-bound. */
function isPipelineShaped(article) {
  return Boolean(article && article.keywords && article.keywords.primary);
}

// ─────────────────────────────────────────────────────────────────────────
// Content helpers (shared with scripts/ai-ressources-update.js)
// ─────────────────────────────────────────────────────────────────────────

function appendReferencesSection(content, references, locale) {
  const body = stripReferencesSection(content);
  const list = references.map((r) => `- [${r.labelKey}](${r.url})`).join("\n");
  return `${body}\n\n---\n### ${rules.REFERENCES_HEADINGS[locale]}\n${list}\n`;
}

/**
 * Only validated reference URLs may be linked; any other external link is
 * reduced to its anchor text. Internal links are left for the validator.
 */
function sanitizeExternalLinks(content, references) {
  const allowed = new Set(references.map((r) => r.url));
  return String(content || "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (m, label, url) => (allowed.has(url) ? m : label))
    // bare / autolinked URLs are never kept in the body
    .replace(/(?<!\]\()<?https?:\/\/[^\s)>\]]+>?/g, "")
    .replace(/[ \t]{2,}/g, " ");
}

function stripLeadingH1(content) {
  return String(content || "").replace(/^\s*#\s+.*\n+/, "");
}

// ─────────────────────────────────────────────────────────────────────────
// Prompts
// ─────────────────────────────────────────────────────────────────────────

function buildRefreshResearchPrompt(article, { today, allowedDomainsPrompt = "" } = {}) {
  return [
    `Date du jour : ${toIsoDate(today)}. Tu prépares la mise à jour d'un article existant de ridger.ch (multi-family office suisse, discret).`,
    `Objectif : fournir 6 à 10 références OFFICIELLES vérifiables (HTTP 200, pas de login) pour contrôler les faits de l'article « ${article.title} » (slug : ${article.slug}). Le sujet ne change pas.`,
    "- Uniquement des autorités et institutions officielles : admin.ch, fedlex.admin.ch, estv.admin.ch, finma.ch, snb.ch, ch.ch, sites cantonaux, etc. Aucun cabinet, banque, éditeur ni association.",
    "- Un domaine = deux liens au maximum. Aucune URL inventée : si tu n'es pas sûr d'une URL, ne la donne pas.",
    allowedDomainsPrompt,
    'Réponds STRICTEMENT par un objet JSON : { "references": [ { "labelKey": "Libellé FR", "url": "https://..." } ] }',
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * FR refresh prompt. The voice / hard-rules / verified-facts blocks are owned
 * by scripts/ai-ressources-update.js and passed in so both prompts stay in sync.
 */
function buildRefreshPrompt(
  article,
  { today, serviceUrl, references, voice = "", hardRules = "", facts = [], keywordUsage = "", minWords = 600, maxWords = 1900, lockTitle = false, upgrade = false } = {},
) {
  const iso = toIsoDate(today);
  return [
    voice,
    "",
    hardRules,
    "",
    facts.length ? "=== FAITS VÉRIFIÉS (ne jamais contredire) ===" : "",
    ...facts.map((f) => `- ${f}`),
    "",
    "=== MISSION : METTRE À JOUR UN ARTICLE EXISTANT ===",
    `Date du jour : ${iso}. Garde le slug et le sujet. Vérifie chaque fait, chiffre, date et référence juridique contre les RÉFÉRENCES fournies et corrige ce qui est dépassé (années, taux, seuils, projets devenus droit en vigueur ou abandonnés).`,
    "- Si un fait ne peut pas être vérifié avec les références fournies, retire-le ou formule-le avec prudence (« en principe », « selon la page officielle »). Ne le remplace jamais par un fait de mémoire.",
    "- AUCUNE INVENTION : pas de fait, chiffre, date, nom, statistique, anecdote, cas de famille, témoignage ni exemple présenté comme réel qui ne figure pas déjà dans l'article ou dans les références. En cas de doute, reste qualitatif ou supprime.",
    upgrade
      ? "- Pas de remplissage, pas de superlatif ni de promesse : très sobre. Cet article ancien est remis à la structure standard (voir plus bas) : réorganise-le et développe-le uniquement avec des explications générales sûres et des faits tirés des RÉFÉRENCES fournies ou déjà présents dans l'article."
      : "- Ne rallonge pas par remplissage et ne gonfle pas le ton : très sobre, sans superlatif ni promesse. Conserve le plan existant (sections et ordre) sauf si une section est inexacte.",
    "- Ridger coordonne et supervise ; il ne gère pas d'actifs, ne conseille pas en placement et ne donne pas d'avis juridique. Aucun prix, aucun outil de devis, aucun assistant IA.",
    lockTitle ? `- Titre : conserve EXACTEMENT « ${article.title} » (il est lié au mot-clé principal).` : "- Titre : conserve-le sauf si une année ou une mention est dépassée.",
    "",
    "=== STRUCTURE À RESPECTER (champ content, Markdown) ===",
    `1. Une section \`## Notre rôle\` (ou titre équivalent, non interrogatif) qui explique sobrement ce que Ridger coordonne sur ce sujet, avec UN lien interne vers ${serviceUrl} dont l'ancre décrit le service (3 à 8 mots, jamais « ici » / « en savoir plus »). Si la section existe, garde-la ; sinon ajoute-la avant la ligne de vérification.`,
    `2. Une phrase datée mise à jour : « Sources officielles consultées le ${iso}. » (la date ISO ${iso} exactement), suivie d'un rappel que la page officielle fait foi. Remplace toute ancienne date de vérification.`,
    upgrade
      ? ""
      : "3. Conserve « Points clés » et « Questions fréquentes » s'ils existent, avec le même nombre d'éléments sauf correction nécessaire.",
    "4. Liens Markdown vers une référence fournie autorisés (URL exacte, ancre descriptive) ; aucun autre lien externe, aucune URL nue. Ne rédige PAS la liste des références : elle est régénérée automatiquement. Pas de H1 (#).",
    `Longueur : ${minWords} à ${maxWords} mots. Chiffres en chiffres.`,
    ...(upgrade
      ? [
          "",
          "=== MISE À LA STRUCTURE STANDARD (article ancien sans champs SEO) : OBLIGATOIRE, contrôlé automatiquement ===",
          "A. Ouvre par un paragraphe de 2 à 3 phrases qui répond directement à la question du titre et contient le mot-clé principal sous sa forme naturelle. Aucun titre avant.",
          "B. Juste après : `## Points clés` avec 3 à 5 puces factuelles (chacune adossée à une référence fournie).",
          "C. Ensuite 4 à 6 sections `## <question ?>` (au moins 3 H2 en forme de question ; au moins 2 reprennent naturellement un mot-clé secondaire), puis `## Notre rôle`, la phrase datée, et pour finir `## Questions fréquentes` avec 4 à 6 questions `### … ?` (réponses de 2 à 4 phrases).",
          "D. Le titre (20 à 75 caractères) contient le mot-clé principal sous sa forme naturelle (majuscule initiale, accents, sigles en capitales) ; il peut être reformulé mais le sujet reste identique.",
          "E. Champs à produire en plus dans l'objet article : `seoTitle` (20 à 51 caractères, contient le mot-clé principal, SANS la marque « Ridger »), `metaDescription` (110 à 160 caractères, contient le mot-clé principal), `imageAlt` (10 à 125 caractères, description factuelle de l'illustration), `keywords` : { `primary`: mot-clé principal, `secondary`: 5 à 8 expressions secondaires }.",
          "F. Mots-clés : écris-les sous leur forme naturelle et grammaticale (jamais en gras, jamais entre guillemets, jamais de phrase sur les recherches ou les mots-clés).",
          keywordUsage,
        ]
      : []),
    "",
    "=== RÉFÉRENCES OFFICIELLES (ne pas modifier) ===",
    JSON.stringify(references, null, 2),
    "",
    "=== ARTICLE ACTUEL ===",
    JSON.stringify(
      {
        slug: article.slug,
        title: article.title,
        description: article.description,
        tags: article.tags,
        content: stripReferencesSection(article.content),
      },
      null,
      2,
    ),
    "",
    "Réponds STRICTEMENT par un objet JSON :",
    upgrade
      ? '{ "article": { "title": "...", "description": "...", "tags": ["..."], "seoTitle": "...", "metaDescription": "...", "imageAlt": "...", "keywords": { "primary": "...", "secondary": ["..."] }, "content": "<Markdown sans liste de références>" }, "changeSummary": ["faits corrigés ou retirés, en une ligne chacun"] }'
      : '{ "article": { "title": "...", "description": "...", "tags": ["..."], "content": "<Markdown sans liste de références>" }, "changeSummary": ["faits corrigés ou retirés, en une ligne chacun"] }',
  ]
    .filter((l, i, arr) => l !== "" || (arr[i - 1] !== "" && i > 0))
    .join("\n");
}

function buildRefreshTranslatePrompt({ locale, localeName, frArticle, expected, serviceUrls = {}, today, problems = [], lockTitle = false, upgrade = false }) {
  const frBody = stripReferencesSection(frArticle.content);
  const c = translationRepair.requiredCounts(frBody);
  const urls = [...new Set(expected.map((e) => e.url))];
  const iso = toIsoDate(today);
  return [
    `Adapt this updated Swiss family-office article from French into ${localeName}. It must read as if written natively (warm, discreet, precise, formal address, very understated), not as a literal translation.`,
    "",
    "HARD REQUIREMENTS:",
    "- Do not add, remove or change any fact, number, amount, percentage, date or legal reference: translate what the French says, nothing more. Digits stay digits; ISO dates stay in YYYY-MM-DD form.",
    `- Keep the Markdown structure identical: ## headings: ${c.h2} · ### headings: ${c.h3} · FAQ questions: ${c.faq} · key-facts bullets: ${c.keyFacts} · external links: ${c.externalLinks} · internal links: ${c.internalLinks} (same order, same sentences). Question headings stay questions ending with '?'.`,
    `- Every one of these link targets must appear, with the same number of occurrences as in French: ${urls.join(" , ")}`,
    `- Internal links: French service paths map to ${locale} paths as follows: ${JSON.stringify(serviceUrls)} ; any /fr/ressources/articles/<slug>/ becomes /${locale}/ressources/articles/<slug>/ (slug unchanged).`,
    `- Keep the dated verification sentence with the date ${iso}.`,
    "- Standard casing of the target language (capital at sentence start, proper nouns, acronyms); never an all-lowercase title. Do not write a references list (it is appended automatically).",
    "- No prices, no quote tool, no AI assistant, no e-mail address, no guarantees. Do not add facts that are not in the French.",
    lockTitle ? "- title: keep the title field EXACTLY as given in the source (it is locked)." : "",
    upgrade
      ? `- SEO fields (checked automatically): title 20-75 characters containing the natural ${localeName} form of the primary keyword; seoTitle 20-51 characters containing it, without the brand "Ridger"; metaDescription 110-160 characters containing it; imageAlt 10-125 characters; keywords: { primary: natural ${localeName} form (accents, capitals, acronyms in caps), secondary: exactly ${(frArticle.keywords?.secondary || []).length} natural ${localeName} phrases, same order as the French }. Never bold or quote keywords, never talk about searches or keywords.`
      : "",
    `- tags: exactly ${frArticle.tags.length} translated lowercase tags (same number as the French). referenceLabels: exactly ${frArticle.references.length} translated labels, one per French reference label, same order (keep the leading domain as is).`,
    problems.length
      ? [
          "",
          "YOUR PREVIOUS ATTEMPT WAS REJECTED by the automatic validator with these exact errors:",
          ...problems.map((p) => `- ${p}`),
          "Fix every one of them and return the corrected FULL output (all fields, full content), not a diff.",
        ].join("\n")
      : "",
    "",
    "FRENCH SOURCE:",
    JSON.stringify(
      {
        title: frArticle.title,
        description: frArticle.description,
        tags: frArticle.tags,
        ...(upgrade
          ? { seoTitle: frArticle.seoTitle, metaDescription: frArticle.metaDescription, imageAlt: frArticle.imageAlt, keywords: frArticle.keywords }
          : {}),
        referenceLabels: frArticle.references.map((r) => r.labelKey),
        content: frBody,
      },
      null,
      2,
    ),
    "",
    "Output STRICT JSON:",
    JSON.stringify(
      upgrade
        ? { title: "", description: "", tags: ["…"], seoTitle: "", metaDescription: "", imageAlt: "", keywords: { primary: "", secondary: ["…"] }, referenceLabels: ["…"], content: "<full Markdown>" }
        : { title: "", description: "", tags: ["…"], referenceLabels: ["…"], content: "<full Markdown>" },
    ),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// Merge
// ─────────────────────────────────────────────────────────────────────────

function normalizeTags(tags) {
  const out = [];
  for (const t of Array.isArray(tags) ? tags : []) {
    const v = String(t || "").toLowerCase().trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/**
 * Merge generated fields into the existing FR article. Preserves every other
 * field (including unknown ones). Does NOT set `updated` (the caller does that
 * once the whole refresh has succeeded). A keyword-bound title is locked.
 */
function mergeRefreshedArticle(existing, generated, { upgrade = false } = {}) {
  const merged = { ...existing };
  if (upgrade) {
    for (const f of ["seoTitle", "metaDescription", "imageAlt"]) {
      if (typeof generated?.[f] === "string" && generated[f].trim()) merged[f] = generated[f].trim();
    }
    const kw = normalizeKeywords(generated?.keywords);
    if (kw) merged.keywords = kw;
  }
  const lockTitle = isPipelineShaped(existing);
  for (const field of GENERATED_FIELDS) {
    const value = generated?.[field];
    if (field === "references") {
      if (Array.isArray(value) && value.length) merged.references = value.map((r) => ({ labelKey: r.labelKey, url: r.url }));
    } else if (field === "tags") {
      const tags = normalizeTags(value);
      if (tags.length >= 3) merged.tags = tags;
    } else if (field === "title" && lockTitle) {
      continue;
    } else if (typeof value === "string" && value.trim()) {
      merged[field] = value.trim();
    }
  }
  return merged;
}

/**
 * Locale entry from the existing one (if any) + the translation. Keeps every
 * field the translation does not own (seoTitle, metaDescription, imageAlt,
 * keywords, unknown fields); mirrors the FR-owned fields.
 */
function buildLocalizedArticle(frArticle, existingLocal, translation, references, { upgrade = false } = {}) {
  const base = existingLocal ? { ...existingLocal } : { ...frArticle };
  const lockTitle = !upgrade && isPipelineShaped(frArticle) && existingLocal && existingLocal.title;
  for (const field of TRANSLATED_FIELDS) {
    if (field === "title" && lockTitle) continue;
    if (translation[field] !== undefined) base[field] = translation[field];
  }
  if (upgrade) {
    for (const field of UPGRADE_FIELDS) {
      if (translation[field] !== undefined) base[field] = translation[field];
    }
  }
  for (const field of MIRRORED_FIELDS) {
    if (frArticle[field] !== undefined) base[field] = frArticle[field];
  }
  base.slug = frArticle.slug;
  base.references = references;
  return base;
}

// ─────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Checks one refreshed article (FR or a locale). Legacy hand-written articles
 * keep their own structure; pipeline-shaped ones (with keywords) also pass the
 * full SEO/GEO structure check. Returns a list of problem strings.
 */
function validateRefreshedArticle(article, ctx) {
  const { locale, today, allowedPaths, serviceUrl, frArticle = null, minWords = 600, maxWords = 1900, pipelineShaped = false } = ctx;
  const problems = [];
  const content = String(article.content || "");
  const iso = toIsoDate(today);
  const L = rules.SEO_LIMITS;

  for (const v of rules.checkHardRules(article)) {
    problems.push(`[${v.code}] ${v.message}${v.excerpt ? ` — « ${v.excerpt} »` : ""}`);
  }
  problems.push(...checkOfficialOnlyReferences(article));
  if (extractOutdatedSwissVatRateMatches(article).length) {
    problems.push("mentions an outdated Swiss VAT rate (current: 8.1 % / 2.6 % / 3.8 %)");
  }

  const title = String(article.title || "");
  if (title.length < L.titleMin || title.length > L.titleMax) problems.push(`title length ${title.length} outside ${L.titleMin}–${L.titleMax}`);
  if (!String(article.description || "").trim()) problems.push("description is empty");
  if (!Array.isArray(article.tags) || article.tags.length < 3) problems.push("fewer than 3 tags");
  if (/^#\s/m.test(content)) problems.push("content contains an H1 (the page renders the title as H1)");
  const bare = rules.extractBareUrls(content);
  if (bare.length) problems.push(`bare URL(s) in text: ${bare.slice(0, 3).join(", ")}`);

  const body = content.split(/^---+\s*$/m)[0];
  if (!body.includes(iso)) problems.push(`missing dated verification line with today's date ${iso}`);
  if (!new RegExp(`^#{2,3}\\s+${rules.REFERENCES_HEADINGS[locale]}\\s*$`, "m").test(content)) {
    problems.push(`missing "### ${rules.REFERENCES_HEADINGS[locale]}" section`);
  }

  const internal = rules.extractInternalLinks(content);
  const norm = (p) => (p.split(/[?#]/)[0].endsWith("/") ? p.split(/[?#]/)[0] : `${p.split(/[?#]/)[0]}/`);
  if (!internal.some((l) => norm(l.href) === norm(serviceUrl))) problems.push(`missing the service link ${serviceUrl} (Notre rôle section)`);
  for (const link of internal) {
    if (allowedPaths && !allowedPaths.has(norm(link.href))) problems.push(`internal link does not resolve for ${locale}: ${link.href}`);
    if (link.anchor.split(/\s+/).length < 2) problems.push(`too-short internal anchor text: "${link.anchor}"`);
  }

  if (locale === "fr") {
    const words = countWords(content);
    if (words < minWords) problems.push(`word count ${words} is below the minimum ${minWords}`);
    if (words > maxWords) problems.push(`word count ${words} is above the maximum ${maxWords}`);
  }

  if (pipelineShaped) {
    const kw = article.keywords;
    if (!kw || !kw.primary || !Array.isArray(kw.secondary) || kw.secondary.length < 3) {
      problems.push("keywords must be { primary, secondary[>=3] }");
    }
    const seo = rules.checkSeoStructure(article, {
      locale,
      keywords: article.keywords || {},
      allowedInternalPaths: allowedPaths,
      checkSlug: false,
    });
    problems.push(...(locale === "fr" ? seo.errors : seo.errors.filter((e) => !/^word count/.test(e))));
  }

  if (frArticle) {
    const num = rules.compareNumberParity(frArticle.content, content);
    if (!num.ok) problems.push(`number parity with FR failed — missing: ${num.missing.join(", ") || "none"}; extra: ${num.extra.join(", ") || "none"}`);
    const st = rules.compareStructure(frArticle.content, content);
    if (!st.ok) problems.push(`structure differs from FR (${st.diffs.join("; ")})`);
    if (article.content === frArticle.content || article.title === frArticle.title) {
      problems.push("translation is identical to the French");
    }
    if (!Array.isArray(article.tags) || article.tags.length !== frArticle.tags.length) {
      problems.push(`tags must have exactly ${frArticle.tags.length} entries`);
    }
    if ((article.references || []).length !== (frArticle.references || []).length) problems.push("references count differs from FR");
    if (pipelineShaped && (article.keywords?.secondary || []).length !== (frArticle.keywords?.secondary || []).length) {
      problems.push(`keywords.secondary must have exactly ${(frArticle.keywords?.secondary || []).length} entries`);
    }
  }
  return problems;
}

/** Final in-memory cross-check before anything touches the disk. */
function verifyFinalState({ original, next, locales, slugs, today }) {
  const iso = toIsoDate(today);
  const frSlugs = original.fr.Articles.map((a) => a.slug);
  for (const locale of locales) {
    const before = original[locale];
    const after = next[locale];
    if (after.Articles.length !== before.Articles.length) throw new Error(`refresh: ${locale}: article count changed`);
    for (const key of Object.keys(before)) {
      if (key !== "Articles" && JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        throw new Error(`refresh: ${locale}: unrelated key "${key}" changed`);
      }
    }
    after.Articles.forEach((a, i) => {
      if (a.slug !== frSlugs[i]) throw new Error(`refresh: ${locale}: Articles not index-aligned with FR`);
      const b = before.Articles[i];
      if (!slugs.includes(a.slug)) {
        if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`refresh: ${locale}: untouched article ${a.slug} changed`);
        return;
      }
      for (const field of ["slug", "date", "category", "backlogId"]) {
        if (JSON.stringify(a[field]) !== JSON.stringify(b[field])) throw new Error(`refresh: ${locale}:${a.slug}: ${field} changed`);
      }
      if (a.updated !== iso) throw new Error(`refresh: ${locale}:${a.slug}: updated not set to ${iso}`);
      if (a.date && String(a.updated) < String(a.date)) throw new Error(`refresh: ${locale}:${a.slug}: updated before date`);
      const fr = next.fr.Articles[i];
      if (Object.keys(a).sort().join() !== Object.keys(fr).sort().join()) throw new Error(`refresh: ${locale}:${a.slug}: record shape differs from FR`);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Transaction
// ─────────────────────────────────────────────────────────────────────────

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/**
 * Refresh one or several FR articles + their EN/DE/ES/PT versions as ONE
 * transaction. Nothing is written unless `apply` is true and EVERYTHING
 * succeeded (generation, validation of all 5 locales for every slug, final
 * cross-check, atomic swap).
 *
 * deps (all async, injectable):
 *   research(existingArticle)  -> validated official references [{labelKey,url}]
 *   draft(prompt, ctx)         -> { article:{title,description,tags,content}, changeSummary:[] }
 *   translate(prompt, ctx)     -> { title, description, tags, referenceLabels, content }
 *                                 ctx = { locale, frArticle, attempt, maxAttempts, problems }
 *
 * @returns {Promise<{results: object[], written: boolean}>}
 */
async function refreshArticles({
  slugs,
  today,
  translationsDir,
  locales = ["fr", "en", "de", "es", "pt"],
  servicePathMaps,
  serviceFor,
  localeNames = {},
  promptBlocks = {},
  minWords = 600,
  maxWords = 1900,
  maxDraftAttempts = 2,
  maxTranslationAttempts = 3,
  apply = false,
  upgradeLegacy = false,
  deps,
  log = console.log,
  writeOptions = {},
}) {
  const iso = toIsoDate(today);
  if (!ISO_DATE_RE.test(iso)) throw new Error(`refresh: invalid date ${iso}`);
  const wanted = [...new Set(Array.isArray(slugs) ? slugs : [])];
  if (!wanted.length) throw new Error("refresh: no slug given");
  if (locales[0] !== "fr") throw new Error("refresh: fr must be the first locale");
  const targets = locales.filter((l) => l !== "fr");

  const files = Object.fromEntries(locales.map((l) => [l, path.join(translationsDir, l, "ressources.json")]));
  const original = {};
  for (const l of locales) {
    if (!fs.existsSync(files[l])) throw new Error(`refresh: missing ${l}/ressources.json`);
    original[l] = loadJson(files[l]);
    if (!Array.isArray(original[l].Articles)) throw new Error(`refresh: ${l}/ressources.json has no Articles array`);
  }
  const frSlugs = original.fr.Articles.map((a) => a.slug);
  for (const l of targets) {
    const arts = original[l].Articles;
    if (arts.length !== frSlugs.length || arts.some((a, i) => a.slug !== frSlugs[i])) {
      throw new Error(`refresh: ${l}/ressources.json Articles are not index-aligned with FR`);
    }
  }
  // Work on deep copies; the originals are the untouched reference.
  const next = JSON.parse(JSON.stringify(original));
  const results = [];

  for (const slug of wanted) {
    const idx = frSlugs.indexOf(slug);
    if (idx < 0) throw new Error(`refresh: FR article not found: ${slug}`);
    const existing = next.fr.Articles[idx];
    if (!ISO_DATE_RE.test(String(existing.date || ""))) throw new Error(`refresh: ${slug}: article has no valid date`);
    if (iso < String(existing.date)) throw new Error(`refresh: ${slug}: date ${existing.date} is in the future; refusing to set updated before date`);
    const service = serviceFor(slug, existing);
    if (!rules.CANONICAL_SERVICES.includes(service)) throw new Error(`refresh: ${slug}: unknown service ${service}`);
    const pipelineShaped = isPipelineShaped(existing);
    // Legacy article + upgradeLegacy: the refresh generates the pipeline
    // fields, so the result is validated like a newly generated article.
    const upgrade = upgradeLegacy && !pipelineShaped;
    const shaped = pipelineShaped || upgrade;
    const wordsBefore = countWords(existing.content);
    const minW = Math.max(minWords, Math.floor(wordsBefore * 0.8));
    const allowed = (locale) =>
      rules.buildAllowedInternalPaths(locale, { servicePathMaps, articleSlugs: frSlugs });

    log(`[refresh] ${slug}: research`);
    const references = await deps.research(existing);
    if (!Array.isArray(references) || !references.length || references.some((r) => !r || !r.labelKey || !/^https:\/\//.test(r.url || ""))) {
      throw new Error(`refresh: ${slug}: no usable references`);
    }

    // FR draft, with the validator's exact errors fed back on retry.
    const frServiceUrl = rules.localizedServiceUrl("fr", service, servicePathMaps);
    let frCandidate = null;
    let changeSummary = [];
    let problems = [];
    for (let attempt = 1; attempt <= maxDraftAttempts && !frCandidate; attempt++) {
      log(`[refresh] ${slug}: draft ${attempt}/${maxDraftAttempts}`);
      let prompt = buildRefreshPrompt(existing, {
        today: iso, serviceUrl: frServiceUrl, references, minWords: minW, maxWords, lockTitle: pipelineShaped, upgrade, ...promptBlocks,
      });
      if (problems.length) {
        prompt += `\n\nTA TENTATIVE PRÉCÉDENTE A ÉTÉ REJETÉE par le validateur automatique :\n${problems.map((p) => `- ${p}`).join("\n")}\nCorrige TOUT et renvoie l'objet JSON complet.`;
      }
      const drafted = await deps.draft(prompt, { article: existing, attempt, problems });
      const generated = drafted?.article;
      if (!generated || typeof generated.content !== "string" || !generated.content.trim()) {
        throw new Error(`refresh: ${slug}: draft payload missing article.content`);
      }
      const body = sanitizeExternalLinks(stripReferencesSection(stripLeadingH1(generated.content)), references);
      const merged = mergeRefreshedArticle(
        existing,
        { ...generated, references, content: appendReferencesSection(body, references, "fr") },
        { upgrade },
      );
      const found = validateRefreshedArticle(merged, {
        locale: "fr", today: iso, allowedPaths: allowed("fr"), serviceUrl: frServiceUrl, minWords: minW, maxWords, pipelineShaped: shaped,
      });
      if (merged.slug !== existing.slug) found.push("slug changed");
      if (found.length) {
        problems = found;
        log(`[refresh] ${slug}: FR rejected (${found.length}): ${found.slice(0, 6).join(" | ")}`);
        continue;
      }
      frCandidate = merged;
      changeSummary = Array.isArray(drafted.changeSummary) ? drafted.changeSummary.map(String) : [];
    }
    if (!frCandidate) throw new Error(`refresh: ${slug}: FR draft failed validation: ${problems.slice(0, 6).join(" | ")}`);

    // Translations, one per locale, each validated against the FR candidate.
    const localeEntries = {};
    for (const locale of targets) {
      const existingLocal = next[locale].Articles[idx];
      const localeServiceUrl = rules.localizedServiceUrl(locale, service, servicePathMaps);
      const frBody = stripReferencesSection(frCandidate.content);
      const expected = translationRepair.expectedLinks(frBody, locale, servicePathMaps);
      const serviceUrls = {};
      for (const svc of rules.CANONICAL_SERVICES) {
        serviceUrls[rules.localizedServiceUrl("fr", svc, servicePathMaps)] = rules.localizedServiceUrl(locale, svc, servicePathMaps);
      }
      let tProblems = [];
      let entry = null;
      for (let attempt = 1; attempt <= maxTranslationAttempts && !entry; attempt++) {
        log(`[refresh] ${slug}: translate ${locale} ${attempt}/${maxTranslationAttempts}`);
        const prompt = buildRefreshTranslatePrompt({
          locale, localeName: localeNames[locale] || locale, frArticle: frCandidate, expected, serviceUrls, today: iso, problems: tProblems, lockTitle: pipelineShaped, upgrade,
        });
        const tr = await deps.translate(prompt, { locale, frArticle: frCandidate, attempt, maxAttempts: maxTranslationAttempts, problems: tProblems });
        const labels = Array.isArray(tr?.referenceLabels) ? tr.referenceLabels : [];
        const localeRefs = frCandidate.references.map((r, i) => ({
          labelKey: typeof labels[i] === "string" && labels[i].trim() ? labels[i].trim() : r.labelKey,
          url: r.url,
        }));
        const localeBody = sanitizeExternalLinks(stripReferencesSection(stripLeadingH1(String(tr?.content || ""))), frCandidate.references);
        const candidate = buildLocalizedArticle(
          frCandidate,
          existingLocal,
          {
            title: String(tr?.title || "").trim(),
            description: String(tr?.description || "").trim(),
            tags: normalizeTags(tr?.tags),
            content: appendReferencesSection(localeBody, localeRefs, locale),
            ...(upgrade
              ? {
                  seoTitle: String(tr?.seoTitle || "").trim(),
                  metaDescription: String(tr?.metaDescription || "").trim(),
                  imageAlt: String(tr?.imageAlt || "").trim(),
                  keywords: normalizeKeywords(tr?.keywords) || { primary: "", secondary: [] },
                }
              : {}),
          },
          localeRefs,
          { upgrade },
        );
        const found = validateRefreshedArticle(candidate, {
          locale, today: iso, allowedPaths: allowed(locale), serviceUrl: localeServiceUrl, frArticle: frCandidate, pipelineShaped: shaped,
        });
        if (found.length) {
          tProblems = found;
          log(`[refresh] ${slug}: ${locale} rejected (${found.length}): ${found.slice(0, 5).join(" | ")}`);
          continue;
        }
        entry = candidate;
      }
      if (!entry) throw new Error(`refresh: ${slug}: ${locale} translation failed validation: ${tProblems.slice(0, 5).join(" | ")}`);
      localeEntries[locale] = entry;
    }

    // Everything for this slug validated: finalize in memory. `updated` is
    // set here and only here, after the last check of the last locale.
    markUpdated(frCandidate, iso);
    next.fr.Articles[idx] = frCandidate;
    for (const locale of targets) {
      next[locale].Articles[idx] = { ...localeEntries[locale], updated: iso };
    }
    results.push({ slug, service, wordsBefore, wordsAfter: countWords(frCandidate.content), changeSummary });
  }

  verifyFinalState({ original, next, locales, slugs: wanted, today: iso });

  if (!apply) {
    log("[refresh] dry-run: validated, nothing written (use --apply to write)");
    return { results, written: false };
  }
  const entries = locales.map((l) => ({ file: files[l], data: next[l] }));
  writeJsonFilesAtomically(entries, {
    validate(parsed, file) {
      const l = locales.find((x) => files[x] === file);
      if (!l || !Array.isArray(parsed?.Articles) || parsed.Articles.length !== frSlugs.length) {
        throw new Error(`refresh: ${l}: invalid file after serialization`);
      }
    },
    ...writeOptions,
  });
  log(`[refresh] wrote ${entries.length} files`);
  return { results, written: true };
}

module.exports = {
  GENERATED_FIELDS,
  MIRRORED_FIELDS,
  TRANSLATED_FIELDS,
  UPGRADE_FIELDS,
  appendReferencesSection,
  buildLocalizedArticle,
  buildRefreshPrompt,
  buildRefreshResearchPrompt,
  buildRefreshTranslatePrompt,
  countWords,
  isPipelineShaped,
  markUpdated,
  mergeRefreshedArticle,
  normalizeKeywords,
  refreshArticles,
  sanitizeExternalLinks,
  validateRefreshedArticle,
  verifyFinalState,
};
