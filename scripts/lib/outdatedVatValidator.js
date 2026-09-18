"use strict";

const ARTICLE_VAT_CONTEXT_RE = /\b(TVA|VAT|MWST|IVA)\b/i;
const OUTDATED_SWISS_VAT_RATES = [
  { pattern: /\b7[.,]7\s*%/g, currentRate: "8.1%" },
  { pattern: /\b2[.,]5\s*%/g, currentRate: "2.6%" },
  { pattern: /\b3[.,]7\s*%/g, currentRate: "3.8%" },
];

function extractOutdatedSwissVatRateMatches(article) {
  if (!article || typeof article !== "object") return [];

  const articleContext = [article.slug, article.title]
    .filter((value) => typeof value === "string")
    .join("\n");
  const text = [article.description, article.content]
    .filter((value) => typeof value === "string")
    .join("\n\n");

  if (!text) return [];

  const matches = [];
  const hasArticleVatContext = ARTICLE_VAT_CONTEXT_RE.test(articleContext);

  for (const { pattern, currentRate } of OUTDATED_SWISS_VAT_RATES) {
    for (const match of text.matchAll(pattern)) {
      const index = match.index ?? 0;
      const context = text.slice(
        Math.max(0, index - 180),
        Math.min(text.length, index + 180),
      );
      if (!hasArticleVatContext && !ARTICLE_VAT_CONTEXT_RE.test(context)) {
        continue;
      }
      matches.push({
        rate: match[0],
        currentRate,
        context,
      });
    }
  }

  return matches;
}

module.exports = {
  extractOutdatedSwissVatRateMatches,
};
