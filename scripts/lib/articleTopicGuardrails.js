"use strict";

const TOPIC_KEYWORDS = [
  {
    topic: "odoo",
    label: "Odoo / ERP",
    patterns: [
      /odoo/i,
      /\berp\b/i,
      /erp 17/i,
      /erp 18/i,
      /odoo[\s\S]{0,80}comptabil/i,
      /comptabil[\s\S]{0,80}odoo/i,
      /odoo[\s\S]{0,80}\bTVA\b/i,
      /\bTVA\b[\s\S]{0,80}odoo/i,
      /plan comptable[\s\S]{0,80}odoo/i,
      /odoo[\s\S]{0,80}plan comptable/i,
    ],
  },
  {
    topic: "payroll",
    label: "Paie & salaires",
    patterns: [
      /\bpaie\b/i,
      /\bpayroll\b/i,
      /\bsalaires?\b/i,
      /swissdec/i,
      /cotisation/i,
      /\bLPP\b/i,
      /\bLAA\b/i,
      /\bAVS\b/i,
    ],
  },
  {
    topic: "tax",
    label: "Fiscalité & TVA",
    patterns: [
      /fisc/i,
      /imp[oô]t/i,
      /\btax/i,
      /\bTVA\b/i,
      /\bVAT\b/i,
      /\bIFD\b/i,
    ],
  },
  {
    topic: "audit",
    label: "Audit & révision",
    patterns: [
      /audit/i,
      /r[ée]vision/i,
      /contr[oô]le ordinaire/i,
      /contr[oô]le restreint/i,
      /organe de r[ée]vision/i,
      /rapport de r[ée]vision/i,
      /seuils? de r[ée]vision/i,
    ],
  },
  {
    topic: "accounting",
    label: "Comptabilité & reporting",
    patterns: [
      /comptabil/i,
      /comptable/i,
      /cl[oô]ture/i,
      /closing/i,
      /reporting/i,
      /bilan/i,
      /FER/i,
      /contr[oô]le interne/i,
      /s[ée]paration des t[âa]ches/i,
      /acc[èe]s bancaires/i,
      /matrice d.?acc[èe]s/i,
    ],
  },
  {
    topic: "corporate",
    label: "Corporate & gouvernance",
    patterns: [
      /corporate/i,
      /gouvernance/i,
      /assembl[ée]/i,
      /\bAG\b/i,
      /PV/i,
      /conseil d'administration/i,
      /ayant[s]? droit[s]? [ée]conomique[s]?/i,
      /registre des actions/i,
      /registre des parts/i,
      /transparence/i,
      /\bSA\b.*\bS[àa]rl\b/i,
      /\bS[àa]rl\b.*\bSA\b/i,
    ],
  },
  {
    topic: "domiciliation",
    label: "Domiciliation & siège",
    patterns: [/domicil/i],
  },
  {
    topic: "outsourcing",
    label: "Outsourcing & BPO",
    patterns: [/outsourcing/i, /externalisation/i, /\bBPO\b/i],
  },
  {
    topic: "ma",
    label: "Fusions & acquisitions",
    patterns: [/fusion/i, /acquisition/i, /\bM&A\b/i, /m&a/i, /due diligence/i],
  },
  {
    topic: "family-office",
    label: "Family office & patrimoine",
    patterns: [
      /family.?office/i,
      /patrimoine/i,
      /succession/i,
      /h[ée]rit/i,
      /gouvernance familiale/i,
      /\bHNI\b/i,
      /fortune/i,
      /wealth/i,
    ],
  },
  {
    topic: "incorporation",
    label: "Incorporation & constitution",
    patterns: [
      /incorporation/i,
      /constitution/i,
      /créer/i,
      /fondation/i,
      /création d'entreprise/i,
      /registre du commerce/i,
      /registre[- ]?commerce/i,
      /\binscript/i,
      /raison sociale/i,
      /\bzefix\b/i,
      /capital social/i,
      /statuts/i,
      /succursale/i,
    ],
  },
  {
    topic: "immigration",
    label: "Immigration & mobilité",
    patterns: [
      /immigration/i,
      /permis/i,
      /\bANobAG\b/i,
      /mobilit/i,
      /expat/i,
      /expatri/i,
    ],
  },
  {
    topic: "finance",
    label: "Conseil financier",
    patterns: [
      /tr[eé]sorerie/i,
      /treasury/i,
      /finance/i,
      /cash[- ]?flow/i,
      /paiements?/i,
      /retards? de paiement/i,
      /budget/i,
      /forecast/i,
    ],
  },
  {
    topic: "regulatory",
    label: "Conformité réglementaire (SRO/OAR, LBA/AML, FINMA)",
    patterns: [
      /\bSRO\b/i,
      /\bOAR\b/i,
      /\bLBA\b/i,
      /\bAML\b/i,
      /\bFINMA\b/i,
      /blanchiment/i,
      /anti[- ]?money/i,
      /conformit[ée]/i,
      /r[ée]glement/i,
      /licence/i,
      /autorisation/i,
      /agr[ée]ment/i,
      /surveillance/i,
      /self[- ]?regul/i,
      /organisme.*auto/i,
    ],
  },
];

