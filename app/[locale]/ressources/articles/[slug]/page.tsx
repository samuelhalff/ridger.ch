import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import ContactSection from "../components/ContactSection";
import ArticleContextualCTA from "@/src/components/ui/article-contextual-cta";
import { generateMetadataForArticle } from "@/src/lib/metadata";
import { headers } from "next/headers";
import { getTranslations, isValidLocale, type Locale } from "@/src/lib/i18n";
import RelatedArticles from "@/src/components/ressources/RelatedArticles";
import Breadcrumbs from "@/src/components/navigation/Breadcrumbs";
import { estimateReadingTime } from "@/src/lib/readingTime";
import dynamicImport from "next/dynamic";
import Defer from "@/src/components/Defer";
import {
  buildInternalUrl,
  localizePath,
  normalizeInternalHref,
} from "@/src/lib/paths";
import { getCategoryServicePath } from "@/src/lib/articleCta";
import {
  getArticle,
  getValidLocalesForSlug,
  isGenuineTranslation,
  type ResourceArticle,
} from "@/src/lib/articles";
import { loadRessourcesData } from "@/src/lib/ressources";
import {
  fallbackCategoryLabel,
  type ResourceCategoryLabels,
} from "@/src/lib/resourceCategories";
import {
  buildArticleSchema,
  buildBreadcrumbList,
  getArkServiceEntityId,
} from "@/src/lib/structuredData";

// Dynamic because the page reads the per-request CSP nonce from headers().
export const dynamic = "force-dynamic";

const ShareButtons = dynamicImport(
  () => import("@/src/components/ui/ShareButtons"),
  { loading: () => null }
);
const ReadingProgress = dynamicImport(
  () => import("@/src/components/ui/reading-progress"),
  { loading: () => null }
);
const BackToTop = dynamicImport(
  () => import("@/src/components/ui/back-to-top"),
  { loading: () => null }
);

type Params = { params: Promise<{ slug: string; locale: string }> };

interface RessourcesDictionary {
  Articles: ResourceArticle[];
  ArticleUiLabels?: ArticleUiLabels;
  Categories?: ResourceCategoryLabels;
  IntroTitle?: string;
  IntroShort?: string;
  ArticlesTitle?: string;
  ArticlesShort?: string;
  ImageAltPrefix?: string;
  By?: string;
  Published?: string;
  LastUpdated?: string;
  ReadingTime?: string;
  Minutes?: string;
  References?: string;
  [key: string]: unknown;
}

const buildMarkdownComponents = (locale: Locale): Components => ({
  table({ node: _node, className, ...props }) {
    return (
      <div className="my-6 overflow-x-auto">
        <table className={["w-full", className].filter(Boolean).join(" ")} {...props} />
      </div>
    );
  },
  a({ node: _node, href, children, ...props }) {
    const normalized = href ? normalizeInternalHref(href, locale) : href;
    return (
      <a href={normalized} {...props}>
        {children}
      </a>
    );
  },
});

type ArticleUiLabels = {
  relatedServices?: string;
  contactUs?: string;
  services?: Record<string, string>;
};

function normalizeArticleUiLabels(content: string, labels?: ArticleUiLabels) {
  if (!labels) return content;
  let normalized = content
    .replace(
      /^### Related Services$/gim,
      `### ${labels.relatedServices || "Related services"}`,
    )
    .replace(
      /^## Related Services$/gim,
      `## ${labels.relatedServices || "Related services"}`,
    )
    .replace(
      /\[Contact Us\]\(\/contact\)/g,
      `[${labels.contactUs || "Contact us"}](/contact)`,
    );

  for (const [source, target] of Object.entries(labels.services || {})) {
    normalized = normalized.replace(
      new RegExp(`\\[${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`, "g"),
      `[${target}]`,
    );
  }

  return normalized;
}

function getArticleImageUrl(article: ResourceArticle, locale: Locale) {
  if (article.image) {
    const image = article.image.startsWith("/")
      ? article.image
      : `/assets/${article.image}`;
    return `https://ridger.ch${image}`;
  }
  return `https://ridger.ch/assets/og/og-${locale}.webp`;
}

function getArticleSection(
  article: ResourceArticle,
  labels?: ResourceCategoryLabels,
) {
  const category = article.category;
  if (!category) return labels?.general || fallbackCategoryLabel("general");
  return (
    labels?.[category as keyof ResourceCategoryLabels] ||
    fallbackCategoryLabel(category)
  );
}

