import { NextResponse } from "next/server";
import { isValidLocale, type Locale } from "@/src/lib/i18n";
import { getArticles, isGenuineTranslation } from "@/src/lib/articles";

type Params = { params: Promise<{ locale: string }> };

const BASE = "https://ridger.ch";

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRssDate(date?: string) {
  const parsed = date ? new Date(date) : new Date(0);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toUTCString() : parsed.toUTCString();
}

export async function GET(_request: Request, { params }: Params) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "fr";
  const articles = getArticles(locale)
    .filter((article) => locale === "fr" || isGenuineTranslation(locale, article.slug))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 20);
  const lastBuildDate = toRssDate(articles[0]?.updated ?? articles[0]?.date);

  const items = articles
    .map((article) => {
      const url = `${BASE}/${locale}/ressources/articles/${article.slug}/`;
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(article.description || "")}</description>
      <pubDate>${escapeXml(toRssDate(article.date))}</pubDate>
    </item>`;
    })
    .join("\n");

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Ridger - ${escapeXml(locale.toUpperCase())}</title>
    <link>${BASE}/${locale}/ressources/</link>
    <description>Latest Ridger articles</description>
    <language>${escapeXml(locale)}</language>
    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new NextResponse(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
