"use strict";

/**
 * One-off/maintenance: repair capitalization damage left by the old
 * translation prompt ("pas de capitales superflues"), which made the model
 * lowercase entire articles (worst in DE, where nouns must be capitalized).
 *
 * Safety model: the LLM is asked to fix ONLY casing, and every response is
 * verified with a hard invariant — result.toLowerCase() must equal
 * input.toLowerCase() exactly (same characters, whitespace and length).
 * Any response that changes anything besides letter case is discarded and
 * the original text is kept.
 *
 * Usage:
 *   node --env-file=.env scripts/fix-article-casing.js --locale de [--apply] [--repo /path]
 *   node --env-file=.env scripts/fix-article-casing.js --all-locales --apply
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : fallback;
};

const APPLY = flag("--apply");
const ROOT = value("--repo", process.cwd());
const LOCALES = flag("--all-locales")
  ? ["fr", "en", "de", "es", "pt"]
  : [value("--locale", "de")];

const LANG_NAMES = {
  fr: "français",
  en: "English",
  de: "Deutsch",
  es: "español",
  pt: "português",
};

const LANG_RULES = {
  de:
    "Règles allemandes STRICTES: Substantive gross (Der Leitfaden, die Schritte); " +
    "Adjektive, Verben, Artikel, Pronomen klein, sauf en début de phrase " +
    "(« konkrete Schritte », PAS « Konkrete Schritte » en milieu de phrase). " +
    "NE JAMAIS mettre une majuscule à chaque mot — " +
    "« Ein Praktischer Leitfaden Für Führungskräfte » est FAUX, " +
    "« Ein praktischer Leitfaden für Führungskräfte » est correct.",
  en:
    "English rules: sentence case only — capitalize sentence starts, proper nouns, " +
    "acronyms. Do NOT apply Title Case to headings or sentences.",
  fr: "Règles françaises: majuscule en début de phrase, noms propres, sigles ; jamais de Title Case.",
  es: "Reglas: mayúscula al inicio de frase, nombres propios y siglas; nunca Title Case.",
  pt: "Regras: maiúscula no início de frase, nomes próprios e siglas; nunca Title Case.",
};

const ENDPOINT_RAW = process.env.AZURE_OPENAI_ENDPOINT || "";
const API_KEY = process.env.AZURE_OPENAI_API_KEY || "";
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview";
const DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1";

if (!ENDPOINT_RAW || !API_KEY) {
  console.error("Missing AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY (run with node --env-file=.env)");
  process.exit(1);
}

function buildUrl() {
  let url = ENDPOINT_RAW;
  if (!/chat\/completions/.test(url)) {
    url = url.replace(/\/+$/, "") + `/openai/deployments/${DEPLOYMENT}/chat/completions`;
  }
  if (!/api-version=/.test(url)) {
    url += (url.includes("?") ? "&" : "?") + `api-version=${API_VERSION}`;
  }
  return url;
}

async function fixCasing(text, locale, attempt = 1) {
  const res = await fetch(buildUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": API_KEY },
    body: JSON.stringify({
      messages: [
        {
          role: "system",
          content:
            `Tu corriges UNIQUEMENT la casse (majuscules/minuscules) d'un texte en ${LANG_NAMES[locale]}. ` +
            "Ne corrige que les erreurs manifestes (phrase commençant par une minuscule, nom propre/acronyme en minuscules). " +
            LANG_RULES[locale] +
            " INTERDIT de changer quoi que ce soit d'autre: aucun mot, aucun signe, aucun espace, aucune ponctuation, aucun retour à la ligne. " +
            "Si la casse est déjà correcte, renvoie le texte tel quel. Réponds avec le texte corrigé, rien d'autre." +
            (attempt > 1 ? " ATTENTION: ta réponse précédente a modifié autre chose que la casse. Recommence en ne touchant STRICTEMENT qu'aux majuscules/minuscules." : ""),
        },
        { role: "user", content: text },
      ],
      temperature: 0,
      max_tokens: 8000,
    }),
  });
  if (!res.ok) throw new Error(`Azure OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? "").replace(/^```[a-z]*\n?|\n?```$/g, "");
}

// The hard invariant: only letter case may differ.
const sameExceptCase = (a, b) => a.toLowerCase() === b.toLowerCase();

// Second guard: reject Title-Cased responses (observed failure mode — the
// model capitalized Every Word of a German description). Legit German prose
// capitalizes ~30-50% of words (nouns + sentence starts); Title Case ≈ 90%+.
function looksTitleCased(text) {
  const words = text.split(/\s+/).filter((w) => /[a-zà-öø-ÿ]/i.test(w));
  if (words.length < 7) return false;
  const caps = words.filter((w) => /^[A-ZÀ-ÖØ-Þ]/.test(w)).length;
  return caps / words.length > 0.75;
}

// Only send fields that actually look damaged — healthy text has nothing to
// gain and everything to lose from a round-trip through the model.
function fieldDamaged(text) {
  if (!text) return false;
  if (/^[a-zà-öø-ÿ]/.test(text)) return true;
  return ((text.match(/(?:[.!?]\s+|\n#+\s+)[a-zà-öø-ÿ]/g) || []).length >= 2);
}

async function fixField(text, locale, label, stats) {
  if (!text) return text;
  if (!fieldDamaged(text)) {
    stats.skippedHealthy += 1;
    return text;
  }
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const fixed = await fixCasing(text, locale, attempt);
      if (!sameExceptCase(text, fixed)) {
        stats.invariantRejected += 1;
        continue;
      }
      if (looksTitleCased(fixed) && !looksTitleCased(text)) {
        stats.titleCaseRejected += 1;
        continue;
      }
      if (fixed !== text) stats.changed += 1;
      else stats.unchanged += 1;
      return fixed;
    } catch (error) {
      console.warn(`    ${label}: API error (${error.message}); keeping original`);
      stats.errors += 1;
      return text;
    }
  }
  console.warn(`    ${label}: rejected twice; keeping original`);
  return text;
}

function chunkContent(content, maxLen = 6000) {
  const paragraphs = content.split("\n\n");
  const chunks = [];
  let current = "";
  for (const p of paragraphs) {
    if (current && current.length + p.length + 2 > maxLen) {
      chunks.push(current);
      current = p;
    } else {
      current = current ? `${current}\n\n${p}` : p;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

// Heuristic damage detection. False positives are harmless: the invariant
// guarantees a pass over a healthy article changes nothing but real casing
// errors. Lowercase-after-period from abbreviations ("art. 702", "p. ex.")
// inflates the count slightly, hence the threshold.
function isDamaged(article) {
  const lowerStart = (s) => /^[a-zà-öø-ÿ]/.test(s || "");
  const contentHits = ((article.content || "").match(/(?:^|[.!?]\s+|\n#+\s+|\n- )[a-zà-öø-ÿ]/gm) || []).length;
  return lowerStart(article.title) || lowerStart(article.description) || contentHits >= 4;
}

(async () => {
  for (const locale of LOCALES) {
    const file = path.join(ROOT, "src", "translations", locale, "ressources.json");
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const damaged = data.Articles.filter(isDamaged);
    console.log(`[${locale}] ${damaged.length}/${data.Articles.length} articles flagged`);
    const stats = { changed: 0, unchanged: 0, skippedHealthy: 0, invariantRejected: 0, titleCaseRejected: 0, errors: 0 };

    for (const article of damaged) {
      console.log(`  fixing ${article.slug.slice(0, 60)}`);
      article.title = await fixField(article.title, locale, "title", stats);
      article.description = await fixField(article.description, locale, "description", stats);
      if (article.content) {
        const chunks = chunkContent(article.content);
        const fixedChunks = [];
        for (let i = 0; i < chunks.length; i += 1) {
          fixedChunks.push(await fixField(chunks[i], locale, `content[${i}]`, stats));
        }
        article.content = fixedChunks.join("\n\n");
      }
    }

    console.log(`[${locale}] fields changed: ${stats.changed}, returned unchanged: ${stats.unchanged}, healthy-skipped: ${stats.skippedHealthy}, invariant-rejected: ${stats.invariantRejected}, titlecase-rejected: ${stats.titleCaseRejected}, errors: ${stats.errors}`);
    if (APPLY) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
      console.log(`[${locale}] written`);
    } else {
      console.log(`[${locale}] dry run — nothing written (use --apply)`);
    }
  }
})();