function getArticleStructuredDataContext(
  article: ResourceArticle,
  locale: Locale,
) {
  const serviceLocaleUrl = (path: string) =>
    `https://ridger.ch/${locale}${localizePath(path, locale)}/`;

  if (article.category === "odoo") {
    return {
      schemaType: "TechArticle" as const,
      about: [
        { "@id": getArkServiceEntityId("consolidated-reporting") },
        { "@type": "Thing", name: "Consolidated reporting" },
        { "@type": "Thing", name: "Swiss family office" },
      ],
      isPartOf: {
        "@type": "WebPage",
        "@id": serviceLocaleUrl("/services/consolidated-reporting"),
      },
    };
  }

  if (
    article.category === "accounting" ||
    article.category === "tax" ||
    article.category === "payroll"
  ) {
    return {
      schemaType: "BlogPosting" as const,
      about: [{ "@id": getArkServiceEntityId("tax-administration") }],
      isPartOf: {
        "@type": "WebPage",
        "@id": serviceLocaleUrl("/services/tax-administration"),
      },
    };
  }

  if (article.category === "incorporation" || article.category === "corporate") {
    return {
      schemaType: "BlogPosting" as const,
      about: [{ "@id": getArkServiceEntityId("governance-succession") }],
      isPartOf: {
        "@type": "WebPage",
        "@id": serviceLocaleUrl("/services/governance-succession"),
      },
    };
  }

  return {
    schemaType: "BlogPosting" as const,
    about: [],
    isPartOf: undefined,
  };
}

async function loadRessources(locale: Locale): Promise<RessourcesDictionary> {
  const data = loadRessourcesData(locale) as Partial<RessourcesDictionary>;
  const { Articles, ...rest } = data;
  return {
    Articles: Array.isArray(Articles) ? Articles : [],
    ...rest,
  };
}

