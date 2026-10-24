"use strict";

const ARTICLE_VAT_CONTEXT_RE = /\b(TVA|VAT|MWST|IVA)\b/i;
const OUTDATED_SWISS_VAT_RATES = [
  { pattern: /\b7[.,]7\s*%/g, currentRate: "8.1%" },
  { pattern: /\b2[.,]5\s*%/g, currentRate: "2.6%" },
  { pattern: /\b3[.,]7\s*%/g, currentRate: "3.8%" },
];

// An old rate is accepted only when its own context marks it as historical:
// - a transition to the current rate right after it ("de 7.7% à 8.1%", "from 7.7% to 8.1%");
// - a historical marker in the same clause, close to the rate ("ancien taux de 7.7%", "7.7% jusqu'en 2023");
// - a year <= 2023 close to the rate in the same sentence ("En 2022, la TVA était de 7.7%").
// A current rate or marker elsewhere in the sentence does not count.
const TRANSITION_RE = /^[^.%\n]{0,25}?(?:(?<![\p{L}])(?:à|a|to|auf|para|zu)|→|->)\s*(?:8[.,]1|2[.,]6|3[.,]8)\s*%/iu;
const HISTORICAL_MARKER_RE = new RegExp(
  "(?<![\\p{L}])(?:avant|jusqu['\u2019]en|jusqu['\u2019]\u00e0|ancien(?:ne)?s?|[ée]tait|[ée]taient|s['\\u2019]appliquait|valait|until|was|were|used to|previously|formerly|former|bis|fr\u00fcher|antes|hasta|era|fue|foi|at\u00e9|anteriormente)(?![\\p{L}])",
  "iu",
);
const OLD_YEAR_RE = /(?<!\d)(?:19\d{2}|20(?:0\d|1\d|2[0-3]))(?!\d)/;
const PROXIMITY = 40;

function sentenceAround(text, index, length) {
  const isEnd = (i) => /[.!?]/.test(text[i]) && (i + 1 >= text.length || /\s/.test(text[i + 1]));
  let start = index;
  while (start > 0 && text[start - 1] !== "\n" && !isEnd(start - 1)) start--;
  let end = index + length;
  while (end < text.length && text[end] !== "\n" && !isEnd(end)) end++;
  return { text: text.slice(start, end), offset: index - start };
}

// Clause boundaries: ", " (not the decimal comma in "7,7 %"), ";", ":" followed by a space.
function clauseAround(sentence, offset, length) {
  const isBoundary = (i) => /[,;:]/.test(sentence[i]) && /\s/.test(sentence[i + 1] || "");
  let start = offset;
  while (start > 0 && !isBoundary(start - 1)) start--;
  let end = offset + length;
  while (end < sentence.length && !isBoundary(end)) end++;
  return { text: sentence.slice(start, end), offset: offset - start };
}

function near(segment, offset, length, re) {
  const before = segment.slice(Math.max(0, offset - PROXIMITY), offset);
  const after = segment.slice(offset + length, offset + length + PROXIMITY);
  return re.test(before) || re.test(after);
}

function isHistoricalContext(text, index, length) {
  if (TRANSITION_RE.test(text.slice(index + length, index + length + 40))) return true;
  const sentence = sentenceAround(text, index, length);
  if (near(sentence.text, sentence.offset, length, OLD_YEAR_RE)) return true;
  const clause = clauseAround(sentence.text, sentence.offset, length);
  return near(clause.text, clause.offset, length, HISTORICAL_MARKER_RE);
}

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
      if (isHistoricalContext(text, index, match[0].length)) continue;
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
  isHistoricalContext,
  extractOutdatedSwissVatRateMatches,
};
