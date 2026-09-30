"use strict";

/**
 * Ridger article rules — hard content guardrails + SEO/GEO structure checks.
 *
 * Used by the generator (scripts/ai-ressources-update.js) BEFORE anything is
 * written, and by the CI validator (scripts/validate-article-seo.js) after.
 * Every function here is pure (no network, no fs except loadServicePathMaps)
 * and unit-tested in scripts/article-pipeline.test.js.
 *
 * Hard rules (any violation → article discarded):
 *   - no prices/fees, no quote tool, no AI-assistant mention, no e-mail address
 *   - no guarantees / promises of outcome
 *   - no US-person structuring
 *   - "Ark" mentioned at most once
 *   - legal-accuracy rejections from the 2026 legal audit (183-day myth,
 *     forfait "5× rent", golden visa, "CHF 435,000 minimum tax", unqualified
 *     "no inheritance/wealth tax", Lex Koller / EU package presented as in
 *     force, property purchase ⇒ residence right)
 */

const fs = require("fs");
const path = require("path");
const {
  containsKeywordLoosely,
  significantTokens,
  stripAccents,
} = require("./keywordResearch");

const LOCALES = ["fr", "en", "de", "es", "pt"];

const KEY_FACTS_HEADINGS = {
  fr: "Points clés",
  en: "Key facts",
  de: "Das Wichtigste in Kürze",
  es: "Puntos clave",
  pt: "Pontos-chave",
};

const FAQ_HEADINGS = {
  fr: "Questions fréquentes",
  en: "Frequently asked questions",
  de: "Häufige Fragen",
  es: "Preguntas frecuentes",
  pt: "Perguntas frequentes",
};

const REFERENCES_HEADINGS = {
  fr: "Références",
  en: "References",
  de: "Referenzen",
  es: "Referencias",
  pt: "Referências",
};

const FAQ_HEADING_RE =
  /^##\s+(questions fréquentes|faq|frequently asked questions|häufige fragen|preguntas frecuentes|perguntas frequentes)\s*$/i;
const KEY_FACTS_HEADING_RE =
  /^##\s+(points clés|key facts|das wichtigste in kürze|puntos clave|pontos-chave)\s*$/i;

const GENERIC_ANCHORS =
  /^(ici|cliquez ici|ce lien|en savoir plus|lire la suite|here|click here|this link|read more|learn more|hier|mehr|weiterlesen|aquí|aqui|leer más|clique aqui|saiba mais|leia mais)$/i;

const SEO_LIMITS = {
  titleMin: 20,
  titleMax: 75, // H1
  seoTitleMax: 51, // + " - Ridger" (9 chars) → ≤ 60 in <title>
  seoTitleMin: 20,
  metaMin: 110,
  metaMax: 160,
  imageAltMin: 10,
  imageAltMax: 125,
  minWords: 900,
  maxWords: 2600,
  faqMin: 4,
  faqMax: 6,
  keyFactsMin: 3,
  questionH2Min: 3,
};

// ─────────────────────────────────────────────────────────────────────────
// Text helpers
// ─────────────────────────────────────────────────────────────────────────

