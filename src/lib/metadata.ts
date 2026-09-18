import { Metadata } from "next";
import { Locale, locales } from "./i18n";
import { localizePath } from "./paths";
import { hreflangFor } from "./hreflang";
import fs from 'fs';
import { join as pathJoin } from 'path';

interface MetadataConfig {
  default: {
    title: string;
    description: string;
    keywords: string;
    author: string;
    siteName: string;
  };
  pages: Record<string, {
    title: string;
    description: string;
    keywords: string;
  }>;
  dynamic: {
    articles: {
      titleTemplate: string;
      descriptionTemplate: string;
      keywords: string;
    };
  };
}

const metadataConfigCache = new Map<Locale, MetadataConfig>();

// Function to load metadata config for a specific locale
async function loadMetadataConfig(locale: Locale): Promise<MetadataConfig> {
  const cached = metadataConfigCache.get(locale);
  if (cached) return cached;

  const readMetadata = (loc: string): MetadataConfig | null => {
    try {
      const filePath = pathJoin(process.cwd(), "src", "translations", loc, "metadata.json");
      if (!fs.existsSync(filePath)) return null;
      const fileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileContent);
    } catch {
      return null;
    }
  };

  const primary = readMetadata(locale);
  const fallback = primary ? null : readMetadata("en");

  if (!primary && !fallback) {
    throw new Error(`Metadata config not found for locale ${locale}`);
  }

  const resolved = primary ?? fallback!;
  metadataConfigCache.set(locale, resolved);
  return resolved;
}

const withTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

// Parse placeholder locales from env (e.g., PLACEHOLDER_LOCALES="es,pt").
function getPlaceholderLocales(): Set<Locale> {
  const raw = process.env.PLACEHOLDER_LOCALES || '';
  const set = new Set<Locale>();
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => {
      if ((locales as readonly string[]).includes(s)) set.add(s as Locale);
    });
  return set;
}

export async function getPageMetadata(
  locale: Locale,
  path: string,
  customData?: {
    articleTitle?: string;
    articleDescription?: string;
    validLocales?: Locale[];
  }
): Promise<Metadata> {
  const config = await loadMetadataConfig(locale);
  const placeholderLocales = getPlaceholderLocales();
  
  // Normalize path for consistent lookup (remove trailing slash for lookup)
  const normalizedPath = path === "/" ? "/" : path.replace(/\/+$/, "");
  
  // Get page-specific metadata or fall back to default
  const pageData = config.pages[normalizedPath] || config.default;
  
  let title = pageData.title;
  let description = pageData.description;
  
  // Handle dynamic pages (like articles)
  if (normalizedPath.startsWith("/ressources/articles/") && customData?.articleTitle) {
    title = config.dynamic.articles.titleTemplate.replace("{articleTitle}", customData.articleTitle);
    description = config.dynamic.articles.descriptionTemplate.replace("{articleDescription}", customData.articleDescription || "");
  }
  
  // Generate locale-aware URLs (all locales have prefix in our setup, but slugs may differ per locale)
  const localizedCanonical = localizePath(normalizedPath, locale);
  const canonicalPath = withTrailingSlash(`/${locale}${localizedCanonical}`);
  
  // Determine which locales to include in alternates
  // If validLocales is provided, use only those; otherwise use all locales
  const localesToInclude: Locale[] = customData?.validLocales ?? [...locales];
  
  const alternateUrls = localesToInclude.reduce<Record<string, string>>((acc, loc) => {
    const localized = localizePath(normalizedPath, loc);
    const locPath = withTrailingSlash(`/${loc}${localized}`);
    const key = hreflangFor(loc);
    acc[key] = `https://ridger.ch${locPath}`;
    return acc;
  }, {});

  const ogLocale =
    locale === 'fr' ? 'fr_CH' :
    locale === 'de' ? 'de_CH' :
    locale === 'es' ? 'es_ES' :
    locale === 'pt' ? 'pt_PT' :
    'en_US';

  // Prefer the locale-specific OG image; fall back to the FR one if a locale's
  // asset is missing (all five exist today, so the fallback is a safety net).
  const ogLocaleImage = `/assets/og/og-${locale}.webp`;
  let ogImage = "/assets/og/og-fr.webp";
  try {
    if (fs.existsSync(pathJoin(process.cwd(), 'public', ogLocaleImage.replace(/^\//, '')))) {
      ogImage = ogLocaleImage;
    }
  } catch {}

  const metadata: Metadata = {
    metadataBase: new URL('https://ridger.ch'),
    // Titles in metadata.json/titleTemplate carry the brand themselves; the root
    // layout deliberately has no title template (it would double the brand).
    title,
    description,
    keywords: pageData.keywords || config.default.keywords,
    authors: [{ name: config.default.author }],
    creator: config.default.author,
    publisher: config.default.siteName,
    robots: {
      index: !placeholderLocales.has(locale),
      follow: !placeholderLocales.has(locale),
      googleBot: {
        index: !placeholderLocales.has(locale),
        follow: !placeholderLocales.has(locale),
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: `https://ridger.ch${canonicalPath}`,
      title,
      description,
      siteName: config.default.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Ridger",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
  images: [ogImage],
    },
    icons: {
      icon: [
        {
          url: "/favicon.ico",
          sizes: "any",
        },
        {
          url: "/favicon.png",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: "/favicon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    alternates: {
      canonical: `https://ridger.ch${canonicalPath}`,
      languages: Object.assign(
        {
          'x-default': (() => {
            const defaultLocale = localesToInclude.includes('fr' as Locale) ? 'fr' : localesToInclude[0];
            return `https://ridger.ch${withTrailingSlash(
              `/${defaultLocale}${localizePath(normalizedPath, defaultLocale as Locale)}`
            )}`;
          })(),
        },
        alternateUrls
      ),
      types: {
        "application/rss+xml": `https://ridger.ch/${locale}/feed.xml/`,
      },
    },
  };

  return metadata;
}

// Helper function for static pages (backward compatibility)
export async function generateMetadataForPage(
  localeOrPath: Locale | string,
  path?: string
): Promise<Metadata> {
  if (typeof localeOrPath === 'string' && !path) {
    // Old signature: generateMetadataForPage("/path") - default to French
    return await getPageMetadata('fr' as Locale, localeOrPath);
  } else if (typeof localeOrPath === 'string' && path) {
    // New signature: generateMetadataForPage(locale, path)
    return await getPageMetadata(localeOrPath as Locale, path);
  } else {
    // New signature: generateMetadataForPage(locale, path)
    return await getPageMetadata(localeOrPath as Locale, path || '/');
  }
}

// Helper function for dynamic pages (like articles)
export async function generateMetadataForArticle(
  localeOrSlug: Locale | string,
  slugOrTitle?: string,
  titleOrDescription?: string,
  description?: string,
  validLocales?: Locale[]
): Promise<Metadata> {
  if (typeof localeOrSlug === 'string' && slugOrTitle && titleOrDescription && !description) {
    // Old signature: generateMetadataForArticle(slug, title, description)
    return await getPageMetadata('fr' as Locale, `/ressources/articles/${localeOrSlug}`, {
      articleTitle: slugOrTitle,
      articleDescription: titleOrDescription,
      validLocales,
    });
  } else {
    // New signature: generateMetadataForArticle(locale, slug, title, description, validLocales)
    return await getPageMetadata(localeOrSlug as Locale, `/ressources/articles/${slugOrTitle}`, {
      articleTitle: titleOrDescription,
      articleDescription: description,
      validLocales,
    });
  }
}
