/**
 * SEO/GEO helpers for article pages: FAQ extraction (→ FAQPage JSON-LD),
 * JSON-LD keyword list, and the category → service-entity mapping used for
 * Article `about` / `isPartOf`.
 *
 * extractArticleFaq() mirrors extractFaq() in scripts/lib/ridgerArticleRules.js
 * (the pipeline validator) — keep both in sync.
 */
import type { FAQEntry } from "./structuredData";

export type ArticleKeywords = {
  primary?: string;
  secondary?: string[];
};

const FAQ_HEADING_RE =
  /^##\s+(questions fréquentes|faq|frequently asked questions|häufige fragen|preguntas frecuentes|perguntas frequentes)\s*$/i;

function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractArticleFaq(content: string | undefined): FAQEntry[] {
  const lines = String(content || "").split("\n");
  const entries: FAQEntry[] = [];
  let inFaq = false;
  let current: { question: string; answer: string[] } | null = null;
  const flush = () => {
    if (current) {
      const answer = stripMarkdown(current.answer.join(" "));
      if (current.question && answer) {
        entries.push({ question: current.question, answer });
      }
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

/**
 * JSON-LD `keywords`: researched primary + secondary keywords first, then the
 * article tags, de-duplicated (case-insensitive) and capped.
 */
export function buildArticleKeywordList(
  keywords: ArticleKeywords | undefined,
  tags: string[] | undefined,
  limit = 12,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (value: unknown) => {
    if (typeof value !== "string") return;
    const v = value.trim();
    const key = v.toLowerCase();
    if (!v || seen.has(key)) return;
    seen.add(key);
    out.push(v);
  };
  push(keywords?.primary);
  (keywords?.secondary || []).forEach(push);
  (tags || []).forEach(push);
  return out.slice(0, limit);
}

export type RidgerServiceKey =
  | "consolidated-reporting"
  | "investment-oversight"
  | "family-office-coordination"
  | "governance-succession"
  | "tax-administration"
  | "digital-vault"
  | "real-estate-transactions"
  | "household-staff"
  | "relocation-residence"
  | "domiciliation-mail"
  | "property-management";

/** Ridger article category → the service the article is "about". */
export const ridgerCategoryService: Record<string, RidgerServiceKey> = {
  "family-office": "family-office-coordination",
  reporting: "consolidated-reporting",
  fiscalite: "tax-administration",
  patrimoine: "governance-succession",
  gouvernance: "governance-succession",
  "emploi-domestique": "household-staff",
  "vie-pratique": "relocation-residence",
  "travaux-intendance": "real-estate-transactions",
};
