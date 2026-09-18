#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  getFallbackReferences,
  isBlockedDomain,
} = require("./lib/referenceValidator");
const { detectTopic } = require("./lib/articleTopicGuardrails");
const { listLocales } = require("./lib/ressources");

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");
const args = process.argv.slice(2);

const flag = (name) => args.includes(name);
const value = (name, fallback) => {
  const index = args.indexOf(name);
  return index !== -1 && index + 1 < args.length ? args[index + 1] : fallback;
};

const allLocales = flag("--all-locales");
const locale = value("--locale", "fr");
const dryRun = flag("--dry-run");
const minRefs = parseInt(value("--min-refs", "3"), 10);
const DISALLOWED_SOURCE_NAME_RE =
  /(?:cobalt(?:-it)?|ficops|fidflow|gaapex(?:\.ch)?|hoop(?:\.swiss)?|niris(?:\s+sa)?|open\s*net)/i;

function normalizeUrl(raw) {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/[)\].,;:!?*]+$/g, "");
}

function isAllowedUrl(url) {
  try {
    return Boolean(normalizeUrl(url)) && !isBlockedDomain(normalizeUrl(url));
  } catch {
    return false;
  }
}

function sanitizeDisallowedLinks(content) {
  if (typeof content !== "string" || !content) {
    return { content, removedLinks: 0 };
  }

  let removedLinks = 0;
  let next = content.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (match, text, url) => {
      if (isAllowedUrl(url)) return match;
      removedLinks++;
      return text;
    },
  );

  next = next.replace(/https?:\/\/[^\s"'<>]+/g, (rawUrl) => {
    if (isAllowedUrl(rawUrl)) return rawUrl;
    removedLinks++;
    return "";
  });

  next = next.replace(/[ \t]{2,}/g, " ");
  return { content: next, removedLinks };
}

function sanitizeDisallowedSourceMentions(content) {
  if (typeof content !== "string" || !content) {
    return { content, removedMentions: 0 };
  }

  let removedMentions = 0;
  const sourceToken = String.raw`(?:source|quelle|fuente|fonte)`;
  const parentheticalSource = new RegExp(
    String.raw`\s*\(${sourceToken}\s*:?\s*[^)]*(?:${DISALLOWED_SOURCE_NAME_RE.source})[^)]*\)`,
    "gi",
  );

  const next = content.replace(parentheticalSource, () => {
    removedMentions++;
    return "";
  });

  return {
    content: next.replace(/[ \t]{2,}/g, " "),
    removedMentions,
  };
}

function sanitizeDisallowedReferenceLines(content) {
  if (typeof content !== "string" || !content) {
    return { content, removedLines: 0 };
  }

  let removedLines = 0;
  const lines = content.split("\n").filter((line) => {
    const shouldRemove = /^\s*-\s+/.test(line) && DISALLOWED_SOURCE_NAME_RE.test(line);
    if (shouldRemove) removedLines++;
    return !shouldRemove;
  });

  return { content: lines.join("\n"), removedLines };
}

function sanitizeDanglingSourceText(content) {
  if (typeof content !== "string" || !content) {
    return { content, replacements: 0 };
  }

  const replacements = [
    [
      /Les partenaires Odoo en Suisse,\s*comme,\s*offrent/g,
      "Les partenaires Odoo en Suisse offrent",
    ],
    [
      /Odoo partners in Switzerland,\s*such as,\s*offer/g,
      "Odoo partners in Switzerland offer",
    ],
    [
      /Odoo-Partner in der Schweiz,\s*wie,\s*bieten/g,
      "Odoo-Partner in der Schweiz bieten",
    ],
    [
      /Los socios de Odoo en Suiza,\s*como,\s*ofrecen/g,
      "Los socios de Odoo en Suiza ofrecen",
    ],
    [
      /Os parceiros Odoo na Suíça,\s*como,\s*oferecem/g,
      "Os parceiros Odoo na Suíça oferecem",
    ],
  ];

  let replacementsCount = 0;
  let next = content;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, () => {
      replacementsCount++;
      return replacement;
    });
  }

  return { content: next, replacements: replacementsCount };
}