function countWords(text) {
  const t = String(text || "").trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function stripMarkdownLinks(text) {
  // [label](url) → label ; bare URLs removed
  return String(text || "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ");
}

function splitSentences(text) {
  return stripMarkdownLinks(text)
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ¿¡"«“(\d-])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function plain(s) {
  return stripAccents(String(s || "").toLowerCase()).replace(/[’`]/g, "'");
}

function articleTextFields(article) {
  return [
    article.title,
    article.seoTitle,
    article.description,
    article.metaDescription,
    article.imageAlt,
    article.content,
  ]
    .filter((v) => typeof v === "string")
    .join("\n");
}

// ─────────────────────────────────────────────────────────────────────────
// Hard rules
// ─────────────────────────────────────────────────────────────────────────

const NEGATION = /\b(ne|n'|pas|jamais|aucun|aucune|not|never|isn't|doesn't|does not|is not|no longer|nicht|kein|keine|keinen|niemals|nunca|nao|nem|ni|no (es|existe|da|otorga|hay|esta|son|permite|confiere)|no existe|n'existe|there is no|gibt es nicht|nao existe|mythe|myth|mythos|mito|idee recue|misconception|irrtum|erreur|error|erro|contrairement|contrary|entgegen|a diferencia|ao contrario)\b/;

const PROPOSAL_MARKERS = /\b(projet|proposition|propose|consultation|en discussion|pas encore|avant-projet|message du conseil federal|proposal|proposed|draft|bill|not yet|pending|under discussion|consultation|vernehmlassung|entwurf|vorlage|noch nicht|geplant|proyecto|propuesta|todavia no|aun no|consulta|projeto|proposta|ainda nao|parlement|parliament|parlament|parlamento|votation|vote|referendum|abstimmung|votacion|votacao|ratification|ratifizierung|ratificacion|ratificacao|prevu|prevue|expected|voraussichtlich|previsto|prevista|negociation|negotiat|verhandl|negociacion|negociacao|signature|signed|unterzeichnet|firmado|assinado)\b/;

const RULES = [
  {
    code: "PRICE",
    message: "mentions prices / fees",
    test: (s) =>
      /\b(nos|notre|ses) (honoraires|tarifs?|prix|forfaits? mensuels?)\b/.test(s) ||
      /\b(our|ridger'?s) (fees|pricing|prices|rates|retainer)\b/.test(s) ||
      /\bunsere (honorare|preise|gebuhren|tarife)\b/.test(s) ||
      /\bnuestr[oa]s (honorarios|precios|tarifas)\b/.test(s) ||
      /\bn?oss[oa]s (honorarios|precos|tarifas)\b/.test(s) ||
      /\b(a partir de|des|starting at|starting from|ab|desde)\s+chf\s*[\d'’.,\s]+(par|per|pro|por|\/)/.test(s) ||
      (/\b(honoraires?|retainers?|fees|pricing|honorare?|gebuhren|honorarios|tarifs?|tarifas?|facturation|billing)\b/.test(s) &&
        /\bchf\s*\d|\d\s*chf\b/.test(s)) ||
      /\bchf\s*[\d'’.,\s]+\s*(par|per|pro|por)\s+(mois|an|annee|month|year|monat|jahr|mes|ano|mandat|mandate)\b/.test(s),
  },
  {
    code: "QUOTE_TOOL",
    message: "mentions a quote tool / request for quote",
    test: (s) =>
      /\b(devis (instantane|en ligne|gratuit)|demande[rz]? (un|votre) devis|instant quote|online quote|free quote|request a quote|get a quote|sofortangebot|online-offerte|offerte anfordern|presupuesto (instantaneo|en linea|gratuito)|solicite (un|su) presupuesto|orcamento (instantaneo|online|gratuito)|peca (um|o seu) orcamento)\b/.test(s),
  },
  {
    code: "AI_ASSISTANT",
    message: "mentions an AI assistant / chatbot",
    test: (s) =>
      /\b(assistant (ia|virtuel|intelligent)|notre ia|ai assistant|virtual assistant|our ai|chatbot|chat-bot|ki-assistent|virtueller assistent|unsere ki|asistente (de )?ia|asistente virtual|nuestra ia|assistente (de )?ia|assistente virtual|nossa ia|chatgpt|gpt-\d)\b/.test(s),
  },
  {
    code: "EMAIL",
    message: "contains an e-mail address",
    raw: true,
    test: (s) => /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(s),
  },
  {
    code: "GUARANTEE",
    message: "promises / guarantees an outcome",
    test: (s) => {
      if (/\b(esisuisse|garantie des depots|deposit (insurance|protection)|einlagensicherung|garantia de depositos|garantia de depositos|constitution|verfassung|constitucion|constituicao|garantie de loyer|rent deposit|mietkaution|deposito de garantia|fianza|plafond|threshold|obergrenze|limite|limit|hochstbetrag)\b/.test(s)) {
        return false;
      }
      const re = /\b(nous (vous )?garantissons|garantissons|we guarantee|guaranteed|risk-free|sans risque|wir garantieren|garantiert|garantizamos|garantizad[oa]s?|sin riesgo|garantimos|garantid[oa]s?|sem risco|(rendement|resultat|economies?|succes|return|returns|result|results|savings|success|rendite|ergebnis|erfolg|rentabilidad|resultado|ahorro|exito|rendimento|poupanca|sucesso)s? garanti)/g;
      // Only a negation right next to the guarantee exempts it ("ne
      // garantissons aucune issue", "garantiert keinen …") — never a negation
      // elsewhere in the sentence, and never "not only / non seulement".
      for (const m of s.matchAll(re)) {
        const before = s.slice(Math.max(0, m.index - 28), m.index);
        const after = s.slice(m.index + m[0].length, m.index + m[0].length + 14);
        const negBefore = /\b(ne|n'|pas|jamais|not|never|no|nicht|nie|nao|nunca|sin|sem)\b[^.:;!?]{0,12}$/.test(before) &&
          !/\b(not only|non seulement|nicht nur|no solo|nao so|nao apenas)\b/.test(before);
        const negAfter = /^\s*(aucun|aucune|pas|rien|nothing|no |keine|keinen|kein|ningun|ninguna|nada|nenhum|nenhuma|qualquer)/.test(after);
        if (!negBefore && !negAfter) return true;
      }
      return false;
    },
  },
  {
    code: "US_PERSON",
    message: "US-person / US-trust structuring is out of scope",
    test: (s) =>
      /\b(us persons?|u\.s\. persons?|personnes? americaines?|ressortissants? americains?|citoyens? americains?|us-personen?|us-burger|personas? estadounidenses?|ciudadanos? estadounidenses?|pessoas? norte-americanas?|cidadaos? norte-americanos?|trust americain|us trusts?|u\.s\. trusts?|trust estadounidense|trust norte-americano|fatca|green card|irs)\b/.test(s),
  },
  // ── Legal-accuracy rejections (2026 legal audit) ────────────────────────
  {
    code: "LEGAL_183_DAYS",
    message:
      "presents '183 days' as the Swiss tax-residence test (domestic rule: 30 days with / 90 days without gainful activity, plus domicile and treaty tie-breakers)",
    test: (s) => {
      if (!/\b183\s*(jours|days|tage|tagen|dias)\b/.test(s)) return false;
      const treatyContext = /\b(convention|double imposition|treaty|dba|doppelbesteuerung|convenio|convencao|travailleur|employee|arbeitnehmer|trabajador|trabalhador)\b/.test(s);
      const correctlyContrasted = /\b30\b/.test(s) && /\b90\b/.test(s);
      return !(NEGATION.test(s) || treatyContext || correctlyContrasted);
    },
  },
  {
    code: "LEGAL_FORFAIT_5X",
    message: "states the forfait fiscal base as 5× rent (the rule is 7×)",
    test: (s) =>
      /\b(5|cinq|five|funf|cinco)\s*(x|×|fois|times|mal|fache|fachen|veces|vezes)\b.{0,60}\b(loyer|rent|miete|mietzins|mietwert|alquiler|renda|aluguel|aluguer|valeur locative|rental value|valor locativo|eigenmietwert)/.test(s) ||
      /\b(loyer|rent|miete|mietzins|mietwert|alquiler|renda|aluguel|aluguer|valeur locative|rental value|valor locativo|eigenmietwert)\b.{0,60}\b(5|cinq|five|funf|cinco)\s*(x|×|fois|times|mal|fache|fachen|veces|vezes)\b/.test(s) ||
      /\b(quintuple|funffache|funffachen|quintuplo)\b.{0,40}\b(loyer|rent|miete|mietzins|mietwert|alquiler|renda|aluguel|valeur locative|rental value)/.test(s),
  },
  {
    code: "LEGAL_GOLDEN_VISA",
    message: "presents residency-by-investment / golden visa as a Swiss programme",
    test: (s) =>
      /\b(golden visa|goldenes visum|visa dore|visa dorado|visado dorado|visa de oro|visto gold|visto dourado|residency by investment|residence by investment|citizenship by investment|residence par (l'?)?investissement|aufenthalt durch investition|residencia por inversion|residencia por investimento)\b/.test(s) &&
      !NEGATION.test(s),
  },
  {
    code: "LEGAL_435K_TAX",
    message:
      "presents CHF 435,000 as a minimum TAX (it is the 2026 federal minimum taxable BASE)",
    test: (s) => {
      if (!/\b435[\s'’., ]?000\b/.test(s)) return false;
      const baseWord = /\b(base|assiette|bemessungsgrundlage|bemessung|base imponible|base tributavel|base de calculo|revenu imposable|taxable income|steuerbares einkommen|renta imponible|rendimento tributavel|depense|expenditure|aufwand|gasto|despesa)\b/.test(s);
      const taxWord = /\b(impot|tax|impuesto|imposto)\b|steuer/.test(s);
      return taxWord && !baseWord;
    },
  },
  {
    code: "LEGAL_NO_INHERITANCE_WEALTH_TAX",
    message:
      "states 'no inheritance tax' / 'no wealth tax' without qualification (canton, heirs, federal level)",
    test: (s) => {
      const claim =
        /\b(pas d'impot|aucun impot|sans impot|exonere[es]? d'impot|no|zero|without|keine|keinerlei|ohne|sin|no hay|sem|nao ha|nenhum)\s+(sur (la|les) )?(impot (sur (la|les) )?)?(fortune|successions?|successoral|heritage|inheritance tax|estate tax|wealth tax|erbschaftssteuer|erbschaftsteuer|vermogenssteuer|vermogensteuer|impuesto (de|sobre (el|la|las)) (sucesiones|patrimonio|herencias?)|imposto (sobre (o |a |as |os )?)?(heranca|herancas|sucessorio|patrimonio|fortuna))/.test(s) ||
        /\b(pas|aucun|no|keine|sin|sem) (d'|de )?(impot|tax|steuer|impuesto|imposto)s? (sur|on|auf|sobre) (la |les |el |o |a |das |dem )?(fortune|succession|successions|heritage|inheritance|wealth|estate|vermogen|erbschaft|patrimonio|herencia|sucesiones|heranca)/.test(s);
      if (!claim) return false;
      const qualified = /\b(federal|federale|confederation|bund|bundesebene|au niveau federal|conjoint|epoux|spouse|ehegatte|ehepartner|conyuge|conjuge|descendant|descendants|descendientes|descendentes|nachkommen|direct|directs|direkte|linea directa|linha direta|schwyz|obwald|canton|cantons|kanton|kantone|canton de|canton of|cantonal|kantonal|cantones|cantoes|certains|some|einige|algunos|alguns)\b/.test(s);
      return !qualified;
    },
  },
  {
    code: "LEGAL_LEX_KOLLER_IN_FORCE",
    message:
      "presents the 2026 Lex Koller tightening as law in force (it is a proposal)",
    test: (s) =>
      /\b(lex koller|lfaie|bewg|lfaie)\b/.test(s) &&
      /\b(durcissement|resserrement|tightening|tightened|stricter|verscharfung|verscharft|endurecimiento|endurecimento|restriction|restrictions|2026)\b/.test(s) &&
      !PROPOSAL_MARKERS.test(s) &&
      !NEGATION.test(s),
  },
  {
    code: "LEGAL_EU_PACKAGE_IN_FORCE",
    message:
      "presents the updated Switzerland–EU package / free-movement update as law in force",
    test: (s) =>
      /\b(paquet|package|paket|paquete|pacote|bilaterales iii|bilaterales iii|bilaterale iii|bilaterals iii|accords bilateraux|bilateral agreements)\b/.test(s) &&
      /\b(ue|eu|europeenne|european|europaische|europea|europeia)\b/.test(s) &&
      /\b(en vigueur|in force|in kraft|en vigor|em vigor|s'applique|applies|apply|gilt|gelten|se aplica|aplica-se|desormais|now|nun|ahora|agora)\b/.test(s) &&
      !PROPOSAL_MARKERS.test(s) &&
      !NEGATION.test(s),
  },
  {
    code: "LEGAL_PROPERTY_RESIDENCE",
    message: "presents a property purchase as giving a right of residence",
    test: (s) =>
      /\b(achat|acquisition|acquerir|acheter|purchase|purchasing|buying|buy|acquire|kauf|erwerb|erwerben|kaufen|compra|comprar|adquirir|aquisicao|adquisicion)\b/.test(s) &&
      /\b(bien|biens|immobilier|immobiliere|propriete|property|real estate|home|house|immobilie|liegenschaft|wohneigentum|inmueble|propiedad|vivienda|imovel|propriedade|casa)\b/.test(s) &&
      /\b(permis|droit de sejour|droit de residence|residence|residency|residence permit|aufenthalt|aufenthaltsbewilligung|aufenthaltsrecht|residencia|permiso|autorizacao de residencia|visa|visto)\b/.test(s) &&
      /\b(donne droit|donne acces|confere|ouvre (le )?droit|permet d'obtenir|grants?|gives?|entitles?|qualif(y|ies)|leads to|berechtigt|verschafft|gibt (ein|das) recht|fuhrt zu|otorga|da derecho|permite obtener|concede|da direito|permite obter)\b/.test(s) &&
      !NEGATION.test(s),
  },
];

/**
 * @returns {Array<{code:string,message:string,excerpt:string}>}
 */
function checkHardRules(article) {
  const violations = [];
  const raw = articleTextFields(article);
  // "Ark" at most once, subtle (case-sensitive brand match).
  const arkMentions = (stripMarkdownLinks(raw).match(/\bArk\b/g) || []).length;
  if (arkMentions > 1) {
    violations.push({
      code: "ARK_MENTIONS",
      message: `mentions the Ark group ${arkMentions} times (max 1)`,
      excerpt: "",
    });
  }
  for (const rule of RULES.filter((r) => r.raw)) {
    if (rule.test(raw)) {
      const m = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
      violations.push({ code: rule.code, message: rule.message, excerpt: m ? m[0] : "" });
    }
  }
  const sentences = splitSentences(raw);
  for (const sentence of sentences) {
    const s = plain(sentence);
    for (const rule of RULES) {
      if (rule.raw) continue;
      if (rule.test(s)) {
        violations.push({
          code: rule.code,
          message: rule.message,
          excerpt: sentence.slice(0, 220),
        });
      }
    }
  }
  return dedupeViolations(violations);
}

function dedupeViolations(list) {
  const seen = new Set();
  return list.filter((v) => {
    const key = `${v.code}|${v.excerpt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Markdown structure
// ─────────────────────────────────────────────────────────────────────────

function extractHeadings(content, level = 2) {
  const re = new RegExp(`^${"#".repeat(level)}\\s+(.+?)\\s*$`, "gm");
  return [...String(content || "").matchAll(re)].map((m) => m[1].trim());
}

function getLeadParagraph(content) {
  const before = String(content || "").split(/^##\s/m)[0] || "";
  return before.trim();
}

/**
 * Extract FAQ entries from the "## Questions fréquentes" (or localized) section.
 * Mirrors extractArticleFaq() in src/lib/articleSeo.ts — keep them in sync.
 */
function extractFaq(content) {
  const lines = String(content || "").split("\n");
  const entries = [];
  let inFaq = false;
  let current = null;
  const flush = () => {
    if (current) {
      const answer = stripMarkdownLinks(current.answer.join(" "))
        .replace(/[*_`>]/g, "")
        .replace(/\s+/g, " ")
        .trim();
      if (current.question && answer) entries.push({ question: current.question, answer });
    }
    current = null;
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (FAQ_HEADING_RE.test(trimmed)) {
      inFaq = true;
      continue;
    }
    if (!inFaq) continue;
    if (/^##\s/.test(trimmed) || /^---+$/.test(trimmed)) {
      flush();
      break;
    }
    const q = trimmed.match(/^###\s+(.+)$/);
    if (q) {
      flush();
      current = { question: q[1].replace(/\*\*/g, "").trim(), answer: [] };
      continue;
    }
    if (current && trimmed) current.answer.push(trimmed);
  }
  flush();
  return entries;
}

function extractKeyFacts(content) {
  const lines = String(content || "").split("\n");
  const out = [];
  let inBox = false;
  for (const line of lines) {
    const t = line.trim();
    if (KEY_FACTS_HEADING_RE.test(t)) {
      inBox = true;
      continue;
    }
    if (!inBox) continue;
    if (/^#{2,3}\s/.test(t)) break;
    const m = t.match(/^[-*]\s+(.+)$/);
    if (m) out.push(m[1]);
  }
  return out;
}

function extractInternalLinks(content) {
  return [...String(content || "").matchAll(/\[([^\]]+)\]\((\/[^)\s]*)\)/g)].map((m) => ({
    anchor: m[1].trim(),
    href: m[2].trim(),
  }));
}

function extractExternalLinks(content) {
  return [...String(content || "").matchAll(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => ({
    anchor: m[1].trim(),
    url: m[2].trim(),
  }));
}

/** URLs that are not the target of a Markdown link (plain text / <autolinks>). */
function extractBareUrls(content) {
  const withoutLinks = String(content || "").replace(/\]\((https?:\/\/[^)\s]+)\)/g, "]()");
  return [...withoutLinks.matchAll(/<?https?:\/\/[^\s)>\]]+/g)].map((m) => m[0].replace(/^</, ""));
}

// ─────────────────────────────────────────────────────────────────────────
// Internal link resolution
// ─────────────────────────────────────────────────────────────────────────

const CANONICAL_SERVICES = [
  "/services/consolidated-reporting",
  "/services/investment-oversight",
  "/services/family-office-coordination",
  "/services/governance-succession",
  "/services/tax-administration",
  "/services/digital-vault",
  "/services/real-estate-transactions",
  "/services/household-staff",
  "/services/relocation-residence",
  "/services/domiciliation-mail",
  "/services/property-management",
];

const STATIC_PAGES = {
  fr: ["/", "/services", "/approche", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
  en: ["/", "/services", "/approach", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
  de: ["/", "/services", "/approach", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
  es: ["/", "/services", "/approach", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
  pt: ["/", "/services", "/approach", "/platform", "/contact", "/ressources", "/ressources/articles", "/advisers"],
};

/**
 * Parse the per-locale service slug maps out of src/lib/paths.ts so the
 * pipeline and validator can never drift from the router.
 */
function loadServicePathMaps(root = process.cwd()) {
  const src = fs.readFileSync(path.join(root, "src", "lib", "paths.ts"), "utf8");
  const maps = { en: {} };
  for (const locale of ["fr", "de", "es", "pt"]) {
    const block = src.match(new RegExp(`const ${locale}Map[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`));
    const map = {};
    if (block) {
      for (const m of block[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) map[m[1]] = m[2];
    }
    maps[locale] = map;
  }
  const out = {};
  for (const locale of LOCALES) {
    out[locale] = {};
    for (const svc of CANONICAL_SERVICES) {
      out[locale][svc] = (maps[locale] && maps[locale][svc]) || svc;
    }
  }
  return out;
}

function withSlash(p) {
  return p.endsWith("/") ? p : `${p}/`;
}

function buildAllowedInternalPaths(locale, { servicePathMaps, articleSlugs = [] }) {
  const set = new Set();
  const add = (p) => set.add(withSlash(`/${locale}${p === "/" ? "" : p}`));
  (STATIC_PAGES[locale] || []).forEach(add);
  Object.values(servicePathMaps[locale] || {}).forEach(add);
  articleSlugs.forEach((slug) => add(`/ressources/articles/${slug}`));
  return set;
}

function localizedServiceUrl(locale, canonicalService, servicePathMaps) {
  const localized = (servicePathMaps[locale] || {})[canonicalService] || canonicalService;
  return withSlash(`/${locale}${localized}`);
}

// ─────────────────────────────────────────────────────────────────────────
// SEO / GEO structure
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {object} article — one locale's article record
 * @param {object} ctx
 * @param {string} ctx.locale
 * @param {{primary:string, secondary:string[]}} ctx.keywords
 * @param {Set<string>} ctx.allowedInternalPaths
 * @param {(url:string)=>boolean} [ctx.isTrustedDomain]
 * @param {boolean} [ctx.checkSlug] — FR only (slug is shared by all locales)
 * @returns {{errors:string[], warnings:string[], stats:object}}
 */
function checkSeoStructure(article, ctx) {
  const { locale, keywords = {}, allowedInternalPaths, isTrustedDomain, checkSlug = false } = ctx;
  const errors = [];
  const warnings = [];
  const content = String(article.content || "");
  const primary = keywords.primary || "";
  const secondary = Array.isArray(keywords.secondary) ? keywords.secondary : [];
  const L = SEO_LIMITS;

  // Title / H1
  const title = String(article.title || "");
  if (title.length < L.titleMin || title.length > L.titleMax) {
    errors.push(`title length ${title.length} outside ${L.titleMin}–${L.titleMax}`);
  }
  if (primary && !containsKeywordLoosely(title, primary, 0.6)) {
    errors.push(`title/H1 does not contain the primary keyword "${primary}"`);
  }
  if (/^#\s/m.test(content)) errors.push("content contains an H1 (the page renders the title as H1)");

  // <title>
  const seoTitle = String(article.seoTitle || "");
  if (seoTitle.length < L.seoTitleMin || seoTitle.length > L.seoTitleMax) {
    errors.push(`seoTitle length ${seoTitle.length} outside ${L.seoTitleMin}–${L.seoTitleMax} (brand suffix added at render)`);
  }
  if (primary && seoTitle && !containsKeywordLoosely(seoTitle, primary, 0.6)) {
    errors.push(`seoTitle does not contain the primary keyword "${primary}"`);
  }
  if (/ridger/i.test(seoTitle)) errors.push("seoTitle must not include the brand (template appends it)");

  // Meta description
  const meta = String(article.metaDescription || "");
  if (meta.length < L.metaMin || meta.length > L.metaMax) {
    errors.push(`metaDescription length ${meta.length} outside ${L.metaMin}–${L.metaMax}`);
  }
  if (primary && meta && !containsKeywordLoosely(meta, primary, 0.6)) {
    errors.push(`metaDescription does not contain the primary keyword "${primary}"`);
  }

  // Image alt
  const alt = String(article.imageAlt || "");
  if (alt.length < L.imageAltMin || alt.length > L.imageAltMax) {
    errors.push(`imageAlt length ${alt.length} outside ${L.imageAltMin}–${L.imageAltMax}`);
  }

  // Slug
  if (checkSlug) {
    const slug = String(article.slug || "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 90) {
      errors.push(`slug "${slug}" is not a clean kebab-case slug ≤ 90 chars`);
    }
    const slugTokens = new Set(slug.split("-"));
    const primaryTokens = significantTokens(primary);
    const covered = primaryTokens.filter((t) => [...slugTokens].some((s) => s === t || s.startsWith(t.slice(0, 5)))).length;
    if (primaryTokens.length && covered / primaryTokens.length < 0.6) {
      errors.push(`slug "${slug}" does not carry the primary keyword "${primary}"`);
    }
  }

  // GEO: direct answer first
  const lead = getLeadParagraph(content);
  const leadSentences = splitSentences(lead).length;
  if (!lead) errors.push("missing direct-answer lead paragraph before the first H2");
  else {
    if (leadSentences > 4) errors.push(`lead has ${leadSentences} sentences (direct answer must be 2–3, max 4)`);
    if (primary && !containsKeywordLoosely(lead, primary, 0.6)) {
      errors.push(`lead (direct answer) does not contain the primary keyword "${primary}"`);
    }
  }

  // Key facts box, right after the lead
  const h2 = extractHeadings(content, 2);
  const keyFactsIdx = h2.findIndex((h) => KEY_FACTS_HEADING_RE.test(`## ${h}`));
  const expectedKeyFacts = KEY_FACTS_HEADINGS[locale];
  if (keyFactsIdx === -1) errors.push(`missing "## ${expectedKeyFacts}" box`);
  else {
    if (keyFactsIdx > 1) errors.push(`"## ${expectedKeyFacts}" must be the first (or second) H2`);
    const facts = extractKeyFacts(content);
    if (facts.length < L.keyFactsMin) errors.push(`key facts box has ${facts.length} bullets (min ${L.keyFactsMin})`);
  }

  // Question-style H2s containing secondary keywords
  const questionH2 = h2.filter((h) => /[?？]\s*$/.test(h) && !FAQ_HEADING_RE.test(`## ${h}`));
  if (questionH2.length < L.questionH2Min) {
    errors.push(`${questionH2.length} question-style H2 (min ${L.questionH2Min})`);
  }
  const h2WithSecondary = questionH2.filter((h) => secondary.some((k) => containsKeywordLoosely(h, k, 0.6)));
  const minH2Kw = locale === "fr" ? 2 : 1;
  if (secondary.length && h2WithSecondary.length < minH2Kw) {
    errors.push(`only ${h2WithSecondary.length} question H2 contain a secondary keyword (min ${minH2Kw})`);
  }
  const secondaryInBody = secondary.filter((k) => containsKeywordLoosely(content, k, 0.8)).length;
  if (secondary.length && secondaryInBody < Math.min(3, secondary.length)) {
    warnings.push(`only ${secondaryInBody}/${secondary.length} secondary keywords appear in the body`);
  }

  // FAQ
  const faq = extractFaq(content);
  const faqHeadingOk = h2.some((h) => FAQ_HEADING_RE.test(`## ${h}`));
  if (!faqHeadingOk) errors.push(`missing "## ${FAQ_HEADINGS[locale]}" section`);
  if (faq.length < L.faqMin || faq.length > L.faqMax) {
    errors.push(`FAQ has ${faq.length} questions (need ${L.faqMin}–${L.faqMax})`);
  }
  if (faq.some((e) => !/[?？]$/.test(e.question))) errors.push("every FAQ question (###) must end with '?'");

  // Dated update / verification line (ISO date) outside the references list
  const body = content.split(/^---+\s*$/m)[0];
  if (!/\b20\d{2}-\d{2}-\d{2}\b/.test(body)) {
    errors.push("missing dated verification line (ISO date YYYY-MM-DD) in the body");
  }

  // References section
  const hasRefSection = /^#{2,3}\s+(Références|References|Referenzen|Referencias|Referências)\s*$/m.test(content);
  if (!hasRefSection) errors.push(`missing "### ${REFERENCES_HEADINGS[locale]}" section`);

  // Internal links
  const internal = extractInternalLinks(content);
  if (!internal.length) errors.push("no internal link (service page) in the body");
  for (const link of internal) {
    const href = link.href.split(/[?#]/)[0];
    if (allowedInternalPaths && !allowedInternalPaths.has(withSlash(href))) {
      errors.push(`internal link does not resolve for ${locale}: ${link.href}`);
    }
    if (GENERIC_ANCHORS.test(link.anchor) || link.anchor.split(/\s+/).length < 2) {
      errors.push(`generic/too-short internal anchor text: "${link.anchor}"`);
    }
  }

  // External links: official sources only (Markdown links AND bare URLs)
  if (typeof isTrustedDomain === "function") {
    for (const link of extractExternalLinks(content)) {
      if (!isTrustedDomain(link.url)) errors.push(`external link to non-allowlisted domain: ${link.url}`);
    }
  }
  const bare = extractBareUrls(content);
  if (bare.length) errors.push(`bare URL(s) in text (use a Markdown link to a validated reference): ${bare.slice(0, 3).join(", ")}`);

  // Length
  const words = countWords(stripMarkdownLinks(content));
  if (words < L.minWords || words > L.maxWords) {
    errors.push(`word count ${words} outside ${L.minWords}–${L.maxWords}`);
  }

  return {
    errors,
    warnings,
    stats: {
      words,
      h2: h2.length,
      questionH2: questionH2.length,
      h2WithSecondary: h2WithSecondary.length,
      faq: faq.length,
      internalLinks: internal.length,
      leadSentences,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Cross-locale checks
// ─────────────────────────────────────────────────────────────────────────

/**
 * Numbers ≥ 10 in the text (link targets and ISO dates' separators ignored),
 * normalized so "400 000", "400'000", "400,000" and "400.000" all match.
 */
function extractNumbers(text) {
  const clean = stripMarkdownLinks(text)
    .replace(/\b(20\d{2})-(\d{2})-(\d{2})\b/g, "$1 $2 $3");
  const out = new Set();
  const re = /\d{1,3}(?:[\s'’.,  ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g;
  for (const m of clean.matchAll(re)) {
    let raw = m[0];
    // thousands-grouped → strip group separators, keep a trailing decimal part
    const grouped = raw.match(/^(\d{1,3}(?:[\s'’.,  ]\d{3})+)(?:[.,](\d+))?$/);
    let value;
    if (grouped && /[\s'’  ]/.test(grouped[1]) === false && /^\d{1,3}[.,]\d{3}$/.test(raw)) {
      // ambiguous "1.234" / "1,234": treat as thousands (Swiss/Anglo grouping)
      value = raw.replace(/[.,]/g, "");
    } else if (grouped) {
      value = grouped[1].replace(/[\s'’.,  ]/g, "") + (grouped[2] ? `.${grouped[2]}` : "");
    } else {
      value = raw.replace(",", ".");
    }
    const n = Number(value);
    if (Number.isFinite(n) && n >= 10) out.add(String(n));
  }
  return out;
}

function compareNumberParity(frContent, localeContent) {
  const a = extractNumbers(frContent);
  const b = extractNumbers(localeContent);
  const missing = [...a].filter((n) => !b.has(n));
  const extra = [...b].filter((n) => !a.has(n));
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

function structureSignature(content) {
  return {
    h2: extractHeadings(content, 2).length,
    h3: extractHeadings(content, 3).length,
    faq: extractFaq(content).length,
    keyFacts: extractKeyFacts(content).length,
    internalLinks: extractInternalLinks(content).length,
    externalLinks: extractExternalLinks(content).length,
  };
}

function compareStructure(frContent, localeContent) {
  const a = structureSignature(frContent);
  const b = structureSignature(localeContent);
  const diffs = Object.keys(a).filter((k) => a[k] !== b[k]).map((k) => `${k}: fr=${a[k]} vs ${b[k]}`);
  return { ok: diffs.length === 0, diffs };
}

// Official sources: federal (*.admin.ch, ch.ch, fedlex), the 26 cantons,
// supervisory/central bodies and a few quasi-official Swiss institutions.
const CANTON_DOMAINS = [
  "ag.ch", "ai.ch", "ar.ch", "be.ch", "bl.ch", "bs.ch", "fr.ch", "ge.ch", "gl.ch",
  "gr.ch", "ju.ch", "lu.ch", "ne.ch", "nw.ch", "ow.ch", "sg.ch", "sh.ch", "so.ch",
  "sz.ch", "tg.ch", "ti.ch", "ur.ch", "vd.ch", "vs.ch", "zg.ch", "zh.ch",
];
const OFFICIAL_DOMAINS = [
  "admin.ch", "ch.ch", ...CANTON_DOMAINS,
  "finma.ch", "snb.ch", "ahv-iv.ch", "zewo.ch", "esisuisse.ch", "bger.ch",
  "parlament.ch", "edoeb.admin.ch", "ncsc.admin.ch", "sem.admin.ch",
  "europa.eu", "oecd.org",
];

function isOfficialSource(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return OFFICIAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

module.exports = {
  CANONICAL_SERVICES,
  OFFICIAL_DOMAINS,
  isOfficialSource,
  FAQ_HEADINGS,
  KEY_FACTS_HEADINGS,
  LOCALES,
  REFERENCES_HEADINGS,
  SEO_LIMITS,
  buildAllowedInternalPaths,
  checkHardRules,
  checkSeoStructure,
  compareNumberParity,
  compareStructure,
  countWords,
  extractBareUrls,
  extractExternalLinks,
  extractFaq,
  extractHeadings,
  extractInternalLinks,
  extractKeyFacts,
  extractNumbers,
  getLeadParagraph,
  loadServicePathMaps,
  localizedServiceUrl,
  splitSentences,
  stripMarkdownLinks,
};
