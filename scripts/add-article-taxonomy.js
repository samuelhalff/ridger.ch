#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { detectTopic, normalizeGuardrailText } = require("./lib/articleTopicGuardrails");

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");
const LOCALES = ["fr", "en", "de", "es", "pt"];

const TOPIC_TAGS = {
  odoo: ["odoo", "erp", "comptabilite", "tva", "automatisation", "reporting"],
  payroll: ["paie", "salaires", "avs", "lpp", "laa", "swissdec"],
  tax: ["fiscalite", "impot", "tva", "ifd", "tax", "declaration"],
  audit: ["audit", "revision", "controle", "rapport", "seuils", "gouvernance"],
  accounting: ["comptabilite", "comptable", "bilan", "reporting", "cloture", "fer"],
  corporate: ["corporate", "gouvernance", "assemblee", "registre", "transparence", "sa"],
  domiciliation: ["domiciliation", "siege", "adresse", "courrier", "substance", "aml"],
  outsourcing: ["outsourcing", "externalisation", "bpo", "processus", "finance", "reporting"],
  ma: ["fusion", "acquisition", "due", "diligence", "transmission", "valorisation"],
  "family-office": ["patrimoine", "succession", "family", "office", "fortune", "gouvernance"],
  incorporation: ["constitution", "creation", "registre", "capital", "statuts", "succursale"],
  immigration: ["immigration", "permis", "anobag", "mobilite", "expatrie", "avs"],
  finance: ["tresorerie", "finance", "cash", "budget", "forecast", "paiement"],
  regulatory: ["conformite", "reglementaire", "oar", "lba", "aml", "finma"],
  general: ["pme", "suisse", "geneve", "fiduciaire", "conseil", "entreprise"],
};

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function getArticleCorpus(article) {
  return normalizeGuardrailText(
    `${article.content || ""} ${article.title || ""} ${article.description || ""}`,
  );
}

function deriveTags(article, category) {
  const corpus = getArticleCorpus(article);
  const candidates = TOPIC_TAGS[category] || TOPIC_TAGS.general;
  const selected = candidates.filter((tag) => corpus.includes(tag)).slice(0, 6);

  for (const tag of TOPIC_TAGS.general) {
    if (selected.length >= 3) break;
    if (!selected.includes(tag) && corpus.includes(tag)) selected.push(tag);
  }

  if (selected.length < 3) {
    for (const tag of candidates) {
      if (selected.length >= 3) break;
      if (!selected.includes(tag)) selected.push(tag);
    }
  }

  return selected.slice(0, 6);
}

const frPath = path.join(TRANSLATIONS_DIR, "fr", "ressources.json");
const frData = loadJSON(frPath);
const frArticles = Array.isArray(frData.Articles) ? frData.Articles : [];
const taxonomyBySlug = new Map();
let changes = 0;

for (const article of frArticles) {
  if (!article || !article.slug) continue;
  const category = article.category || detectTopic(article) || "general";
  const tags =
    Array.isArray(article.tags) && article.tags.length >= 3
      ? article.tags
      : deriveTags(article, category);

  taxonomyBySlug.set(article.slug, { category, tags });

  if (!article.category) {
    article.category = category;
    changes++;
  }
  if (!Array.isArray(article.tags) || article.tags.length < 3) {
    article.tags = tags;
    changes++;
  }
}

const localeData = { fr: { path: frPath, data: frData } };
for (const locale of LOCALES.filter((locale) => locale !== "fr")) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, "ressources.json");
  if (!fs.existsSync(filePath)) continue;
  const data = loadJSON(filePath);
  localeData[locale] = { path: filePath, data };
  const articles = Array.isArray(data.Articles) ? data.Articles : [];
  for (const article of articles) {
    const taxonomy = article?.slug ? taxonomyBySlug.get(article.slug) : null;
    if (!taxonomy) continue;
    if (!article.category) {
      article.category = taxonomy.category;
      changes++;
    }
    if (!Array.isArray(article.tags) || article.tags.length < 3) {
      article.tags = taxonomy.tags;
      changes++;
    }
  }
}

if (APPLY) {
  for (const { path: filePath, data } of Object.values(localeData)) {
    saveJSON(filePath, data);
  }
  console.log(`Applied article taxonomy changes: ${changes}`);
} else {
  console.log(`Would apply article taxonomy changes: ${changes}`);
}
