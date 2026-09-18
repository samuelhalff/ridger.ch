"use strict";
// Load environment variables from .env if available (non-fatal if missing)
try { require("dotenv").config(); } catch {}

/**
 * Translate FR articles to other locales (EN/DE/ES/PT) using Azure OpenAI (GPT-4.1) while preserving slugs and links.
 * - Azure ONLY (Gemini removed). Provider forced to 'azure'.
 * - Does NOT change filenames, slugs, or reference URLs.
 * - Only updates title/description/content fields for Articles.
 * - Skips items already translated (i.e., content already diverges from FR), unless --force.
 * - Applies a light heuristic to warn about unnecessary capitals (acronyms allowed).
 *
 * Required env (in .env or CI secrets):
 *   AZURE_OPENAI_ENDPOINT   Full chat completions endpoint OR base endpoint + deployment path.
 *     Examples:
 *       https://<res>.openai.azure.com/openai/deployments/gpt-4.1/chat/completions?api-version=2025-01-01-preview
 *       (or) base: https://<res>.openai.azure.com/openai/deployments/gpt-4.1/chat/completions  + api-version appended automatically
 *   AZURE_OPENAI_API_KEY    Key for the Azure OpenAI resource (omit if using DefaultAzureCredential adaptation later)
 * Optional:
 *   AZURE_OPENAI_DEPLOYMENT (defaults gpt-4.1 if constructing endpoint externally)
 *   AZURE_OPENAI_API_VERSION (defaults 2025-01-01-preview)
 *
 * Usage:
 *   node scripts/translate-articles.js --dry-run
 *   node scripts/translate-articles.js --apply --force --locales=en,de
 *   node scripts/translate-articles.js --apply --only-slugs=mon-slug-1,mon-slug-2
 */

const fs = require("fs");
const path = require("path");
const { translateLabels } = require("./translate-reference-labels");

const args = new Set(process.argv.slice(2).filter(a => !a.includes('=')));
const getArg = (k, d) => {
  const prefix = `${k}=`;
  const found = process.argv.slice(2).find(a => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : d;
};

const APPLY = args.has("--apply");
const DRY = args.has("--dry-run") || !APPLY;
const FORCE = args.has("--force");
const LOCALES = getArg("--locales", "en,de,es,pt")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const ONLY_SLUGS = new Set(
  (getArg("--only-slugs", "") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);
const MAX = parseInt(getArg("--max", "0"), 10) || 0;

// Provider forced to Azure
const PROVIDER = "azure";

const ROOT = process.cwd();
const TRANSLATIONS = path.join(ROOT, "src", "translations");
const FR_PATH = path.join(TRANSLATIONS, "fr", "ressources.json");

if (!fs.existsSync(FR_PATH)) {
  console.error(`Canonical FR file not found: ${FR_PATH}`);
  process.exit(2);
}

const AZURE = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT, // may already include api-version
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1",
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
};

function loadJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { throw new Error(`Failed to parse ${p}: ${e.message}`); }
}
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8'); }

function hasUnnecessaryCaps(str) {
  if (!str || typeof str !== "string") return false;
  const allowed = new Set([
    "TVA","AFC","AVS","LAA","AC","LPP","SA","Sàrl","Odoo","CO","RPC","FER","PDF","ETIAS","UE","UEFA"
  ]);
  return str.split(/\s+/).some((w) => /[A-Z]{3,}/.test(w) && !allowed.has(w));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Extract JSON robustly (handles accidental markdown fences)
function extractJson(raw) {
  if (!raw) throw new Error("Empty response content");
  if (typeof raw !== "string") return raw; // assume already parsed
  try { return JSON.parse(raw); } catch {}
  const fence = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
  if (fence) {
    const inner = fence[1].trim();
    try { return JSON.parse(inner); } catch {}
  }
  const first = raw.indexOf("{");
  if (first !== -1) {
    let depth = 0;
    for (let i = first; i < raw.length; i++) {
      const ch = raw[i];
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const cand = raw.slice(first, i + 1);
          try { return JSON.parse(cand); } catch {}
        }
      }
    }
  }
  throw new Error("Failed to extract JSON from model output");
}

