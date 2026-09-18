import fs from "fs";
import path from "path";
import { cache } from "react";
import { locales, type Locale } from "./i18n-locales";

export const ARTICLE_CACHE_TTL_MS = 15 * 60 * 1000;

export type ArticleReference = {
  labelKey: string;
  url: string;
};

export type ResourceArticle = {
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

type CachedArticles = {
  expiresAt: number;
  articles: ResourceArticle[];
};

const articlesByLocale = new Map<Locale, CachedArticles>();

function readArticles(locale: Locale): ResourceArticle[] {
  const file = path.join(
    process.cwd(),
    "src",
    "translations",
    locale,
    "ressources.json",
  );

  try {
    if (!fs.existsSync(file)) return [];
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as {
      Articles?: unknown;
    };
    if (!Array.isArray(json.Articles)) return [];
    return json.Articles.filter((article): article is ResourceArticle => {
      if (!article || typeof article !== "object") return false;
      const candidate = article as Partial<ResourceArticle>;
      return Boolean(candidate.slug && candidate.title);
    });
  } catch {
    return [];
  }
}

function loadArticles(locale: Locale): ResourceArticle[] {
  const now = Date.now();
  const cached = articlesByLocale.get(locale);
  if (cached && cached.expiresAt > now) {
    return cached.articles;
  }

  const articles = readArticles(locale);
  articlesByLocale.set(locale, {
    expiresAt: now + ARTICLE_CACHE_TTL_MS,
    articles,
  });
  return articles;
}

export const getArticles = cache((locale: Locale): ResourceArticle[] =>
  loadArticles(locale),
);

export const getArticle = cache(
  (locale: Locale, slug: string): ResourceArticle | undefined =>
    getArticles(locale).find((article) => article.slug === slug),
);

function isDuplicateOfFr(article: ResourceArticle, frArticle: ResourceArticle) {
  const sameTitle = (article.title || "") === (frArticle.title || "");
  const sameDesc = (article.description || "") === (frArticle.description || "");
  const sameContent = (article.content || "") === (frArticle.content || "");
  return sameTitle && sameDesc && sameContent;
}

export const isGenuineTranslation = cache((locale: Locale, slug: string) => {
  if (locale === "fr") return true;

  const article = getArticle(locale, slug);
  const frArticle = getArticle("fr", slug);
  if (!article || !frArticle) return false;

  return !isDuplicateOfFr(article, frArticle);
});

export const getValidLocalesForSlug = cache((slug: string): Locale[] =>
  locales.filter((locale) => {
    const article = getArticle(locale, slug);
    if (!article) return false;
    return locale === "fr" || isGenuineTranslation(locale, slug);
  }),
);
