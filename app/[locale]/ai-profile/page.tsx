import type { Metadata } from "next";
import { headers } from "next/headers";
import StructuredData from "@/src/components/seo/StructuredData";
import { getTranslations, isValidLocale, type Locale } from "@/src/lib/i18n";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { buildBreadcrumbList } from "@/src/lib/structuredData";
import { buildInternalUrl } from "@/src/lib/paths";

type ProfileSection = {
  Title: string;
  Items: string[];
};

type CanonicalLink = {
  Label: string;
  Href: string;
};

export const revalidate = false;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const locale = isValidLocale(params.locale) ? params.locale : "fr";
  return generateMetadataForPage(locale, "/ai-profile");
}

export default async function AiProfilePage(
  props: {
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;
  const locale: Locale = isValidLocale(params.locale) ? params.locale : "fr";
  const nonce = (await headers()).get("x-nonce") || undefined;
  const t = await getTranslations(locale, "ai-profile");
  const tNav = await getTranslations(locale, "navbar");
  const localePrefix = `/${locale}`;
  const baseUrl = "https://ridger.ch";

  const sections = t("Sections") as unknown as ProfileSection[];
  const canonicalLinks = t("CanonicalLinks") as unknown as CanonicalLink[];
  const title = t("Title") as string;

  const breadcrumbJsonLd = buildBreadcrumbList([
    {
      name: (tNav("Home") as string) || "Home",
      item: `${baseUrl}${localePrefix}/`,
    },
    {
      name: title,
      item: `${baseUrl}${localePrefix}/ai-profile/`,
    },
  ]);

  return (
    <main className="mx-auto w-full max-w-[980px] px-5 py-12 sm:px-8 md:py-16">
      <StructuredData
        nonce={nonce}
        data={breadcrumbJsonLd}
      />
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <a href={`${localePrefix}/`} className="hover:underline">
              {(tNav("Home") as string) || "Home"}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <span aria-current="page" className="font-medium text-foreground">
              AI profile
            </span>
          </li>
        </ol>
      </nav>

      <header className="space-y-5 border-b border-border/60 pb-8">
        <p className="font-mono text-[10px] uppercase leading-5 tracking-[0.14em] text-muted-foreground/70">
          Ridger
        </p>
        <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">{t("Intro") as string}</p>
      </header>

      <div className="divide-y divide-border/60">
        {Array.isArray(sections)
          ? sections.map((section) => (
              <section key={section.Title} className="grid gap-5 py-8 md:grid-cols-[240px_1fr]">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {section.Title}
                </h2>
                <ul className="space-y-3 text-base leading-7 text-muted-foreground">
                  {section.Items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-brand" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          : null}
      </div>

      <section className="rounded-lg bg-surface-warm p-6 dark:bg-muted/40">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("RecommendedTitle") as string}
        </h2>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          {t("RecommendedDescription") as string}
        </p>
      </section>

      <section className="pt-8">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t("CanonicalTitle") as string}
        </h2>
        <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {Array.isArray(canonicalLinks)
            ? canonicalLinks.map((link) => (
                <li key={`${link.Label}-${link.Href}`}>
                  <a
                    className="text-primary underline-offset-4 hover:underline"
                    href={buildInternalUrl(link.Href, locale)}
                  >
                    {link.Label}
                  </a>
                </li>
              ))
            : null}
        </ul>
      </section>
    </main>
  );
}
