import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { Locale } from "./i18n-locales";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ArticleReference = {
  labelKey: string;
  url: string;
};

export type RessourceArticle = {
  slug: string;
  title: string;
  description?: string;
  content?: string;
  date?: string;
  updated?: string;
  author?: string;
  authorUrl?: string;
  image?: string;
  references?: ArticleReference[];
  category?: string;
  tags?: string[];
};

export type RessourcesData = Record<string, unknown> & {
  Articles: RessourceArticle[];
};

function resolveTranslationsDir() {
  const candidates = [
    path.join(process.cwd(), "src", "translations"),
    path.join(process.cwd(), "translations"),
    path.join(__dirname, "..", "translations"),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {}
  }

  return candidates[0];
}

function normalizeArticles(input: unknown): RessourceArticle[] {
  if (!Array.isArray(input)) return [];
  return input.filter((article): article is RessourceArticle => {
    if (!article || typeof article !== "object") return false;
    const candidate = article as Partial<RessourceArticle>;
    return Boolean(candidate.slug && candidate.title);
  });
}

function readRessourcesFile(locale: Locale): RessourcesData | null {
  const filePath = path.join(
    resolveTranslationsDir(),
    locale,
    "ressources.json",
  );

  if (!fs.existsSync(filePath)) return null;

  const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<
    string,
    unknown
  >;

  return {
    ...data,
    Articles: normalizeArticles(data.Articles),
  };
}

export function loadRessourcesData(locale: Locale): RessourcesData {
  const primary = readRessourcesFile(locale);
  if (primary) return primary;

  if (locale !== "fr") {
    const fallback = readRessourcesFile("fr");
    if (fallback) return fallback;
  }

  throw new Error(`Missing ressources translations for locale "${locale}"`);
}
