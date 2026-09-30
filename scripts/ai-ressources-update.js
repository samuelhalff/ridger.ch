#!/usr/bin/env node
"use strict";

/**
 * Ridger — automated SEO/GEO article pipeline (port of ark-fid.ch's
 * scripts/ai-ressources-update.js, adapted to Ridger's voice, taxonomy and
 * hard rules). One article per run, in all 5 locales, or nothing.
 *
 *   1. Topic      — pick from data/article-backlog.json (diversity policy:
 *                   never the same category twice in a row, no theme repeat in
 *                   the last 4, no near-duplicate), demand-weighted between
 *                   the top 3 candidates using live autocomplete richness.
 *   2. Keywords   — autocomplete per locale (Google, else Bing, else
 *                   DuckDuckGo; fr-CH/fr-FR, en-GB/en-US, de-CH/de-DE,
 *                   es-ES, pt-PT/pt-BR), else the item's researchedKeywords
 *                   (npm run keywords:refresh), else seeds → primary + 5–10
 *                   secondary + question keywords; best-effort Google Trends
 *                   "trending now" CH signal. Never fails the run.
 *   3. Research   — Azure AI Foundry agent (web search, AZURE_AGENT_*), else
 *                   AZURE_OPENAI_RESEARCH_*, else the main deployment:
 *                   current developments, dated key facts, question outline,
 *                   official references (then HTTP-validated).
 *   4. Draft (FR) — AZURE_OPENAI_DRAFT_* (fallback main deployment).
 *   5. Validate   — hard rules (prices, quote tool, AI assistant, e-mails,
 *                   guarantees, US persons, Ark ≤ 1, legal-audit claims),
 *                   SEO/GEO structure (keywords in title/meta/H1/lead/H2,
 *                   key facts box, FAQ 4–6, dated verification line, internal
 *                   links resolve, official links only), topic guardrails.
 *                   Up to 2 repair rounds, else the article is discarded.
 *   6. Translate  — per locale with that locale's researched keywords; number
 *                   parity, structure parity and the same checks per locale.
 *                   Targeted repairs before any full retranslation (see
 *                   scripts/lib/translationRepair.js): dropped links →
 *                   link-repair call; title/seoTitle/meta/alt too long →
 *                   "shorten to ≤ N" call. Retries carry the exact errors,
 *                   limits and counts; the last attempt uses the draft
 *                   (stronger) deployment.
 *   7. Write      — append to all 5 ressources.json at the same index (the
 *                   build's key-parity check is index-based) + research log.
 *
 * Usage:
 *   node scripts/ai-ressources-update.js --plan-only     # topic + keyword research only (no Azure)
 *   node scripts/ai-ressources-update.js --dry-run       # topic + keywords + research outline; no article generation, writes nothing
 *   node scripts/ai-ressources-update.js --no-write      # full generation + validation, writes nothing (offline e2e test)
 *   node scripts/ai-ressources-update.js --apply [--translate-existing]
 *
 * Env: see docs/article-pipeline.md.
 */

try {
  require("dotenv").config();
} catch {
  // optional
}

const fs = require("fs");
const path = require("path");

const {
  describeTopic,
  findAllTimeNearDuplicate,
  findRecentTitleConflict,
  findRecentTopicConflict,
} = require("./lib/articleTopicGuardrails");
const {
  extractOutdatedSwissVatRateMatches,
} = require("./lib/outdatedVatValidator");
const {
  validateReferences,
  isBlockedDomain,
  isOfficialReference,
  extractDomain,
} = require("./lib/referenceValidator");
const {
  MIN_OFFICIAL_REFERENCES,
  checkOfficialOnlyReferences,
} = require("./lib/officialReferencePolicy");
const {
  chooseWithDemand,
  loadBacklog,
  rankBacklogCandidates,
  resolveForcedTopic,
  sortArticlesNewestFirst,
  validateBacklog,
} = require("./lib/articleBacklog");
const {
  alignKeywordSets,
  fetchTrendSignal,
  newResearchState,
  probeDemand,
  researchAllLocales,
  slugify,
  significantTokens,
} = require("./lib/keywordResearch");
const rules = require("./lib/ridgerArticleRules");
// Shared across the demand probe and keyword research: a provider that failed
// every request (Google on CI runners) is skipped for the rest of the run.
const KEYWORD_RESEARCH_STATE = newResearchState();
const { writeJsonFilesAtomically } = require("./lib/atomicJsonWrite");
const translationRepair = require("./lib/translationRepair");
const { normalizeArticleCasing } = require("./lib/titleCase");

const args = new Set(process.argv.slice(2));
const PLAN_ONLY = args.has("--plan-only");
// --dry-run stops after topic + keyword research + research outline (like the
// switzerlandresidency.ch pipeline): no FR draft, no translations.
const DRY_RUN = args.has("--dry-run") && !PLAN_ONLY;
const NO_WRITE = args.has("--no-write");
const APPLY = args.has("--apply") && !DRY_RUN && !NO_WRITE && !PLAN_ONLY;
const TRANSLATE_EXISTING = args.has("--translate-existing");

