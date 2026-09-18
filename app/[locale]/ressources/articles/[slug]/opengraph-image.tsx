import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/src/lib/i18n";
import { loadRessourcesData } from "@/src/lib/ressources";

// Route Segment Config
export const runtime = "nodejs";
// Cache for 1 day as article titles seldom change. Adjust if editing frequency differs.
export const revalidate = 86400; // 60 * 60 * 24 = 24h
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ArticleData {
  slug: string;
  title: string;
  description?: string;
  content?: string;
  date?: string;
}

interface RessourcesData {
  Articles?: ArticleData[];
}

/**
 * Check if an article in a non-canonical locale is a genuine translation.
 * Returns true if the article has meaningfully different content from FR.
 */
function isGenuineTranslation(
  article: ArticleData,
  canonicalArticle: ArticleData
): boolean {
  const sameTitle = (article.title || "") === (canonicalArticle.title || "");
  const sameDesc =
    (article.description || "") === (canonicalArticle.description || "");
  const sameContent =
    (article.content || "") === (canonicalArticle.content || "");
  // If all three are identical, it's a duplicate, not a translation
  return !(sameTitle && sameDesc && sameContent);
}

/**
 * Dynamic Open Graph image for article pages.
 * Displays localized title, brand mark, and subtle background.
 * Returns 404 for non-existent or duplicate articles to match page behavior.
 */
export default async function Image({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const { slug } = params;
  const locale: Locale = isValidLocale(params.locale) ? params.locale : "fr";
  
  // Load locale-specific translations
  const ressources = loadRessourcesData(locale) as RessourcesData;
  const article = ressources.Articles?.find((entry) => entry.slug === slug);
  
  // If article doesn't exist in this locale, return 404
  if (!article) {
    notFound();
  }
  
  // For non-French locales, check if it's a genuine translation
  if (locale !== "fr") {
    try {
      const frRessources = loadRessourcesData("fr") as RessourcesData;
      const frArticle = frRessources.Articles?.find((a) => a.slug === slug);
      
      // If we can compare to FR and it's a duplicate, return 404
      if (frArticle && !isGenuineTranslation(article, frArticle)) {
        notFound();
      }
    } catch {
      // If FR translations can't be loaded, continue with the image
    }
  }

  const brand = "Ridger";
  const bg =
    locale === "fr"
      ? "linear-gradient(135deg,#0f172a,#1e293b)"
      : "linear-gradient(135deg,#1e293b,#334155)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          padding: 64,
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 48,
            lineHeight: 1.15,
            fontWeight: 600,
            whiteSpace: "pre-wrap",
            display: "flex",
          }}
        >
          {article.title.length > 120
            ? article.title.slice(0, 117) + "…"
            : article.title}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 500, display: "flex" }}>
            {brand}
          </div>
          <div style={{ fontSize: 20, opacity: 0.85, display: "flex" }}>
            {locale.toUpperCase()} · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noimageindex",
      },
    }
  );
}