async function azureChatJson(prompt) {
  if (!AZURE.endpoint || !AZURE.apiKey) {
    throw new Error("Missing Azure OpenAI endpoint or API key");
  }
  const maxAttempts = parseInt(process.env.AZURE_OPENAI_TRANSLATE_RETRIES || "4", 10);
  let url = AZURE.endpoint;
  if (!/api-version=/.test(url)) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}api-version=${encodeURIComponent(AZURE.apiVersion)}`;
  }
  const body = {
    messages: [
      { role: "system", content: "You are a professional translator. Output ONLY a JSON object with keys title, description, content." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    top_p: 0.9,
    response_format: { type: "json_object" },
  };
  let attempt = 0;
  while (true) {
    attempt++;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": AZURE.apiKey },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    if (res.ok) {
      try {
        const parsed = JSON.parse(text);
        const content = parsed?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Azure OpenAI returned no content.");
        return extractJson(content);
      } catch (e) {
        if (attempt < maxAttempts) {
          const delay = 2000 * attempt;
          console.warn(
            `[WARN] Azure parse error (attempt ${attempt}) retrying in ${delay}ms: ${e.message}`,
          );
          await sleep(delay);
          continue;
        }
        throw new Error("Azure JSON parse error: " + e.message);
      }
    }
    if (
      (res.status === 408 ||
        res.status === 429 ||
        res.status === 500 ||
        res.status === 502 ||
        res.status === 503 ||
        res.status === 504) &&
      attempt < maxAttempts
    ) {
      const delay = 2000 * attempt; // simple linear backoff
      console.warn(
        `[WARN] Azure HTTP ${res.status} (attempt ${attempt}) retrying in ${delay}ms`,
      );
      await sleep(delay);
      continue;
    }
    throw new Error(`Azure OpenAI HTTP ${res.status}: ${text.slice(0,400)}`);
  }
}

function buildTranslatePrompt(locale, frArticle) {
  return [
    "Tu es un traducteur professionnel. Traduis le contenu français vers la langue cible.",
    "Contraintes:",
    "- Ne modifie PAS le slug ni les URLs.",
    // NOTE: an earlier wording ("pas de capitales superflues") made the model
    // lowercase entire articles. Be explicit about standard casing instead.
    "- Casse standard de la langue cible : majuscule en début de phrase, aux noms propres, marques et acronymes. Ne mets JAMAIS un titre ou un texte entièrement en minuscules ; évite seulement le Title Case à l'anglaise dans les langues qui ne l'utilisent pas.",
    "- Préserve la structure markdown.",
    "- Réponds UNIQUEMENT avec un objet JSON (aucun texte additionnel).",
    "Langue cible: " + locale,
    "Entrée FR:",
    JSON.stringify({ slug: frArticle.slug, title: frArticle.title, description: frArticle.description, content: frArticle.content }, null, 2),
    "Format sortie: { \"title\": \"...\", \"description\": \"...\", \"content\": \"...\" }"
  ].join("\n");
}

function needsTranslation(frA, locA) {
  if (!locA) return true;
  if (FORCE) return true;
  const sameTitle = (locA.title || '') === (frA.title || '');
  const sameDesc = (locA.description || '') === (frA.description || '');
  const sameContent = (locA.content || '') === (frA.content || '');
  return sameTitle && sameDesc && sameContent; // identical means untranslated
}

async function main() {
  const fr = loadJSON(FR_PATH);
  const frArticles = Array.isArray(fr.Articles) ? fr.Articles : [];
  if (!frArticles.length) throw new Error('FR Articles list is empty.');

  let processed = 0, updated = 0;

  for (const locale of LOCALES) {
    const targetPath = path.join(TRANSLATIONS, locale, 'ressources.json');
    if (!fs.existsSync(targetPath)) { console.warn(`[WARN] Missing ${locale}/ressources.json; skipping.`); continue; }
    const data = loadJSON(targetPath);
    data.Articles = Array.isArray(data.Articles) ? data.Articles : [];
    const bySlug = new Map(data.Articles.map(a => [a.slug, a]));

    for (const frA of frArticles) {
      if (ONLY_SLUGS.size && !ONLY_SLUGS.has(frA.slug)) continue;
      const locA = bySlug.get(frA.slug);
      if (!needsTranslation(frA, locA)) continue;

      processed++;
      if (MAX && processed > MAX) break;

      const prompt = buildTranslatePrompt(locale, frA);
      if (DRY) {
        console.log(`[dry-run] Would translate slug="${frA.slug}" to ${locale}`);
        continue;
      }
    const tr = await azureChatJson(prompt);
      const title = (tr && tr.title) ? String(tr.title) : frA.title;
      const description = (tr && tr.description) ? String(tr.description) : frA.description;
      const content = (tr && tr.content) ? String(tr.content) : frA.content;

      if (hasUnnecessaryCaps(title) || hasUnnecessaryCaps(description)) {
        console.warn(`[WARN] ${locale}:${frA.slug} possible unnecessary capitals in title/description.`);
      }

      const merged = {
        ...frA, // preserve slug, author, date, image
        title,
        description,
        content
      };

      // Translate reference labels too (URLs untouched). Falls back to the
      // French labels on any error rather than blocking the article.
      try {
        const labels = (frA.references || []).map((r) => r && r.labelKey).filter(Boolean);
        if (labels.length) {
          const labelMap = await translateLabels(locale, labels);
          merged.references = (frA.references || []).map((r) =>
            r && r.labelKey && labelMap[r.labelKey]
              ? { ...r, labelKey: labelMap[r.labelKey] }
              : r,
          );
        }
      } catch (e) {
        console.warn(`[WARN] ${locale}:${frA.slug} reference-label translation failed: ${e.message}`);
      }

      // If article exists, replace it; otherwise push
      if (locA) {
        const idx = data.Articles.findIndex(a => a.slug === frA.slug);
        if (idx >= 0) data.Articles[idx] = merged; else data.Articles.push(merged);
      } else {
        data.Articles.push(merged);
      }
      updated++;
      saveJSON(targetPath, data);
      console.log(`[UPDATED] ${locale}:${frA.slug}`);
    }
  }

  if (DRY) console.log(`\nDry-run complete. Articles needing translation (or identical to FR) scanned: ${processed}.`);
  else console.log(`\nDone. Articles updated: ${updated}.`);
}

main().catch(err => { console.error(err.message || err); process.exit(1); });
