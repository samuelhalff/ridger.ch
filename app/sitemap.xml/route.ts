import { NextResponse } from "next/server";
import { locales, type Locale } from "@/src/lib/i18n-locales";
import { localizePath } from "@/src/lib/paths";
import { hreflangFor } from "@/src/lib/hreflang";
import { getArticles, getValidLocalesForSlug } from "@/src/lib/articles";

const BASE = "https://ridger.ch";
const canonicalLocale: Locale = "fr";
// Bump manually when static-page content changes meaningfully; a build-time
// date would falsely mark every static URL as modified on each deploy.
const STATIC_LASTMOD = "2026-09-16";

function getPlaceholderLocales(): Set<string> {
  const raw = process.env.PLACEHOLDER_LOCALES || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

// static routes
const staticPaths = [
  "/",
  "/ai-profile",
  "/approach",
  "/services",
  "/ressources",
  "/contact",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
];

// dynamic routes
const servicePaths = [
  "/services/consolidated-reporting",
  "/services/investment-oversight",
  "/services/family-office-coordination",
  "/services/governance-succession",
  "/services/tax-administration",
  "/services/digital-vault",
  "/services/real-estate-transactions",
];

type PathEntry = { path: string; date?: string; locales?: Locale[] } | string;
const toPathEntry = (p: PathEntry) => (typeof p === "string" ? { path: p } : p);

function getSitemapLocales() {
  const placeholderLocales = getPlaceholderLocales();
  return locales.filter((locale) => !placeholderLocales.has(locale as any));
}

function getSitemapPaths(sitemapLocales: readonly Locale[]) {
  const canonicalArticles = getArticles(canonicalLocale);
  const articles = canonicalArticles.length ? canonicalArticles : getArticles("en");
  const ressourcesArticles = articles.map((article) => ({
    path: `/ressources/articles/${article.slug}`,
    date: article.updated ?? article.date,
    locales: getValidLocalesForSlug(article.slug).filter((locale) =>
      sitemapLocales.includes(locale),
    ),
  }));

  return [
    ...staticPaths.map(toPathEntry),
    ...servicePaths.map(toPathEntry),
    ...ressourcesArticles,
  ] as Array<{ path: string; date?: string; locales?: Locale[] }>;
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const sitemapLocales = getSitemapLocales();
  const paths = getSitemapPaths(sitemapLocales);

  const urlEntries = paths.flatMap((pObj) => {
    const p = pObj.path;
    const pathLocales = (
      pObj.locales?.length ? pObj.locales : sitemapLocales
    ).filter((locale) => sitemapLocales.includes(locale as any));
    // build per-locale entries and optionally a non-prefixed default locale entry
    return pathLocales.map((locale) => {
      const basePath = p === "/" ? "" : p;
      const localized = basePath ? localizePath(basePath, locale as any) : "";
      // Add trailing slash to match trailingSlash: true in next.config.js
      const loc = `${BASE}/${locale}${localized}/`;
      const lastmod = pObj.date || STATIC_LASTMOD;
      // derive changefreq/priority
      const isHome = p === "/";
      const isArticle = p.startsWith("/ressources/articles/");
      const isResources = p.startsWith("/ressources") && !isArticle;
      const isService = p.startsWith("/services");
      const isLegal = p.startsWith("/legal/");
      const changefreq =
        isHome || isArticle
          ? "weekly"
          : isService || isResources
          ? "monthly"
          : isLegal
          ? "yearly"
          : "monthly";
      const priority = isHome
        ? "1.0"
        : isArticle
        ? "0.8"
        : isService
        ? "0.7"
        : isResources
        ? "0.6"
        : isLegal
        ? "0.3"
        : "0.5";

      // build alternates block
      const alternates = [
        ...pathLocales.map((alt) => {
          const altPathBase = p === "/" ? "" : p;
          const altLocalized = altPathBase
            ? localizePath(altPathBase, alt as any)
            : "";
          // Add trailing slash to alternate hrefs
          const href = `${BASE}/${alt}${altLocalized}/`;
          const hreflang = hreflangFor(alt as Locale);
          return `    <xhtml:link rel="alternate" hreflang="${escapeXml(
            hreflang
          )}" href="${escapeXml(href)}"/>`;
        }),
        // x-default points to FR per canonical policy
        (() => {
          const xDefaultLocale = pathLocales.includes(canonicalLocale)
            ? canonicalLocale
            : pathLocales[0];
          const altPathBase = p === "/" ? "" : p;
          const altLocalized = altPathBase
            ? localizePath(altPathBase, xDefaultLocale as any)
            : "";
          // Add trailing slash to x-default href
          const href = `${BASE}/${xDefaultLocale}${altLocalized}/`;
          return `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
            href
          )}"/>`;
        })(),
      ].join("\n");
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alternates}
  </url>`;
    });
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join("\n")}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