const TOPIC_TOKEN_STOP_WORDS = new Set([
  "suisse",
  "geneve",
  "guide",
  "pratique",
  "entreprise",
  "entreprises",
  "article",
  "obligations",
  "etapes",
  "erreurs",
  "couts",
]);

const TITLE_TOKEN_STOP_WORDS = new Set([
  "a",
  "au",
  "aux",
  "avec",
  "ce",
  "ces",
  "comment",
  "complete",
  "complet",
  "complets",
  "dans",
  "de",
  "des",
  "du",
  "en",
  "et",
  "france",
  "geneve",
  "guide",
  "la",
  "le",
  "les",
  "modele",
  "nouveautes",
  "ou",
  "pour",
  "pratique",
  "quand",
  "quel",
  "quels",
  "quelle",
  "quelles",
  "romande",
  "sur",
  "suisse",
  "the",
  "une",
  "un",
  "vos",
  "votre",
]);

// Measured corpus pairs: genuinely different articles in the same topic
// family (e.g. Odoo QR-invoice/bank reconciliation vs Odoo access control)
// score ≤0.15; every confirmed duplicate scores ≥0.20. True clones are also
// caught independently by findAllTimeNearDuplicate below, so this windowed
// heuristic no longer needs to be aggressive.
const SAME_TOPIC_DUPLICATE_MIN_SCORE = 0.18;
const SAME_TOPIC_DUPLICATE_MIN_OVERLAP = 4;

function normalizeGuardrailText(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeArticleTitle(title) {
  return normalizeGuardrailText(title);
}

function detectTopic(article) {
  if (!article) return "general";
  const base = `${article.slug || ""} ${article.title || ""} ${
    article.description || ""
  }`.toLowerCase();
  let bestTopic = "general";
  let bestScore = 0;
  for (const entry of TOPIC_KEYWORDS) {
    const score = entry.patterns.reduce(
      (count, rx) => count + (rx.test(base) ? 1 : 0),
      0,
    );
    if (score > bestScore) {
      bestTopic = entry.topic;
      bestScore = score;
    }
  }
  return bestTopic;
}

function describeTopic(topic) {
  const entry = TOPIC_KEYWORDS.find((candidate) => candidate.topic === topic);
  return entry ? entry.label : "Thème général";
}

function getTopicTokens(article) {
  if (!article) return new Set();
  const corpus = normalizeGuardrailText(
    `${article.slug || ""} ${article.title || ""} ${article.description || ""}`,
  );
  return new Set(
    corpus
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 4 &&
          !TOPIC_TOKEN_STOP_WORDS.has(token) &&
          !/^\d+$/.test(token),
      ),
  );
}

function getTopicSimilarityDetails(tokensA, tokensB) {
  if (!tokensA.size || !tokensB.size) {
    return { score: 0, overlap: 0 };
  }
  const overlap = Array.from(tokensA).filter((token) => tokensB.has(token))
    .length;
  const union = new Set([...tokensA, ...tokensB]).size;
  const score = union ? overlap / union : 0;
  return { score, overlap };
}

function getTitleFingerprint(article) {
  const corpus = normalizeGuardrailText(
    `${article?.title || ""} ${article?.slug || ""}`,
  );
  return new Set(
    corpus
      .split(/\s+/)
      .filter(
        (token) =>
          token.length >= 4 &&
          !TITLE_TOKEN_STOP_WORDS.has(token) &&
          !/^20\d{2}$/.test(token) &&
          !/^\d+$/.test(token),
      ),
  );
}

function getTitleSimilarityDetails(tokensA, tokensB) {
  if (!tokensA.size || !tokensB.size) {
    return { overlap: 0, overlapRatio: 0, score: 0 };
  }
  const overlap = Array.from(tokensA).filter((token) => tokensB.has(token))
    .length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return {
    overlap,
    overlapRatio: overlap / Math.min(tokensA.size, tokensB.size),
    score: union ? overlap / union : 0,
  };
}