export default async function ArticlePage(props: Params) {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const locale: Locale = isValidLocale(params.locale) ? params.locale : "fr";
  // Load the locale-specific translations on the server
  const ressources = await loadRessources(locale);
  const tNav = await getTranslations(locale, "navbar");
  // Use getTranslations for dot-notation access (e.g. "Contact.Title")
  // so nested keys resolve correctly to the active locale.
  const tRessources = await getTranslations(locale, "ressources");

  const localArticle = getArticle(locale, params.slug);
  const frArticle = getArticle("fr", params.slug);

  // If slug doesn't exist at all in this locale, return 404
  if (locale !== "fr" && !localArticle && !frArticle) return notFound();

  const article = localArticle ?? frArticle;
  if (!article) return notFound();

  // If the locale article is just a copy of the FR version (not genuinely translated),
  // return 404 to avoid "Crawled - currently not indexed" and "Soft 404" in GSC
  if (locale !== "fr" && localArticle && frArticle && !isGenuineTranslation(locale, params.slug)) {
    return notFound();
  }

  const baseUrl = "https://ridger.ch";
  const articleUrl = `${baseUrl}/${locale}/ressources/articles/${params.slug}/`;
  const breadcrumbJsonLd = buildBreadcrumbList([
    {
      name: (tNav("Home") as string) || "Home",
      item: `${baseUrl}/${locale}/`,
    },
    {
      name: ressources.IntroTitle || "Resources",
      item: `${baseUrl}/${locale}/ressources/`,
    },
    {
      name: ressources.ArticlesTitle || "Articles",
      item: `${baseUrl}/${locale}/ressources/articles/`,
    },
    {
      name: article.title,
      item: articleUrl,
    },
  ]);
  const imageUrl = getArticleImageUrl(article, locale);
  const fullContent = normalizeArticleUiLabels(
    article.content ?? "",
    ressources.ArticleUiLabels,
  );
  const reading = estimateReadingTime(fullContent);

  // Split content roughly at the midpoint (at a heading boundary) so we can
  // inject a contextual CTA in the middle of the article.
  let articleFirstHalf = fullContent;
  let articleSecondHalf: string | null = null;
  {
    const lines = fullContent.split("\n");
    const targetIdx = Math.floor(lines.length / 2);
    // Walk backwards from the midpoint to find a heading (## or ###)
    let splitIdx = -1;
    for (let i = targetIdx; i >= Math.floor(lines.length * 0.3); i--) {
      if (/^#{2,3}\s/.test(lines[i])) {
        splitIdx = i;
        break;
      }
    }
    // Walk forwards if we didn't find one backwards
    if (splitIdx === -1) {
      for (let i = targetIdx; i < Math.floor(lines.length * 0.7); i++) {
        if (/^#{2,3}\s/.test(lines[i])) {
          splitIdx = i;
          break;
        }
      }
    }
    if (splitIdx > 0) {
      articleFirstHalf = lines.slice(0, splitIdx).join("\n");
      articleSecondHalf = lines.slice(splitIdx).join("\n");
    }
  }

  const articleJsonLd = buildArticleSchema({
    ...getArticleStructuredDataContext(article, locale),
    headline: article.title,
    description: article.description,
    author: article.author,
    authorUrl: article.authorUrl,
    datePublished: article.date,
    dateModified: article.updated ?? article.date,
    url: articleUrl,
    locale,
    image: imageUrl,
    keywords: article.tags,
    section: getArticleSection(article, ressources.Categories),
    timeRequired: reading?.timeRequiredISO,
  });

  return (
    <main className="max-w-3xl mx-auto px-5 py-12 mt-8 sm:px-8">
      <Defer rootMargin="300px" idle={200}>
        <ReadingProgress targetSelector="#article-content" />
      </Defer>
      <Defer rootMargin="300px" idle={200}>
        <BackToTop />
      </Defer>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Breadcrumbs
        className="mb-6"
        baseLabel={ressources.IntroShort || "Resources"}
        rootLabel={(tNav("Home") as string) || "Home"}
        segments={[
          {
            segment: "ressources",
            label: ressources.IntroShort || "Resources",
          },
          {
            segment: "articles",
            label: ressources.ArticlesShort || "Articles",
          },
          { segment: params.slug, label: article.title },
        ]}
        maxLabelChars={56}
        hideRootWhenDuplicate={false}
      />
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
        {article.title}
      </h1>
      {/* Feature image intentionally not displayed to keep layout compact */}
      <p className="text-lg mb-8 text-center">{article.description}</p>

      <div className="text-center text-sm mb-6 space-y-1">
        <p>
          {ressources.By} {article.author}
        </p>
        <p>
          {ressources.Published} {formatDateDeterministic(article.date, locale)}
        </p>
        {article.updated && (
          <p>
            {ressources.LastUpdated}:{" "}
            {formatDateDeterministic(article.updated, locale)}
          </p>
        )}
        {reading && (
          <p>
            {ressources.ReadingTime}: {reading.minutes}
            {ressources.Minutes} ({reading.words} words)
          </p>
        )}
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 pt-3">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-warm px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center mb-10 min-h-[40px]">
        <Defer
          rootMargin="200px"
          idle={250}
          placeholder={<div className="h-[36px] w-64 rounded-md bg-muted/40" />}
        >
          <ShareButtons
            url={articleUrl}
            title={article.title}
            labels={{
              shareArticle: tRessources("Share.Article") as string,
              shareLinkedIn: tRessources("Share.LinkedIn") as string,
              shareX: tRessources("Share.X") as string,
              shareWhatsApp: tRessources("Share.WhatsApp") as string,
              shareEmail: tRessources("Share.Email") as string,
              copyLink: tRessources("Share.CopyLink") as string,
              copied: tRessources("Share.Copied") as string,
            }}
          />
        </Defer>
      </div>

      <article
        id="article-content"
        className="prose prose-lg dark:prose-invert max-w-none"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={buildMarkdownComponents(locale)}
        >
          {articleFirstHalf}
        </ReactMarkdown>

        {/* Mid-article contextual CTA — lead magnet touchpoint.
            Category-specific copy + a link to the matching service page;
            falls back to the generic contact/quote pair. */}
        {articleSecondHalf &&
          (() => {
            const ctaCategory = article.category || "";
            const servicePath = getCategoryServicePath(ctaCategory);
            const catKey = (field: string) =>
              `ContextualCTA.Categories.${ctaCategory}.${field}`;
            const catText = (field: string): string | null => {
              const key = catKey(field);
              const value = tRessources(key) as string;
              return value && value !== key ? value : null;
            };
            const categoryTitle = servicePath ? catText("Title") : null;
            const serviceCtaLabel = servicePath ? catText("ServiceCTA") : null;
            return (
              <ArticleContextualCTA
                locale={locale}
                title={
                  categoryTitle ||
                  (tRessources("ContextualCTA.Title") as string) ||
                  "Need help with this topic?"
                }
                description={
                  (tRessources("ContextualCTA.Description") as string) ||
                  "Our experts are available for personalised guidance. First consultation free, no commitment."
                }
                primaryText={
                  (tRessources("ContextualCTA.PrimaryCTA") as string) ||
                  "Contact us"
                }
                secondaryText={
                  (servicePath && serviceCtaLabel) ||
                  (tRessources("ContextualCTA.SecondaryCTA") as string) ||
                  "Instant quote"
                }
                secondaryHref={
                  servicePath && serviceCtaLabel
                    ? buildInternalUrl(servicePath, locale)
                    : undefined
                }
              />
            );
          })()}

        {articleSecondHalf && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={buildMarkdownComponents(locale)}
          >
            {articleSecondHalf}
          </ReactMarkdown>
        )}
      </article>

      {/* Sources list from the references array. Roughly half the corpus
          embeds a "### Références" section inside the markdown content —
          only render the array when the content doesn't, to avoid a
          duplicate list. Visible, linked citations also help AI engines
          assess the article's sourcing. */}
      {(() => {
        const refs = (article.references || []).filter(
          (r, i, arr) =>
            r?.url &&
            r?.labelKey &&
            arr.findIndex((o) => o.url === r.url) === i,
        );
        const contentHasRefs =
          /^#{2,3}\s+(Références|References|Referenzen|Referencias|Referências)\b/im.test(
            fullContent,
          );
        if (!refs.length || contentHasRefs) return null;
        return (
          <section className="mt-10 prose prose-lg dark:prose-invert max-w-none">
            <h3>{(tRessources("References") as string) || "Références"}</h3>
            <ul>
              {refs.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    {r.labelKey}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <RelatedArticles currentSlug={params.slug} locale={locale} />

      {/* Use tRessources (getTranslations) for dot-notation key resolution
          so the Contact section is always rendered in the active locale.
          Raw object access like ressources["Contact.Title"] returns undefined
          (falling back to English) because the JSON uses nested objects,
          not flat dotted keys. */}
      <ContactSection
        locale={locale}
        eyebrow={
          (tRessources("Contact.Eyebrow") as string) || "Let's talk"
        }
        title={
          (tRessources("Contact.Title") as string) ||
          "Questions about this article?"
        }
        description={
          (tRessources("Contact.Description") as string) ||
          "Our experts are here to help you understand the details and implications for your business. Get personalized advice tailored to your situation."
        }
        buttonText={
          (tRessources("Contact.ButtonText") as string) || "Contact Our Team"
        }
        secondaryButtonText={
          (tRessources("Contact.SecondaryButtonText") as string) ||
          "Get an instant quote"
        }
      />
    </main>
  );
}

export async function generateMetadata(props: Params) {
  const params = await props.params;
  const locale: Locale = isValidLocale(params.locale) ? params.locale : "fr";
  const article = getArticle(locale, params.slug) ?? getArticle("fr", params.slug);
  // If article not found, the page component returns notFound() so no metadata needed
  if (!article) return {};

  const validLocales = getValidLocalesForSlug(params.slug);

  const reading = article.content ? estimateReadingTime(article.content) : null;
  const meta = await generateMetadataForArticle(
    locale,
    article.slug,
    article.title,
    article.description,
    validLocales
  );
  const robotsConfig: Record<string, unknown> =
    meta && typeof meta.robots === "object" && meta.robots !== null
      ? (meta.robots as Record<string, unknown>)
      : {};
  // PLACEHOLDER_LOCALES (e.g. "de,es,pt") force-noindexes staged locales even
  // if their article content would otherwise pass the genuine-translation check.
  const placeholderLocales = (process.env.PLACEHOLDER_LOCALES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const shouldIndex =
    !placeholderLocales.includes(locale) &&
    (locale === "fr" || isGenuineTranslation(locale, params.slug));
  return {
    ...meta,
    robots: {
      ...(robotsConfig as Record<string, unknown>),
      index: shouldIndex,
      follow: shouldIndex,
    },
    other: {
      ...(meta.other || {}),
      estimatedReadingTime: reading ? reading.timeRequiredISO : undefined,
    },
  };
}

function formatDateDeterministic(date?: string, locale: string = "en") {
  if (!date) return "";
  try {
    // Normalize locale (fallback chain)
    const loc = locale || "en";
    return new Intl.DateTimeFormat(loc, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch (e) {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(date));
    } catch {
      return new Date(date).toISOString().split("T")[0];
    }
  }
}