const FORCE_TOPIC = (process.env.FORCE_TOPIC || "").trim();
const FORCE_TOPIC_KEYWORDS = (process.env.FORCE_TOPIC_KEYWORDS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const FORCE_TOPIC_CATEGORY = (process.env.FORCE_TOPIC_CATEGORY || "").trim();
const SKIP_TOPIC_ROTATION = process.env.SKIP_TOPIC_ROTATION === "1";
const TOPIC_ROTATION_WINDOW = Math.max(1, parseInt(process.env.TOPIC_ROTATION_WINDOW || "10", 10) || 10);
const MAX_RESEARCH_ATTEMPTS = Math.max(1, parseInt(process.env.AI_ARTICLE_RETRIES || "3", 10) || 3);
const MAX_REPAIRS = Math.max(0, parseInt(process.env.AI_REPAIR_ROUNDS || "2", 10));
const MAX_TRANSLATION_ATTEMPTS = Math.max(1, parseInt(process.env.AI_TRANSLATION_RETRIES || "3", 10) || 3);
const OFFLINE_MODE = process.env.OFFLINE_MODE === "1";
const MIN_WORDS = parseInt(process.env.SEO_MIN_WORDS || "1100", 10);
const MAX_WORDS = parseInt(process.env.SEO_MAX_WORDS || "1900", 10);

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");
const LOCALES = rules.LOCALES; // fr first
const TARGET_LOCALES = LOCALES.filter((l) => l !== "fr");
const RESEARCH_LOG = path.join(ROOT, "data", "article-research-log.json");
const DEFAULT_IMAGE = "abstract-background-dark.avif";

const LOCALE_NAMES = {
  en: "English (British spelling, international readers)",
  de: "German for Switzerland (Swiss spelling: ss instead of ß, Swiss terms such as Bewilligung, Steuererklärung, Kanton)",
  es: "Spanish (Spain)",
  pt: "European Portuguese (Portugal)",
};

// Facts the models must not contradict (from the 2026 legal audit). Kept in
// French because the FR draft is canonical; translations inherit them.
const VERIFIED_FACTS = [
  "Résidence fiscale d'une personne physique en Suisse : domicile (intention de s'établir durablement) OU séjour d'au moins 30 jours avec activité lucrative / 90 jours sans activité lucrative (art. 3 LIFD) ; en cas de double résidence, les conventions de double imposition départagent. Ne présente JAMAIS « 183 jours » comme le critère suisse.",
  "Imposition d'après la dépense (forfait fiscal) : la base est au moins égale à 7 fois le loyer annuel ou la valeur locative (art. 14 LIFD) — jamais « 5 fois ». Le montant fédéral de CHF 435 000 (2026) est un minimum de BASE de calcul, pas un impôt.",
  "Il n'existe pas de « golden visa » ni de programme suisse de résidence par investissement. Une autorisation pour intérêts publics importants (notamment fiscaux, art. 30 LEI) relève de l'appréciation cantonale et du SEM.",
  "Il n'y a pas d'impôt fédéral sur la fortune ni sur les successions, mais les cantons en prélèvent : tous les cantons connaissent un impôt sur la fortune ; les impôts sur les successions/donations sont cantonaux (le conjoint est exonéré partout, les descendants dans la plupart des cantons ; Schwyz n'en prélève pas). Toujours qualifier.",
  "Le durcissement de la Lex Koller (LFAIE) annoncé en 2025–2026 est un projet, pas du droit en vigueur. Le paquet Suisse–UE (« Bilatérales III », libre circulation mise à jour) n'est pas en vigueur : il suit la procédure parlementaire et un éventuel référendum.",
  "L'achat d'un bien immobilier en Suisse ne confère aucun droit de séjour ni permis.",
  "TVA suisse depuis le 1er janvier 2024 : 8,1 % (normal), 2,6 % (réduit), 3,8 % (hébergement).",
];

const HARD_RULES_PROMPT = [
  "RÈGLES ABSOLUES (un seul manquement = article rejeté) :",
  "- Aucun prix, tarif, honoraire, fourchette de coût de service ; aucun outil de devis ; aucune mention d'assistant IA ou de chatbot.",
  "- Aucune adresse e-mail. Aucune garantie ni promesse de résultat.",
  "- Aucun conseil de structuration pour « US persons », aucun trust américain, rien sur FATCA.",
  "- Ne mentionne pas le groupe Ark (au maximum une fois, et seulement si indispensable).",
  "- Ridger coordonne et supervise ; il ne gère pas d'actifs, ne donne pas de conseil en placement ni d'avis juridique : il oriente vers les sources officielles et les partenaires suisses (notaires, avocats, fiscalistes).",
  "- Chaque fait chiffré ou juridique doit venir d'une source officielle listée (admin.ch, fedlex, estv, sem, sites cantonaux…). Si tu n'es pas sûr d'un chiffre, ne le donne pas : renvoie à la page officielle.",
  "- Les projets de loi, consultations ou accords non ratifiés sont présentés comme tels (« projet », « en consultation »), jamais comme du droit en vigueur.",
].join("\n");

// Keywords are raw search queries (lowercase, no accents, word salad): they
// steer the topic, never the wording. Enforced by
// rules.checkKeywordNaturalness (KW_BOLD_QUERY / KW_RAW_QUERY / KW_SEARCH_META).
const KEYWORD_USAGE_PROMPT = [
  "USAGE DES MOTS-CLÉS (contrôlé automatiquement, tout manquement = rejet) :",
  "- Les mots-clés fournis sont des requêtes brutes (minuscules, sans accents, mots juxtaposés). Ne les recopie JAMAIS tels quels : écris leur forme naturelle et grammaticale, avec accents, majuscules, sigles en capitales (LPP, AVS, PK, BVG) et noms propres capitalisés (Suisse, Genève).",
  "- Exemple : « rachat lpp deduction impot » → « la déduction fiscale d'un rachat LPP » ; « rachat lpp 3 ans avant la retraite » → « un rachat LPP dans les 3 ans précédant la retraite ».",
  "- Jamais de mot-clé en gras (**…**) ni entre guillemets. Pas de gras pour mettre un terme en avant.",
  "- Ne parle jamais des recherches ou des internautes (« les recherches comme… », « la question « … » », « mots-clés ») : réponds directement au sujet.",
  "- Si un mot-clé ne peut pas être intégré naturellement (hors sujet, autre pays, requête incohérente), ignore-le plutôt que de le coller en fin de phrase.",
].join("\n");

const KEYWORD_USAGE_PROMPT_EN = [
  "KEYWORD USAGE (checked by a program, any breach = rejection):",
  "- The keywords are raw search queries (lowercase, no accents, word salad). NEVER paste them verbatim: write their natural, grammatical form in the target language, with correct accents, capitals, acronyms in caps (LPP, BVG, PK, AHV/AVS) and capitalised proper nouns (Switzerland, Zürich), hyphenated where the language requires it (\"PK-Einkauf\", \"pension fund buy-in\").",
  "- Example: \"pension fund buy in switzerland\" → \"a pension fund buy-in in Switzerland\"; \"pk einkauf steuern abziehen\" → \"den PK-Einkauf von den Steuern abziehen\".",
  "- Never bold (**…**) or quote a keyword. Do not use bold to highlight terms.",
  "- Never talk about searches or keywords (\"searches like…\", \"the question '…'\", \"Suchanfragen\", \"búsquedas como\", \"pesquisas como\"): answer the subject directly.",
  "- If a keyword cannot be used naturally (off-topic, another country, incoherent query), skip it instead of tacking it onto a sentence.",
].join("\n");

const VOICE_PROMPT = [
  "VOIX RIDGER (family office suisse, discret) :",
  "- Chaleureuse, discrète, précise. Vouvoiement. Phrases nettes, sans jargon inutile, sans superlatifs ni ton commercial.",
  "- Écris comme un associé expérimenté qui explique calmement une question à une famille : concret, nuancé, rassurant sans minimiser.",
  "- Pas de formules creuses (« il est important de noter », « dans un monde où », « n'hésitez pas »), pas de « Introduction » ni de « Conclusion ».",
  "- Accessible aussi aux familles qui ne sont pas fortunées quand le sujet s'y prête (installation, personnel de maison, assurances…).",
].join("\n");

// ─────────────────────────────────────────────────────────────────────────
// I/O
// ─────────────────────────────────────────────────────────────────────────

function loadJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ressourcesPath(locale) {
  return path.join(TRANSLATIONS_DIR, locale, "ressources.json");
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return;
  const v = String(value ?? "");
  if (v.includes("\n")) fs.appendFileSync(file, `${name}<<__EOF__\n${v}\n__EOF__\n`);
  else fs.appendFileSync(file, `${name}=${v}\n`);
}

function log(...a) {
  console.log(...a);
}

// ─────────────────────────────────────────────────────────────────────────
// Azure access (lazy — --plan-only must work without secrets)
// ─────────────────────────────────────────────────────────────────────────

// AI_MOCK_MODULE: path to a module exporting research(ctx) / draft(ctx) /
// repair(ctx) / translate(ctx) — used by the offline end-to-end test so the
// whole pipeline can be exercised without Azure secrets.
const MOCK = process.env.AI_MOCK_MODULE ? require(path.resolve(process.env.AI_MOCK_MODULE)) : null;

let azure = null;
function getAzure() {
  if (!azure) azure = require("./lib/azureClients");
  return azure;
}

function ensureAzureConfigured() {
  if (MOCK) return;
  const a = getAzure();
  a.ensureOpenAIEnv();
}

async function callDraftModel(prompt, label, ctx = {}) {
  if (MOCK) return label.startsWith("repair") ? MOCK.repair({ prompt, ...ctx }) : MOCK.draft({ prompt, ...ctx });
  const a = getAzure();
  return a.azureOpenAIJson(prompt, {
    endpoint: a.AZURE_OPENAI_DRAFT_ENDPOINT,
    deployment: a.AZURE_OPENAI_DRAFT_DEPLOYMENT,
    apiVersion: a.AZURE_OPENAI_DRAFT_API_VERSION,
    maxTokens: a.AZURE_OPENAI_DRAFT_MAX_TOKENS,
    temperature: 0.4,
    debugLabel: label,
    system: "Tu es un rédacteur senior pour un family office suisse. Réponds UNIQUEMENT par un objet JSON valide.",
  });
}

/**
 * Translation-step model. `strong` switches to the draft deployment
 * (AZURE_OPENAI_DRAFT_*, gpt-5.2 in CI) — used for the final attempt after the
 * main deployment failed. Labels: translate-* / shorten-* / links-*.
 */
async function callTranslateModel(prompt, label, ctx = {}, { strong = false } = {}) {
  if (MOCK) {
    const kind = label.startsWith("shorten") ? "shorten" : label.startsWith("links") ? "linkRepair" : "translate";
    if (kind !== "translate" && typeof MOCK[kind] !== "function") return {};
    return MOCK[kind]({ prompt, label, strong, ...ctx });
  }
  const a = getAzure();
  const target = strong
    ? { endpoint: a.AZURE_OPENAI_DRAFT_ENDPOINT, deployment: a.AZURE_OPENAI_DRAFT_DEPLOYMENT, apiVersion: a.AZURE_OPENAI_DRAFT_API_VERSION }
    : {};
  return a.azureOpenAIJson(prompt, {
    ...target,
    maxTokens: a.AZURE_OPENAI_DRAFT_MAX_TOKENS,
    temperature: 0.2,
    debugLabel: label,
    system: "You are a senior native-speaker editor and translator for a Swiss family office. Output ONLY a valid JSON object.",
  });
}

function strongTranslateDeploymentName() {
  if (MOCK) return "mock-strong";
  const a = getAzure();
  return a.AZURE_OPENAI_DRAFT_DEPLOYMENT;
}

/**
 * Research step: prefer the Foundry web-search agent (live developments),
 * then the dedicated research deployment, then the main deployment.
 */
async function callResearchModel(prompt, ctx = {}) {
  if (MOCK) return { provider: "mock", json: await MOCK.research({ prompt, ...ctx }) };
  const a = getAzure();
  const system = "Tu es un chercheur SEO/GEO rigoureux pour un family office suisse. Réponds UNIQUEMENT par un objet JSON valide.";
  if (a.AZURE_AGENT_ENDPOINT && a.AZURE_AGENT_RESEARCH_NAME) {
    try {
      const out = await a.requestAgentJson(prompt, { agentName: a.AZURE_AGENT_RESEARCH_NAME });
      return { provider: `agent:${a.AZURE_AGENT_RESEARCH_NAME}`, json: out };
    } catch (error) {
      console.warn(`[research] agent failed (${error.message}); falling back to Azure OpenAI`);
    }
  }
  if (a.AZURE_OPENAI_RESEARCH_ENDPOINT && a.AZURE_OPENAI_RESEARCH_DEPLOYMENT) {
    try {
      const out = await a.azureOpenAIJson(prompt, {
        endpoint: a.AZURE_OPENAI_RESEARCH_ENDPOINT,
        deployment: a.AZURE_OPENAI_RESEARCH_DEPLOYMENT,
        apiVersion: a.AZURE_OPENAI_RESEARCH_API_VERSION,
        apiKey: a.AZURE_OPENAI_RESEARCH_API_KEY,
        maxTokens: 4096,
        system,
      });
      return { provider: `openai-research:${a.AZURE_OPENAI_RESEARCH_DEPLOYMENT}`, json: out };
    } catch (error) {
      console.warn(`[research] research deployment failed (${error.message}); falling back to main deployment`);
    }
  }
  const out = await a.azureOpenAIJson(prompt, { maxTokens: 4096, system, debugLabel: "research" });
  return { provider: `openai:${a.AZURE_OPENAI_DEPLOYMENT}`, json: out };
}

// ─────────────────────────────────────────────────────────────────────────
// Prompts
// ─────────────────────────────────────────────────────────────────────────

function buildResearchPrompt({ item, keywords, existing, today, retryHint }) {
  const fr = keywords.fr;
  const twelveMonthsAgo = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  return [
    `Date du jour : ${today}. Tu prépares UN article pour ridger.ch (multi-family office suisse, Genève, digital et discret).`,
    `Privilégie des sources officielles publiées ou mises à jour entre ${twelveMonthsAgo} et ${today} ; les pages officielles stables plus anciennes restent valables.`,
    "",
    "=== SUJET (backlog éditorial) ===",
    `Thème : ${item.theme} · Catégorie : ${item.category} · Public : ${item.audience}`,
    `Angle : ${item.angle}`,
    item.officialSources?.length ? `Sources officielles pressenties : ${item.officialSources.join(", ")}` : "",
    "",
    "=== MOTS-CLÉS RECHERCHÉS (Google autocomplete fr-CH / fr-FR) ===",
    `Mot-clé principal : ${fr.primary}`,
    `Mots-clés secondaires : ${fr.secondary.join(" | ")}`,
    fr.questions?.length ? `Questions réellement tapées : ${fr.questions.join(" | ")}` : "",
    KEYWORD_USAGE_PROMPT,
    "",
    "=== FAITS VÉRIFIÉS (ne jamais contredire) ===",
    ...VERIFIED_FACTS.map((f) => `- ${f}`),
    "",
    HARD_RULES_PROMPT,
    "",
    "=== À NE PAS DUPLIQUER (articles existants) ===",
    existing.map((a) => `- ${a.slug} — ${a.title}`).join("\n"),
    retryHint ? `\n⚠️ ${retryHint}` : "",
    "",
    "=== TA MISSION ===",
    "1. Vérifie l'actualité du sujet (développements récents, statut juridique exact : en vigueur / adopté / projet / consultation) avec leurs dates.",
    "2. Propose un titre, un plan en questions et 4 à 8 références officielles vérifiables (URL exactes, HTTP 200, sans login ; pas de cabinets, banques, concurrents ni médias).",
    "3. Le slug doit contenir le mot-clé principal (kebab-case ASCII, ≤ 80 caractères).",
    "4. seoTitle ≤ 51 caractères (la marque est ajoutée ensuite), contient le mot-clé principal. metaDescription 120–155 caractères, contient le mot-clé principal, sans guillemets.",
    "5. Les H2 du plan sont des QUESTIONS (finissant par « ? ») ; au moins 3 d'entre elles contiennent un mot-clé secondaire.",
    "",
    "Format de sortie STRICT (JSON) :",
    JSON.stringify(
      {
        research: {
          slug: "<slug-fr-avec-mot-cle-principal>",
          title: "<H1 FR, 30–70 caractères, contient le mot-clé principal>",
          seoTitle: "<≤ 51 caractères>",
          metaDescription: "<120–155 caractères>",
          description: "<1–2 phrases pour la carte de l'article>",
          directAnswer: "<2–3 phrases qui répondent directement à la question principale>",
          keyFacts: [{ fact: "<fait daté et vérifiable>", source: "<url officielle>", asOf: "YYYY-MM-DD" }],
          recentDevelopments: [{ date: "YYYY-MM-DD", status: "en vigueur|adopté|projet|consultation", summary: "<…>", source: "<url>" }],
          outline: [{ h2: "<question ?>", keyword: "<mot-clé secondaire utilisé>", points: ["<…>"] }],
          faq: ["<question ?>"],
          references: [{ labelKey: "<domaine — intitulé de la page>", url: "https://…" }],
        },
      },
      null,
      2,
    ),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function buildDraftPrompt({ item, research, references, keywords, servicePathMaps, today }) {
  const fr = keywords.fr;
  const serviceUrl = rules.localizedServiceUrl("fr", item.service, servicePathMaps);
  return [
    VOICE_PROMPT,
    "",
    HARD_RULES_PROMPT,
    "",
    "=== FAITS VÉRIFIÉS (ne jamais contredire) ===",
    ...VERIFIED_FACTS.map((f) => `- ${f}`),
    "",
    "=== MOTS-CLÉS (placement naturel, jamais de bourrage) ===",
    `Principal : « ${fr.primary} » → sous sa forme naturelle (accents, majuscules, sigles) dans le titre (H1), le seoTitle, la metaDescription, la première phrase et une fois ou deux dans le corps.`,
    `Secondaires : ${fr.secondary.map((k) => `« ${k} »`).join(", ")} → au moins 3 H2 en question en reprennent l'idée sous une forme naturelle ; les autres apparaissent naturellement dans le texte.`,
    fr.questions?.length ? `Questions des internautes (pour les H2 et la FAQ, reformulées correctement) : ${fr.questions.join(" | ")}` : "",
    KEYWORD_USAGE_PROMPT,
    "",
    "=== STRUCTURE OBLIGATOIRE DU CHAMP content (Markdown) ===",
    "1. Un paragraphe d'ouverture de 2 à 3 phrases qui RÉPOND directement à la question (le mot-clé principal y figure). Pas de titre avant.",
    "2. `## Points clés` : 3 à 5 puces factuelles, datées quand c'est pertinent, chacune adossée à une source officielle.",
    "3. 4 à 6 sections `## <question ?>` (H2 en forme de question). Des `###` si utile. Liens Markdown vers les sources officielles fournies, avec un intitulé descriptif.",
    `4. Une section \`## Notre rôle\`... (ou titre équivalent, non interrogatif) qui explique sobrement ce que Ridger coordonne, avec UN lien interne vers ${serviceUrl} dont l'ancre décrit le service (3 à 8 mots, jamais « ici » / « en savoir plus »).`,
    `5. Une phrase datée : « Sources officielles consultées le ${today}. » (ou formulation équivalente avec la date ISO ${today}), puis rappelle que la page officielle fait foi.`,
    "6. `## Questions fréquentes` : 4 à 6 questions en `### … ?`, chacune suivie d'une réponse de 2 à 4 phrases, autonome et factuelle.",
    "7. Ne rédige PAS la liste des références : elle est ajoutée automatiquement.",
    `Longueur : ${MIN_WORDS} à ${MAX_WORDS} mots. Pas de H1 (#) dans le contenu. Pas de tableau de prix. Chiffres en chiffres (pas en toutes lettres).`,
    "",
    "=== RECHERCHE ===",
    JSON.stringify(
      {
        title: research.title,
        directAnswer: research.directAnswer,
        keyFacts: research.keyFacts,
        recentDevelopments: research.recentDevelopments,
        outline: research.outline,
        faq: research.faq,
      },
      null,
      2,
    ),
    "",
    "=== RÉFÉRENCES AUTORISÉES (seuls liens externes permis, URL inchangées) ===",
    JSON.stringify(references, null, 2),
    "",
    "Format de sortie STRICT (JSON) :",
    JSON.stringify(
      {
        newArticle: {
          slug: research.slug,
          title: research.title,
          seoTitle: research.seoTitle,
          metaDescription: research.metaDescription,
          description: research.description,
          imageAlt: "<texte alternatif descriptif de l'illustration, 40–120 caractères, avec le mot-clé principal>",
          tags: ["<5 étiquettes courtes en minuscules, en français>"],
          content: "<Markdown complet selon la structure>",
        },
      },
      null,
      2,
    ),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function buildRepairPrompt({ article, problems, keywords, servicePathMaps, item, today, locale = "fr" }) {
  const k = keywords[locale];
  return [
    locale === "fr" ? VOICE_PROMPT : "",
    HARD_RULES_PROMPT,
    "",
    locale === "fr" ? KEYWORD_USAGE_PROMPT : KEYWORD_USAGE_PROMPT_EN,
    "",
    "=== FAITS VÉRIFIÉS ===",
    ...VERIFIED_FACTS.map((f) => `- ${f}`),
    "",
    `L'article ci-dessous (langue : ${locale}) a été REJETÉ par nos contrôles automatiques. Corrige TOUS les problèmes suivants, sans rien casser d'autre :`,
    ...problems.map((p) => `- ${p}`),
    "",
    `Rappels : mot-clé principal « ${k.primary} » ; secondaires : ${k.secondary.join(" | ")} ; lien interne attendu : ${rules.localizedServiceUrl(locale, item.service, servicePathMaps)} ; titres de section obligatoires : « ## ${rules.KEY_FACTS_HEADINGS[locale]} », « ## ${rules.FAQ_HEADINGS[locale]} » ; date de vérification ${today}.`,
    `Longueur ${MIN_WORDS}–${MAX_WORDS} mots (FR) ; ne supprime pas la section « ### ${rules.REFERENCES_HEADINGS[locale]} » si elle est présente.`,
    "",
    "Renvoie le même objet JSON corrigé, sous la clé newArticle :",
    JSON.stringify({ newArticle: article }, null, 2),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function buildTranslatePrompt({ locale, frArticle, keywords, servicePathMaps, problems = [] }) {
  const k = keywords[locale];
  // The references list is appended by the pipeline: the model only sees and
  // returns the body, so the counts below are the body's.
  const frBody = stripReferencesSection(frArticle.content);
  const expected = translationRepair.expectedLinks(frBody, locale, servicePathMaps);
  const frServiceUrls = {};
  for (const svc of rules.CANONICAL_SERVICES) {
    frServiceUrls[rules.localizedServiceUrl("fr", svc, servicePathMaps)] = rules.localizedServiceUrl(locale, svc, servicePathMaps);
  }
  return [
    `Adapt this Swiss family-office article from French into ${LOCALE_NAMES[locale]}. It must read as if written natively (warm, discreet, precise; formal address), not as a literal translation.`,
    "",
    "HARD REQUIREMENTS:",
    "- Keep EVERY number, amount, percentage, date and legal reference exactly as in the French (digits, not words). Dates stay in ISO format YYYY-MM-DD.",
    "- Keep the Markdown structure identical: same number of ## and ### headings, same bullets, same number of links, same order. External URLs unchanged. Every link of the French stays a link, at the same sentence.",
    `- Section headings: "## ${KEY(locale, "facts")}" for "## Points clés" and "## ${KEY(locale, "faq")}" for "## Questions fréquentes"; "### ${rules.REFERENCES_HEADINGS[locale]}" for "### Références".`,
    "- Question headings stay questions ending with '?'. Do NOT write a references list at the end (it is appended automatically).",
    `- Internal links: replace each French path with its ${locale} equivalent: ${JSON.stringify(frServiceUrls)} ; any /fr/ressources/articles/<slug>/ becomes /${locale}/ressources/articles/<slug>/ (slug unchanged).`,
    `- SEO for this market: the primary keyword "${k.primary}" must appear — in its natural written form — in title, seoTitle, metaDescription and the first sentence; weave the secondary keywords (${k.secondary.map((s) => `"${s}"`).join(", ")}) naturally — at least one question heading must contain one. Keywords are raw queries: never copy them verbatim (see KEYWORD USAGE below).`,
    KEYWORD_USAGE_PROMPT_EN,
    "- No prices, no quote tool, no AI assistant, no e-mail address, no guarantees, no US-person structuring. Do not add facts that are not in the French.",
    `- tags: exactly ${frArticle.tags.length} tags (same number as the French), translated, lowercase. referenceLabels: exactly ${frArticle.references.length} translated labels, one per French reference label, same order (keep the leading domain as is).`,
    "",
    translationRepair.requirementsBlock({ frBody, expected, primary: k.primary }),
    problems.length
      ? [
          "",
          "YOUR PREVIOUS ATTEMPT WAS REJECTED by the automatic validator with these exact errors:",
          ...problems.map((p) => `- ${p}`),
          "Fix every one of them while respecting ALL the limits and counts above, and return the corrected FULL output (all fields, full content) — not a diff.",
        ].join("\n")
      : "",
    "",
    "FRENCH SOURCE:",
    JSON.stringify(
      {
        title: frArticle.title,
        seoTitle: frArticle.seoTitle,
        metaDescription: frArticle.metaDescription,
        description: frArticle.description,
        imageAlt: frArticle.imageAlt,
        tags: frArticle.tags,
        referenceLabels: frArticle.references.map((r) => r.labelKey),
        content: frBody,
      },
      null,
      2,
    ),
    "",
    "Output STRICT JSON:",
    JSON.stringify({
      title: "", seoTitle: "", metaDescription: "", description: "", imageAlt: "",
      tags: ["…"], referenceLabels: ["…"], content: "<full Markdown>",
    }),
  ]
    .filter((l) => l !== "")
    .join("\n");
}

function KEY(locale, which) {
  return which === "facts" ? rules.KEY_FACTS_HEADINGS[locale] : rules.FAQ_HEADINGS[locale];
}

// ─────────────────────────────────────────────────────────────────────────
// References
// ─────────────────────────────────────────────────────────────────────────

async function fetchPageTitle(url) {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(t);
    const html = await res.text();
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return m ? m[1].replace(/\s+/g, " ").trim().slice(0, 90) : "";
  } catch {
    return "";
  }
}

/**
 * HTTP-validate candidate references; keep allowlisted + reachable ones that
 * are OFFICIAL (isOfficialReference — Ridger articles make legal/tax/permit
 * statements, so non-official sources are rejected outright), max 2 per
 * hostname, max 8. Falls back to the backlog's official sources.
 */
async function buildValidatedReferences(candidates, item) {
  const clean = (list) =>
    (Array.isArray(list) ? list : [])
      .filter((r) => r && typeof r.url === "string" && /^https:\/\//.test(r.url))
      .filter((r) => !isBlockedDomain(r.url))
      .filter((r) => {
        if (isOfficialReference(r.url)) return true;
        console.warn(`[refs] rejected non-official source ${r.url}`);
        return false;
      })
      .map((r) => ({ labelKey: String(r.labelKey || "").trim() || extractDomain(r.url) || r.url, url: r.url.trim() }));

  let pool = clean(candidates);
  const fallback = [];
  for (const url of item.officialSources || []) {
    if (!pool.some((r) => r.url === url)) {
      const host = (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return url;
        }
      })();
      fallback.push({ labelKey: host, url, _fallback: true });
    }
  }
  pool = [...pool, ...clean(fallback).map((r) => ({ ...r, _fallback: true }))];

  let valid;
  if (OFFLINE_MODE) {
    valid = pool;
  } else {
    const res = await validateReferences(pool, {
      timeout: parseInt(process.env.LINK_CHECK_TIMEOUT_MS || "10000", 10),
      minBytes: parseInt(process.env.LINK_CHECK_MIN_BYTES || "600", 10),
    });
    valid = res.valid;
    for (const bad of res.invalid) {
      console.warn(`[refs] dropped ${bad.url} (${bad._validation?.reason || bad._validation?.error || "invalid"})`);
    }
  }

  const perHost = new Map();
  const out = [];
  for (const r of valid) {
    const host = extractDomain(r.url) || r.url;
    const n = perHost.get(host) || 0;
    if (n >= 2 || out.length >= 8) continue;
    perHost.set(host, n + 1);
    let labelKey = r.labelKey;
    if (r._fallback && !OFFLINE_MODE) {
      const title = await fetchPageTitle(r.url);
      if (title) labelKey = `${host} — ${title}`;
    }
    out.push({ labelKey, url: r.url });
  }
  const official = out.filter((r) => isOfficialReference(r.url)).length;
  return { references: out, official };
}

const { stripReferencesSection } = translationRepair;

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

// ─────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────

function validateLocaleArticle(article, { locale, keywords, allowedPaths, frArticle }) {
  const problems = [];
  for (const v of rules.checkHardRules(article)) {
    problems.push(`[${v.code}] ${v.message}${v.excerpt ? ` — « ${v.excerpt} »` : ""}`);
  }
  const seo = rules.checkSeoStructure(article, {
    locale,
    keywords: keywords[locale],
    allowedInternalPaths: allowedPaths[locale],
    isTrustedDomain: (url) => !isBlockedDomain(url),
    checkSlug: locale === "fr",
  });
  // Word limits apply to FR; translations are checked for parity instead.
  const seoErrors = locale === "fr"
    ? seo.errors
    : seo.errors.filter((e) => !/^word count/.test(e));
  problems.push(...seoErrors);
  if (locale === "fr") {
    const w = seo.stats.words;
    if (w < MIN_WORDS * 0.9) problems.push(`word count ${w} is below the target ${MIN_WORDS}`);
  }
  // Legal/tax/permit statements must rest on official sources only.
  problems.push(...checkOfficialOnlyReferences(article));
  if (extractOutdatedSwissVatRateMatches(article).length) {
    problems.push("mentions an outdated Swiss VAT rate (current: 8.1 % / 2.6 % / 3.8 %)");
  }
  if (frArticle) {
    const num = rules.compareNumberParity(frArticle.content, article.content);
    if (!num.ok) {
      problems.push(`number parity with FR failed — missing: ${num.missing.join(", ") || "none"}; extra: ${num.extra.join(", ") || "none"}`);
    }
    const st = rules.compareStructure(frArticle.content, article.content);
    if (!st.ok) problems.push(`structure differs from FR (${st.diffs.join("; ")})`);
    if (article.title === frArticle.title || article.content === frArticle.content) {
      problems.push("translation is identical to the French");
    }
    if (!Array.isArray(article.tags) || article.tags.length !== frArticle.tags.length) {
      problems.push(`tags must have exactly ${frArticle.tags.length} entries`);
    }
  }
  return { problems, warnings: seo.warnings, stats: seo.stats };
}

function checkTopicGuardrails(frArticles, candidate) {
  const sorted = sortArticlesNewestFirst(frArticles);
  const recent = sorted.slice(0, TOPIC_ROTATION_WINDOW);
  const title = findRecentTitleConflict(recent, candidate, { windowSize: TOPIC_ROTATION_WINDOW });
  if (title) return `title too close to "${title.previousTitle}"`;
  const topic = findRecentTopicConflict(recent, candidate, { windowSize: TOPIC_ROTATION_WINDOW });
  if (topic) {
    return topic.code === "TOPIC_DUPLICATE"
      ? `repeats recent topic "${describeTopic(topic.topic)}" ("${topic.previousTitle}")`
      : `too similar to "${topic.previousTitle}"`;
  }
  const dup = findAllTimeNearDuplicate(sorted, candidate);
  if (dup) return `near-duplicates "${dup.previousTitle}" (${dup.previousSlug})`;
  if (frArticles.some((a) => a.slug === candidate.slug)) return `slug ${candidate.slug} already exists`;
  return null;
}

function ensureSlug(proposed, primary, title) {
  let slug = slugify(proposed || "");
  const primaryTokens = significantTokens(primary);
  const slugTokens = slug.split("-");
  const covered = primaryTokens.filter((t) => slugTokens.some((s) => s === t || s.startsWith(t.slice(0, 5)))).length;
  if (!slug || (primaryTokens.length && covered / primaryTokens.length < 0.6)) {
    const extra = significantTokens(title).filter((t) => !primaryTokens.includes(t)).slice(0, 3);
    slug = slugify([primary, ...extra].join(" "));
  }
  return slug.slice(0, 80).replace(/-+$/, "");
}

function normalizeTags(tags, primary) {
  const out = [];
  for (const t of [...(Array.isArray(tags) ? tags : []), primary]) {
    const v = String(t || "").toLowerCase().trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out.slice(0, 6);
}

// ─────────────────────────────────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────────────────────────────────

async function selectTopic({ backlog, frArticles }) {
  if (FORCE_TOPIC) {
    const forced = resolveForcedTopic(backlog, {
      topic: FORCE_TOPIC,
      keywords: FORCE_TOPIC_KEYWORDS,
      category: FORCE_TOPIC_CATEGORY,
    });
    log(`📌 Forced topic: ${forced.id}${forced.adhoc ? " (ad hoc)" : ""}`);
    return { item: forced, ranked: [], demand: {}, forced: true };
  }
  const { ranked, excluded, lastCategory } = rankBacklogCandidates({
    backlog,
    articles: frArticles,
    skipRotation: SKIP_TOPIC_ROTATION,
  });
  log(`📋 Backlog: ${ranked.length} eligible, ${excluded.length} excluded (last category: ${lastCategory || "n/a"})`);
  if (!ranked.length) throw new Error("No eligible backlog item — add topics to data/article-backlog.json");
  const demand = {};
  for (const c of ranked.slice(0, 3)) {
    demand[c.item.id] = OFFLINE_MODE ? 0 : await probeDemand(c.item, { avoidTerms: backlog.arkCoreTerms?.fr || [], state: KEYWORD_RESEARCH_STATE, log });
  }
  const choice = chooseWithDemand(ranked, demand);
  log(`🎯 Topic: ${choice.item.id} [${choice.item.category}/${choice.item.theme}] score=${choice.total.toFixed(1)} demand=${choice.demand}`);
  return { item: choice.item, ranked: ranked.slice(0, 5), demand, forced: false };
}

async function researchKeywords({ item, backlog }) {
  log("🔎 Keyword research (autocomplete Google → Bing → DuckDuckGo, else stored, else seeds; 5 locales)…");
  const raw = await researchAllLocales(item, { avoidTermsByLocale: backlog.arkCoreTerms || {}, log, state: KEYWORD_RESEARCH_STATE });
  for (const l of LOCALES) {
    log(`   ${l} [${raw[l].markets.join(", ")}] primary="${raw[l].primary}" secondary=${raw[l].secondary.length} questions=${raw[l].questions.length} (${raw[l].stats.source}, ${raw[l].stats.suggestions} suggestions)`);
  }
  log(`🔑 Keyword source: ${LOCALES.map((l) => `${l}=${raw[l].stats.source}`).join(", ")}`);
  const { aligned, count, ok } = alignKeywordSets(raw);
  // Hard floor of 3 (below that the H2/keyword checks become meaningless);
  // 3–4 only warns so a temporary autocomplete block on CI runners (backlog
  // fallback = 3–5 targets) does not stop publication.
  if (count < 3) throw new Error(`only ${count} secondary keywords available in every locale (min 3) — enrich targetKeywords for ${item.id}`);
  if (!ok) console.warn(`⚠️ only ${count} secondary keywords aligned across locales (target ≥ 5)`);
  const keywords = {};
  for (const l of LOCALES) keywords[l] = { ...aligned[l], questions: raw[l].questions };
  let trend = { available: false, checked: 0, matches: [] };
  try {
    trend = await fetchTrendSignal(keywords);
  } catch {
    // best effort
  }
  log(`📈 Trend signal: ${trend.available ? `${trend.checked} CH trending items, ${trend.matches.length} match(es)` : "unavailable (ignored)"}`);
  return { keywords, raw, trend };
}

/**
 * One research round (topic outline + validated official references).
 * @returns {Promise<{ok:true, research, references, provider} | {ok:false, error:Error, retryHint:string}>}
 */
async function researchOnce({ item, keywords, frArticles, today, attempt, retryHint }) {
  log(`🧭 Research attempt ${attempt}/${MAX_RESEARCH_ATTEMPTS}…`);
  const existing = sortArticlesNewestFirst(frArticles).map((a) => ({ slug: a.slug, title: a.title }));
  const { provider, json } = await callResearchModel(
    buildResearchPrompt({ item, keywords, existing, today, retryHint }),
    { item, keywords, today, attempt },
  );
  const research = json?.research || json;
  if (!research || !research.title) {
    return { ok: false, error: new Error("research payload missing title"), retryHint: "La réponse précédente était invalide : renvoie l'objet research complet." };
  }
  research.slug = ensureSlug(research.slug, keywords.fr.primary, research.title);
  const conflict = checkTopicGuardrails(frArticles, {
    slug: research.slug,
    title: research.title,
    description: research.description || "",
  });
  if (conflict) {
    const error = new Error(`research topic rejected: ${conflict}`);
    console.warn(`   ↳ ${error.message}`);
    return { ok: false, error, retryHint: `Sujet rejeté (${conflict}). Garde le thème mais prends un angle nettement différent, avec un nouveau titre et un nouveau slug.` };
  }
  const { references, official } = await buildValidatedReferences(research.references, item);
  log(`🔗 References: ${references.length} valid (${official} official) via ${provider}`);
  if (official < MIN_OFFICIAL_REFERENCES || official !== references.length) {
    const error = new Error(`not enough verifiable official references (${references.length} valid, ${official} official)`);
    console.warn(`   ↳ ${error.message}`);
    return { ok: false, error, retryHint: "Les références précédentes étaient invalides ou non officielles : fournis des URL officielles exactes (admin.ch, fedlex, estv, sem, ch.ch, sites cantonaux)." };
  }
  return { ok: true, research, references, provider };
}

/** Dry run: research outline only (no draft, no translation). */
async function researchOutline({ item, keywords, frArticles, today }) {
  let retryHint = "";
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RESEARCH_ATTEMPTS; attempt++) {
    const r = await researchOnce({ item, keywords, frArticles, today, attempt, retryHint });
    if (r.ok) return r;
    lastError = r.error;
    retryHint = r.retryHint;
  }
  throw lastError || new Error("research failed");
}

async function generateFrench({ item, keywords, frArticles, servicePathMaps, allowedPaths, today }) {
  let retryHint = "";
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RESEARCH_ATTEMPTS; attempt++) {
    const r = await researchOnce({ item, keywords, frArticles, today, attempt, retryHint });
    if (!r.ok) {
      lastError = r.error;
      retryHint = r.retryHint;
      continue;
    }
    const { research, references, provider } = r;

    const draft = await callDraftModel(
      buildDraftPrompt({ item, research, references, keywords, servicePathMaps, today }),
      "draft-fr",
      { item, research, references, keywords, servicePathMaps, today },
    );
    let article = finalizeFrench(draft?.newArticle || draft, { research, references, item, keywords, today });

    for (let round = 0; round <= MAX_REPAIRS; round++) {
      const { problems, warnings, stats } = validateLocaleArticle(article, { locale: "fr", keywords, allowedPaths });
      const conflict2 = checkTopicGuardrails(frArticles, article);
      if (conflict2) problems.push(`topic guardrail: ${conflict2}`);
      warnings.forEach((w) => console.warn(`   ⚠️ fr: ${w}`));
      if (!problems.length) {
        log(`✅ FR article valid (${stats.words} words, ${stats.questionH2} question H2, FAQ ${stats.faq})`);
        return { article, research, references, provider };
      }
      console.warn(`   ✗ FR validation (round ${round}): ${problems.length} problem(s)\n     - ${problems.slice(0, 12).join("\n     - ")}`);
      if (round === MAX_REPAIRS) break;
      const fixed = await callDraftModel(
        buildRepairPrompt({ article: pickEditable(article), problems, keywords, servicePathMaps, item, today }),
        `repair-fr-${round + 1}`,
        { article: pickEditable(article), problems, keywords, servicePathMaps, item, today },
      );
      article = finalizeFrench(fixed?.newArticle || fixed, { research, references, item, keywords, today, base: article });
    }
    lastError = new Error("FR draft failed validation after repairs");
    retryHint = "Le brouillon précédent n'a pas passé les contrôles ; respecte strictement la structure et les règles.";
  }
  throw lastError || new Error("FR generation failed");
}

function pickEditable(a) {
  return {
    slug: a.slug,
    title: a.title,
    seoTitle: a.seoTitle,
    metaDescription: a.metaDescription,
    description: a.description,
    imageAlt: a.imageAlt,
    tags: a.tags,
    content: stripReferencesSection(a.content),
  };
}

function finalizeFrench(raw, { research, references, item, keywords, today, base = null }) {
  const src = raw && typeof raw === "object" ? raw : {};
  const pick = (k) => (typeof src[k] === "string" && src[k].trim() ? src[k].trim() : (base?.[k] ?? research[k] ?? ""));
  let content = pick("content").replace(/^#\s+.*\n+/, "");
  content = sanitizeExternalLinks(content, references);
  content = appendReferencesSection(content, references, "fr");
  return normalizeArticleCasing({
    slug: base?.slug || research.slug,
    author: "Ridger",
    image: DEFAULT_IMAGE,
    date: today,
    updated: today,
    references: references.map((r) => ({ labelKey: r.labelKey, url: r.url })),
    category: item.category,
    tags: normalizeTags(Array.isArray(src.tags) && src.tags.length ? src.tags : base?.tags, keywords.fr.primary),
    title: pick("title"),
    description: pick("description"),
    content,
    seoTitle: pick("seoTitle"),
    metaDescription: pick("metaDescription"),
    imageAlt: pick("imageAlt"),
    keywords: { primary: keywords.fr.primary, secondary: keywords.fr.secondary },
    backlogId: item.id,
  }, "fr");
}

function assembleTranslation(tr, { frArticle, keywords, locale }) {
  const labels = Array.isArray(tr?.referenceLabels) ? tr.referenceLabels : [];
  const references = frArticle.references.map((r, i) => ({
    labelKey: typeof labels[i] === "string" && labels[i].trim() ? labels[i].trim() : r.labelKey,
    url: r.url,
  }));
  const body = sanitizeExternalLinks(stripReferencesSection(String(tr?.content || "").replace(/^#\s+.*\n+/, "")), frArticle.references);
  return normalizeArticleCasing({
    slug: frArticle.slug,
    author: frArticle.author,
    image: frArticle.image,
    date: frArticle.date,
    updated: frArticle.updated,
    references,
    category: frArticle.category,
    tags: (Array.isArray(tr?.tags) ? tr.tags : []).map((t) => String(t).toLowerCase().trim()).filter(Boolean),
    title: String(tr?.title || "").trim(),
    description: String(tr?.description || "").trim(),
    content: appendReferencesSection(body, references, locale),
    seoTitle: String(tr?.seoTitle || "").trim(),
    metaDescription: String(tr?.metaDescription || "").trim(),
    imageAlt: String(tr?.imageAlt || "").trim(),
    keywords: { primary: keywords[locale].primary, secondary: keywords[locale].secondary },
    backlogId: frArticle.backlogId,
  }, locale);
}

/**
 * One locale: translate → targeted link repair → targeted field-length fit →
 * full validation. On failure the next attempt retranslates with the exact
 * errors, limits and counts; the final attempt escalates to the draft
 * deployment. Nothing is relaxed: the result must pass validateLocaleArticle.
 */
async function translateLocale({ locale, frArticle, keywords, servicePathMaps, allowedPaths }) {
  const frBody = stripReferencesSection(frArticle.content);
  const expected = translationRepair.expectedLinks(frBody, locale, servicePathMaps);
  const localeName = LOCALE_NAMES[locale];
  let problems = [];
  for (let attempt = 1; attempt <= MAX_TRANSLATION_ATTEMPTS; attempt++) {
    const strong = MAX_TRANSLATION_ATTEMPTS > 1 && attempt === MAX_TRANSLATION_ATTEMPTS;
    const call = (prompt, label) => callTranslateModel(prompt, label, { locale, frArticle, keywords, servicePathMaps, problems }, { strong });
    log(`🌍 ${locale}: translation attempt ${attempt}/${MAX_TRANSLATION_ATTEMPTS}${strong ? ` (escalated to ${strongTranslateDeploymentName()})` : ""}`);
    const tr = await call(buildTranslatePrompt({ locale, frArticle, keywords, servicePathMaps, problems }), `translate-${locale}`);
    let article = assembleTranslation(tr, { frArticle, keywords, locale });

    // Links: programmatic parity check, then one targeted repair call.
    const body = stripReferencesSection(article.content);
    const fixedLinks = await translationRepair.repairLinks({ locale, localeName, localeBody: body, expected, call, log });
    if (fixedLinks?.repaired) {
      article = { ...article, content: appendReferencesSection(sanitizeExternalLinks(fixedLinks.content, frArticle.references), article.references, locale) };
    }

    // Lengths: small "rewrite to ≤ N characters" call instead of retranslating.
    const fit = await translationRepair.fitFieldLengths({
      article,
      locale,
      localeName,
      primary: keywords[locale].primary,
      call,
      context: article.description,
      log,
    });
    article = normalizeArticleCasing(fit.article, locale);

    const res = validateLocaleArticle(article, { locale, keywords, allowedPaths, frArticle });
    res.warnings.forEach((w) => console.warn(`   ⚠️ ${locale}: ${w}`));
    if (!res.problems.length) {
      log(`✅ ${locale} valid`);
      return article;
    }
    problems = res.problems;
    console.warn(`   ✗ ${locale}: ${problems.length} problem(s)\n     - ${problems.slice(0, 10).join("\n     - ")}`);
  }
  throw new Error(`${locale} translation failed validation after ${MAX_TRANSLATION_ATTEMPTS} attempts`);
}

async function translateAll({ frArticle, keywords, servicePathMaps, allowedPaths }) {
  const out = {};
  for (const locale of TARGET_LOCALES) {
    out[locale] = await translateLocale({ locale, frArticle, keywords, servicePathMaps, allowedPaths });
  }
  return out;
}

function nextResearchLog(entry) {
  let logData = { entries: [] };
  if (fs.existsSync(RESEARCH_LOG)) {
    try {
      logData = loadJSON(RESEARCH_LOG);
    } catch {
      logData = { entries: [] };
    }
  }
  logData.entries = Array.isArray(logData.entries) ? logData.entries : [];
  logData.entries.push(entry);
  logData.entries = logData.entries.slice(-200);
  return logData;
}

/**
 * Append the new article to all 5 locale files (and the research-log entry)
 * all-or-nothing: every file is serialized, parsed back and re-checked first;
 * only then are temp files swapped in (with rollback). On any failure the
 * working tree is left unchanged.
 */
function writeArticleAtomically({ data, byLocale, researchLog, files = {} }) {
  const slug = byLocale.fr.slug;
  const next = Object.fromEntries(
    LOCALES.map((l) => [l, { ...data[l], Articles: [...(data[l].Articles || []), byLocale[l]] }]),
  );
  const expectedSlugs = next.fr.Articles.map((a) => a.slug);
  const pathFor = (l) => (files[l] || ressourcesPath(l));
  const logPath = files.researchLog || RESEARCH_LOG;
  const localeOf = new Map(LOCALES.map((l) => [pathFor(l), l]));
  const entries = LOCALES.map((l) => ({ file: pathFor(l), data: next[l] }));
  if (researchLog) entries.push({ file: logPath, data: researchLog });
  writeJsonFilesAtomically(entries, {
    validate(parsed, file) {
      const locale = localeOf.get(file);
      if (!locale) return;
      const arts = Array.isArray(parsed?.Articles) ? parsed.Articles : null;
      if (!arts) throw new Error(`${locale}: Articles missing after serialization`);
      if (arts.length !== expectedSlugs.length || arts.some((a, i) => a.slug !== expectedSlugs[i])) {
        throw new Error(`${locale}: Articles not index-aligned with FR after serialization`);
      }
      if (arts.filter((a) => a.slug === slug).length !== 1) throw new Error(`${locale}: slug ${slug} must appear exactly once`);
      const article = arts[arts.length - 1];
      const hard = rules.checkHardRules(article);
      if (hard.length) throw new Error(`${locale}: hard rule ${hard[0].code} after serialization`);
      const refs = checkOfficialOnlyReferences(article);
      if (refs.length) throw new Error(`${locale}: ${refs[0]}`);
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  const today = isoToday();
  log(`▶️ Mode: ${PLAN_ONLY ? "plan-only (topic + keywords, no Azure)" : DRY_RUN ? "dry-run (topic + keywords + research outline; no article generation, nothing written)" : APPLY ? "apply" : "no-write (full generation, nothing written)"}`);
  const data = {};
  for (const l of LOCALES) data[l] = loadJSON(ressourcesPath(l));
  const frArticles = Array.isArray(data.fr.Articles) ? data.fr.Articles : [];
  for (const l of TARGET_LOCALES) {
    const arr = data[l].Articles || [];
    if (arr.length !== frArticles.length || arr.some((a, i) => a.slug !== frArticles[i].slug)) {
      throw new Error(`${l}/ressources.json Articles are not index-aligned with FR — fix before generating`);
    }
  }

  const backlog = loadBacklog(ROOT);
  const backlogProblems = validateBacklog(backlog);
  if (backlogProblems.length) throw new Error(`Backlog invalid:\n- ${backlogProblems.join("\n- ")}`);

  const servicePathMaps = rules.loadServicePathMaps(ROOT);
  const slugs = frArticles.map((a) => a.slug);

  const topic = await selectTopic({ backlog, frArticles });
  const { keywords, raw, trend } = await researchKeywords({ item: topic.item, backlog });

  if (PLAN_ONLY) {
    log("\n=== PLAN (no Azure call, nothing written) ===");
    log(JSON.stringify({ topic: topic.item, candidates: topic.ranked.map((c) => ({ id: c.item.id, score: +c.score.toFixed(1), reasons: c.reasons })), demand: topic.demand, keywords, trend }, null, 2));
    return;
  }

  ensureAzureConfigured();

  if (DRY_RUN) {
    // Same stopping point as the switzerlandresidency.ch pipeline: topic,
    // keywords and the research outline — no article generation, no writes.
    log("\n[dry-run] Topic + keyword research done; building the research outline only (no draft, no translations).");
    const { research, references, provider } = await researchOutline({ item: topic.item, keywords, frArticles, today });
    log("\n=== DRY RUN — OUTLINE (no article generated, nothing written) ===");
    log(JSON.stringify({
      topic: { id: topic.item.id, category: topic.item.category, theme: topic.item.theme, forced: topic.forced },
      keywords: Object.fromEntries(LOCALES.map((l) => [l, { primary: keywords[l].primary, secondary: keywords[l].secondary }])),
      provider,
      slug: research.slug,
      title: research.title,
      seoTitle: research.seoTitle,
      metaDescription: research.metaDescription,
      directAnswer: research.directAnswer,
      outline: research.outline,
      faq: research.faq,
      recentDevelopments: research.recentDevelopments,
      references,
    }, null, 2));
    log("\n[dry-run] Stopped before article generation — nothing written.");
    return;
  }

  const { article: frArticle, research, provider } = await generateFrench({
    item: topic.item,
    keywords,
    frArticles,
    servicePathMaps,
    allowedPaths: Object.fromEntries(LOCALES.map((l) => [l, rules.buildAllowedInternalPaths(l, { servicePathMaps, articleSlugs: slugs })])),
    today,
  });
  const allowedPaths = Object.fromEntries(
    LOCALES.map((l) => [l, rules.buildAllowedInternalPaths(l, { servicePathMaps, articleSlugs: [...slugs, frArticle.slug] })]),
  );
  const translations = await translateAll({ frArticle, keywords, servicePathMaps, allowedPaths });

  // Structural parity across locales (the build's key-parity is index-based).
  const byLocale = { fr: frArticle, ...translations };
  const keySig = (a) => JSON.stringify(Object.keys(a)) + `|tags:${a.tags.length}|refs:${a.references.length}|kw:${a.keywords.secondary.length}`;
  for (const l of TARGET_LOCALES) {
    if (keySig(byLocale[l]) !== keySig(frArticle)) throw new Error(`${l} record shape differs from FR`);
  }

  if (!APPLY) {
    log("\n[no-write] Article generated and validated — not written.");
    log(JSON.stringify({ slug: frArticle.slug, title: frArticle.title, seoTitle: frArticle.seoTitle, metaDescription: frArticle.metaDescription, keywords: frArticle.keywords }, null, 2));
    log(frArticle.content);
    return;
  }

  const researchLog = nextResearchLog({
    date: today,
    slug: frArticle.slug,
    backlogId: topic.item.id,
    forced: topic.forced,
    researchProvider: provider,
    demand: topic.demand,
    trend,
    keywords: Object.fromEntries(LOCALES.map((l) => [l, { ...keywords[l], markets: raw[l].markets, stats: raw[l].stats }])),
    recentDevelopments: research.recentDevelopments || [],
  });
  writeArticleAtomically({ data, byLocale, researchLog });
  log(`\n✅ Appended "${frArticle.title}" (${frArticle.slug}) to 5 locales.`);
  setOutput("has_new", "true");
  setOutput("slug", frArticle.slug);
  setOutput("title", frArticle.title);

  if (TRANSLATE_EXISTING) {
    const { spawnSync } = require("child_process");
    log("Translating any untranslated existing articles…");
    const r = spawnSync("node", ["scripts/translate-articles.js", "--apply"], { stdio: "inherit", env: process.env });
    if (r.status !== 0) throw new Error(`translate-articles.js failed (${r.status})`);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`❌ ${error.message || error}`);
    process.exit(1);
  });
}

module.exports = {
  appendReferencesSection,
  assembleTranslation,
  buildValidatedReferences,
  writeArticleAtomically,
  buildDraftPrompt,
  buildResearchPrompt,
  buildTranslatePrompt,
  ensureSlug,
  normalizeTags,
  sanitizeExternalLinks,
  stripReferencesSection,
  validateLocaleArticle,
  VERIFIED_FACTS,
};
