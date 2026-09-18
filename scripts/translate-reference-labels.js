#!/usr/bin/env node
/*
 * Translate reference labelKeys in src/translations/<locale>/ressources.json.
 *
 * The article translation pipeline historically preserved the references
 * array verbatim (French labels in every locale). This script batch-translates
 * the labels of existing articles, and exports translateLabels() so
 * translate-articles.js can translate labels for future articles.
 *
 * Usage:
 *   node scripts/translate-reference-labels.js [--locales en,de,es,pt] [--dry-run]
 *
 * Env: AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY (same as translate-articles.js)
 */
try { require("dotenv").config(); } catch {}
const fs = require("fs");
const path = require("path");

const AZURE = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
};

const LOCALE_NAMES = {
  en: "English",
  de: "German (Swiss context: use official German names of Swiss laws and institutions)",
  es: "Spanish",
  pt: "European Portuguese",
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function azureJson(system, user) {
  if (!AZURE.endpoint || !AZURE.apiKey) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY");
  }
  let url = AZURE.endpoint;
  if (!/api-version=/.test(url)) {
    const sep = url.includes("?") ? "&" : "?";
    url = `${url}${sep}api-version=${encodeURIComponent(AZURE.apiVersion)}`;
  }
  const body = {
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": AZURE.apiKey },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    if (res.ok) {
      try {
        const content = JSON.parse(text)?.choices?.[0]?.message?.content;
        return JSON.parse(content);
      } catch (e) {
        if (attempt === 4) throw new Error("Azure JSON parse error: " + e.message);
      }
    } else if (attempt === 4) {
      throw new Error(`Azure HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    await sleep(2000 * attempt);
  }
  throw new Error("unreachable");
}

/**
 * Translate an array of French citation labels into the target locale.
 * Returns a map { frenchLabel: translatedLabel }. Untranslatable entries
 * (pure domains, proper names) come back unchanged by instruction.
 */
async function translateLabels(locale, labels, { batchSize = 40 } = {}) {
  const unique = [...new Set(labels.filter(Boolean))];
  const map = {};
  const system =
    "You translate short citation titles (source labels of article references). " +
    'Output ONLY a JSON object of the form {"translations": ["...", ...]} with ' +
    "EXACTLY one entry per input, same order.";
  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize);
    const user = [
      `Target language: ${LOCALE_NAMES[locale] || locale}.`,
      "Translate each French citation title below.",
      "Rules:",
      "- Keep domain names, brand names and acronyms unchanged (e.g. fedlex.admin.ch, Odoo, AVS, NIST).",
      "- Use the official target-language name of Swiss laws/institutions when one exists (e.g. Code des obligations -> Obligationenrecht in German).",
      "- Keep the same tone and roughly the same length; these are link labels, not sentences.",
      "- If a title is already fully a proper name or domain, return it unchanged.",
      "Input JSON:",
      JSON.stringify({ titles: batch }),
    ].join("\n");
    const out = await azureJson(system, user);
    const arr = Array.isArray(out?.translations) ? out.translations : null;
    if (!arr || arr.length !== batch.length) {
      throw new Error(
        `Batch size mismatch for ${locale}: sent ${batch.length}, got ${arr ? arr.length : "none"}`,
      );
    }
    batch.forEach((src, idx) => {
      const t = typeof arr[idx] === "string" ? arr[idx].trim() : "";
      map[src] = t || src;
    });
  }
  return map;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry-run");
  const li = args.indexOf("--locales");
  const locales =
    li !== -1 && args[li + 1] ? args[li + 1].split(",") : ["en", "de", "es", "pt"];

  const root = process.cwd();
  for (const locale of locales) {
    const p = path.join(root, "src", "translations", locale, "ressources.json");
    if (!fs.existsSync(p)) { console.warn(`skip ${locale}: no file`); continue; }
    const data = JSON.parse(fs.readFileSync(p, "utf8"));
    const labels = [];
    for (const a of data.Articles || []) {
      for (const r of a.references || []) if (r && r.labelKey) labels.push(r.labelKey);
    }
    const unique = [...new Set(labels)];
    console.log(`[${locale}] ${unique.length} unique labels`);
    if (dry) continue;
    const map = await translateLabels(locale, unique);
    let changed = 0;
    for (const a of data.Articles || []) {
      for (const r of a.references || []) {
        if (r && r.labelKey && map[r.labelKey] && map[r.labelKey] !== r.labelKey) {
          r.labelKey = map[r.labelKey];
          changed++;
        }
      }
    }
    fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`[${locale}] updated ${changed} labels`);
  }
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { translateLabels };