function syncReferenceSection(article) {
  if (!article || typeof article.content !== "string") return false;
  if (!Array.isArray(article.references) || article.references.length === 0) {
    return false;
  }

  const refs = article.references
    .filter((ref) => ref?.labelKey && ref?.url && isAllowedUrl(ref.url))
    .map((ref) => ({
      labelKey: String(ref.labelKey).trim(),
      url: String(ref.url).trim(),
    }))
    .filter((ref) => ref.labelKey && ref.url);

  if (!refs.length) return false;

  const original = article.content;
  const headingRe =
    /^(?:#{2,3}\s*|\*\*)?(?:référence?s?|references?|referenzen?|refer[eê]ncias?|sources?|quellen?|fuentes?|fontes?)\s*:?\s*(?:\*\*)?\s*$/gim;

  const indices = [];
  for (const match of original.matchAll(headingRe)) {
    if (typeof match.index !== "number") continue;
    const afterMatch = original.slice(match.index);
    const nextLines = afterMatch.split("\n").slice(1, 5).join("\n");
    if (nextLines.match(/^\s*-\s+/m) || afterMatch.length < 500) {
      indices.push(match.index);
    }
  }

  let body = indices.length
    ? original.slice(0, indices[0]).trimEnd()
    : original.trimEnd();
  body = body.replace(/(\n---\s*)+$/, "").trimEnd();

  const list = refs.map((ref) => `- [${ref.labelKey}](${ref.url})`).join("\n");
  article.content = `${body}\n\n---\n### Références\n${list}\n`;
  return article.content !== original;
}

function cleanArticle(article) {
  if (!article || typeof article !== "object") {
    return { removedRefs: 0, addedFallbacks: 0, removedLinks: 0, changed: false };
  }

  const hasReferences = Array.isArray(article.references);
  const beforeRefs = hasReferences ? article.references : [];
  let refs = hasReferences
    ? beforeRefs.filter((ref) => isAllowedUrl(ref?.url))
    : [];
  const removedRefs = beforeRefs.length - refs.length;

  if (removedRefs > 0 && refs.length < minRefs) {
    const existing = new Set(refs.map((ref) => ref.url));
    for (const fallback of getFallbackReferences(detectTopic(article))) {
      if (refs.length >= minRefs) break;
      if (!fallback?.url || existing.has(fallback.url) || !isAllowedUrl(fallback.url)) {
        continue;
      }
      refs.push({ ...fallback });
      existing.add(fallback.url);
    }
  }

  const addedFallbacks = Math.max(0, refs.length - (beforeRefs.length - removedRefs));
  if (hasReferences) article.references = refs;

  const sanitized = sanitizeDisallowedLinks(article.content);
  const sourceMentions = sanitizeDisallowedSourceMentions(sanitized.content);
  const referenceLines = sanitizeDisallowedReferenceLines(sourceMentions.content);
  const danglingText = sanitizeDanglingSourceText(referenceLines.content);
  article.content = danglingText.content;
  const synced = removedRefs > 0 || addedFallbacks > 0 || referenceLines.removedLines > 0
    ? syncReferenceSection(article)
    : false;

  return {
    removedRefs,
    addedFallbacks,
    removedLinks:
      sanitized.removedLinks +
      sourceMentions.removedMentions +
      referenceLines.removedLines +
      danglingText.replacements,
    changed:
      removedRefs > 0 ||
      addedFallbacks > 0 ||
      sanitized.removedLinks > 0 ||
      sourceMentions.removedMentions > 0 ||
      referenceLines.removedLines > 0 ||
      danglingText.replacements > 0 ||
      synced,
  };
}

function cleanLocale(loc) {
  const filePath = path.join(TRANSLATIONS_DIR, loc, "ressources.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const articles = Array.isArray(data.Articles) ? data.Articles : [];
  const totals = {
    locale: loc,
    articlesChanged: 0,
    removedRefs: 0,
    addedFallbacks: 0,
    removedLinks: 0,
  };

  for (const article of articles) {
    const result = cleanArticle(article);
    if (result.changed) totals.articlesChanged++;
    totals.removedRefs += result.removedRefs;
    totals.addedFallbacks += result.addedFallbacks;
    totals.removedLinks += result.removedLinks;
  }

  const changed =
    totals.articlesChanged > 0 ||
    totals.removedRefs > 0 ||
    totals.addedFallbacks > 0 ||
    totals.removedLinks > 0;

  if (changed && !dryRun) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  }

  return totals;
}

function main() {
  const locales = allLocales
    ? listLocales(TRANSLATIONS_DIR, { requireRessources: true })
    : [locale];
  const results = locales.map(cleanLocale);

  for (const result of results) {
    console.log(
      `${dryRun ? "[dry-run] " : ""}${result.locale}: changed ${result.articlesChanged} article(s), removed ${result.removedRefs} reference(s), added ${result.addedFallbacks} fallback(s), stripped ${result.removedLinks} content link(s)`,
    );
  }
}

main();
