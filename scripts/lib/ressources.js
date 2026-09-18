"use strict";

const fs = require("fs");
const path = require("path");

function ensureDirectory(dir) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`Directory not found: ${dir}`);
  }
}

function listLocales(translationsDir, options = {}) {
  const { requireRessources = false } = options;
  ensureDirectory(translationsDir);
  return fs
    .readdirSync(translationsDir, { withFileTypes: true })
    .filter((entry) => {
      if (!entry.isDirectory()) {
        return false;
      }
      if (!requireRessources) {
        return true;
      }
      const filePath = path.join(translationsDir, entry.name, "ressources.json");
      return fs.existsSync(filePath);
    })
    .map((entry) => entry.name)
    .sort();
}

function buildArticleMap(data, locale, options = {}) {
  const { strict = false } = options;
  const entries = Array.isArray(data?.Articles) ? data.Articles : [];
  const map = new Map();
  const order = [];
  const problems = [];

  entries.forEach((article, index) => {
    const rawSlug = article?.slug;
    const slug = typeof rawSlug === "string" ? rawSlug.trim() : "";
    if (!slug) {
      problems.push(
        `Article at index ${index} in locale "${locale}" uses an invalid slug`
      );
      return;
    }

    if (rawSlug !== slug) {
      problems.push(
        `Article slug "${rawSlug}" in locale "${locale}" contains leading or trailing whitespace`
      );
      return;
    }

    if (map.has(slug)) {
      problems.push(
        `Duplicate article slug "${slug}" detected in locale "${locale}"`
      );
      return;
    }

    map.set(slug, article);
    order.push(slug);
  });

  if (strict && problems.length) {
    throw new Error(problems.join("; "));
  }

  return { map, order, problems };
}

module.exports = {
  ensureDirectory,
  listLocales,
  buildArticleMap,
};
