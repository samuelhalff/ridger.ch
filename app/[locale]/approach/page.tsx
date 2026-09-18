import { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import PageHero from "@/src/components/site/page-hero";
import Reveal from "@/src/components/motion/reveal";
import StructuredData from "@/src/components/seo/StructuredData";
import { buildBreadcrumbList } from "@/src/lib/structuredData";
import { Button } from "@/src/components/ui/button";

export const runtime = "nodejs";
export const revalidate = false;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  return await generateMetadataForPage(locale as Locale, "/approach");
}

type Section = { Title?: string; Body?: string[] };

export default async function ApproachPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = (params.locale as Locale) || ("fr" as Locale);
  const nonce = (await headers()).get("x-nonce") || undefined;
  const t = await getTranslations(locale, "approach");
  const tNav = await getTranslations(locale, "navbar");
  const localePrefix = `/${locale}`;
  const baseUrl = "https://ridger.ch";
  const canonicalUrl = `${baseUrl}/${locale}${localizePath("/approach", locale)}/`;

  const title = (t("Hero.Title") as string) || "";
  const intro = (t("Hero.Description") as string) || "";
  const sections = Array.isArray(t("Sections") as unknown)
    ? (t("Sections") as unknown as Section[])
    : [];
  const arkNote = (t("ArkNote") as string) || "";
  const cta =
    (t("CTA") as string) ||
    (locale === "fr"
      ? "Demander un entretien confidentiel"
      : "Request a confidential consultation");

  const breadcrumbJsonLd = buildBreadcrumbList([
    { name: title, item: canonicalUrl },
  ]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-8 sm:px-8 sm:py-10">
      <StructuredData nonce={nonce} data={breadcrumbJsonLd} />
      <nav aria-label="Breadcrumb" className="mb-3">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href={`${localePrefix}/`} className="hover:underline">
              {(tNav("Home") as string) || "Home"}
            </Link>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <span aria-current="page" className="font-medium text-foreground">
              {(tNav("Approach") as string) || title}
            </span>
          </li>
        </ol>
      </nav>

      <Reveal className="mb-16 sm:mb-20">
        <PageHero
          eyebrow={(tNav("Approach") as string) || title}
          title={title}
          className="pb-0 pt-8 sm:pb-0 sm:pt-10"
        />
        {intro ? (
          <p className="mt-6 max-w-[62ch] text-base leading-8 text-muted-foreground sm:text-lg">
            {intro}
          </p>
        ) : null}
      </Reveal>

      <div className="grid gap-10 sm:grid-cols-2 lg:gap-x-16">
        {sections.map((section, index) => (
          <Reveal key={index} className="space-y-4" delay={Math.min(index * 0.05, 0.2)}>
            {section.Title ? (
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {section.Title}
              </h2>
            ) : null}
            <div className="space-y-4 text-base leading-8 text-muted-foreground">
              {(Array.isArray(section.Body) ? section.Body : []).map(
                (paragraph, pIndex) => (
                  <p key={pIndex}>{paragraph}</p>
                ),
              )}
            </div>
          </Reveal>
        ))}
      </div>

      {arkNote ? (
        <p className="mt-16 max-w-3xl border-t border-border/50 pt-8 text-sm leading-7 text-muted-foreground/80">
          {arkNote}{" "}
          <a
            href="https://ark-fid.ch"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Ark Fiduciaire SA
          </a>
          .
        </p>
      ) : null}

      <div className="mt-12">
        <Link href={`${localePrefix}/contact/`} prefetch={false}>
          <Button
            size="lg"
            className="btn-main-cta rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white"
          >
            <span>{cta}</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