function sortArticlesByDateDesc(articles) {
  return [...articles].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

function findRecentTitleConflict(articles, newArticle, options = {}) {
  const pool = Array.isArray(articles) ? sortArticlesByDateDesc(articles) : [];
  const windowSize = Number.isInteger(options.windowSize)
    ? Math.max(1, options.windowSize)
    : null;
  const candidates = windowSize ? pool.slice(0, windowSize) : pool;
  const normalizedTitle = normalizeArticleTitle(newArticle?.title || "");
  const nextFingerprint = getTitleFingerprint(newArticle);

  for (const article of candidates) {
    if (!article || article.slug === newArticle?.slug) continue;
    const previousTitle = normalizeArticleTitle(article.title || "");
    if (normalizedTitle && previousTitle === normalizedTitle) {
      return {
        code: "DUPLICATE_TITLE",
        previousSlug: article.slug,
        previousTitle: article.title,
      };
    }

    const details = getTitleSimilarityDetails(
      nextFingerprint,
      getTitleFingerprint(article),
    );
    if (details.overlap >= 5 && details.overlapRatio >= 0.85) {
      return {
        code: "DUPLICATE_TITLE_FINGERPRINT",
        previousSlug: article.slug,
        previousTitle: article.title,
      };
    }
  }

  return null;
}

function findRecentTopicConflict(articles, newArticle, options = {}) {
  const pool = Array.isArray(articles) ? sortArticlesByDateDesc(articles) : [];
  const windowSize = Number.isInteger(options.windowSize)
    ? Math.max(1, options.windowSize)
    : pool.length;
  const candidates = pool.slice(0, windowSize);
  const nextTopic = detectTopic(newArticle);
  const nextTokens = getTopicTokens(newArticle);

  for (const article of candidates) {
    if (!article || article.slug === newArticle?.slug) continue;
    const articleTopic = detectTopic(article);
    const details = getTopicSimilarityDetails(nextTokens, getTopicTokens(article));

    if (nextTopic !== "general" && articleTopic === nextTopic) {
      if (
        details.score >= SAME_TOPIC_DUPLICATE_MIN_SCORE &&
        details.overlap >= SAME_TOPIC_DUPLICATE_MIN_OVERLAP
      ) {
        return {
          code: "TOPIC_DUPLICATE",
          previousSlug: article.slug,
          previousTitle: article.title,
          topic: nextTopic,
          similarity: details.score,
        };
      }
      continue;
    }

    if (details.score >= 0.5 && details.overlap >= 3) {
      return {
        code: "TOPIC_SIMILAR",
        previousSlug: article.slug,
        previousTitle: article.title,
        similarity: details.score,
      };
    }
  }

  return null;
}

/**
 * All-time near-duplicate gate. The windowed checks above only look at the
 * last N articles, which let "domiciliation substance risques" clones slip
 * through months apart (Feb/Jun/Jul 2026). This compares the new article
 * against the ENTIRE corpus.
 *
 * Thresholds are calibrated on measured corpus pairs: true duplicates score
 * title overlap 5–7 at ratio 0.83–1.00; distinct same-family articles (e.g.
 * "Odoo TVA setup" vs "Odoo 18 release notes") sit at exactly 3/0.75 with LOW
 * topic-token similarity (≤0.14), while borderline true duplicates at 3/0.75
 * show HIGH topic similarity (≥0.43). Hence: a strong title match alone, or a
 * weaker title match backed by topic similarity.
 */
function findAllTimeNearDuplicate(articles, newArticle) {
  const pool = Array.isArray(articles) ? articles : [];
  const nextFingerprint = getTitleFingerprint(newArticle);
  const nextTokens = getTopicTokens(newArticle);

  for (const article of pool) {
    if (!article || article.slug === newArticle?.slug) continue;

    const titleDetails = getTitleSimilarityDetails(
      nextFingerprint,
      getTitleFingerprint(article),
    );
    const topicDetails = getTopicSimilarityDetails(
      nextTokens,
      getTopicTokens(article),
    );

    const strongTitleMatch =
      titleDetails.overlap >= 4 && titleDetails.overlapRatio >= 0.8;
    const supportedTitleMatch =
      titleDetails.overlap >= 3 &&
      titleDetails.overlapRatio >= 0.75 &&
      topicDetails.score >= 0.3;
    if (strongTitleMatch || supportedTitleMatch) {
      return {
        code: "ALL_TIME_TITLE_DUPLICATE",
        previousSlug: article.slug,
        previousTitle: article.title,
        overlap: titleDetails.overlap,
        overlapRatio: titleDetails.overlapRatio,
        topicScore: topicDetails.score,
      };
    }

    if (topicDetails.score >= 0.55 && topicDetails.overlap >= 6) {
      return {
        code: "ALL_TIME_TOPIC_DUPLICATE",
        previousSlug: article.slug,
        previousTitle: article.title,
        similarity: topicDetails.score,
      };
    }
  }

  return null;
}

module.exports = {
  TOPIC_KEYWORDS,
  describeTopic,
  detectTopic,
  findAllTimeNearDuplicate,
  findRecentTitleConflict,
  findRecentTopicConflict,
  getTitleFingerprint,
  getTitleSimilarityDetails,
  getTopicSimilarityDetails,
  getTopicTokens,
  normalizeArticleTitle,
  normalizeGuardrailText,
};
