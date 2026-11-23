/**
 * FAQ of a page, read from its translation file ("Faq": { Title, Questions:
 * [{ Question, Answer }] }; city pages: locations.json "Cities.<city>.Faq").
 * The same entries feed the visible section and the FAQPage JSON-LD
 * (src/components/site/page-faq.tsx), so both always say the same thing.
 */
import fs from "fs";
import path from "path";
import type { FAQEntry } from "./structuredData";

export type PageFaq = { title: string; entries: FAQEntry[] };

type RawFaq = { Title?: unknown; Questions?: unknown };

function readJson(locale: string, ns: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "translations", locale, `${ns}.json`), "utf8"));
  } catch {
    return null;
  }
}

export function parseFaq(raw: unknown): PageFaq | null {
  if (!raw || typeof raw !== "object") return null;
  const { Title, Questions } = raw as RawFaq;
  if (!Array.isArray(Questions)) return null;
  const entries = Questions.flatMap((q) => {
    const question = typeof q?.Question === "string" ? q.Question.trim() : "";
    const answer = typeof q?.Answer === "string" ? q.Answer.trim() : "";
    return question && answer ? [{ question, answer }] : [];
  });
  if (!entries.length) return null;
  return { title: typeof Title === "string" && Title.trim() ? Title.trim() : "FAQ", entries };
}

/** FAQ of a namespace, at the dotted key `at` ("Faq" by default). */
export function getPageFaq(locale: string, ns: string, at = "Faq"): PageFaq | null {
  const data = readJson(locale, ns);
  if (!data) return null;
  const raw = at.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), data);
  return parseFaq(raw);
}
