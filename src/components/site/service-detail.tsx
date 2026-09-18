import Link from "next/link";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import { tidyTitle, splitTitle } from "@/src/lib/typography";
import StructuredData from "@/src/components/seo/StructuredData";
import { arkEntityIds } from "@/src/lib/structuredData";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

type Pillar = { Title?: string; Body?: string };

interface ServiceDetailProps {
  /** Translation namespace = json filename (e.g. "consolidated-reporting"). */
  namespace: string;
  /** Canonical (English) base path, e.g. "/services/consolidated-reporting". */
  basePath: string;
  /** Entity @id for the Service node in the org graph. */
  serviceEntityId: string;
  imageSrc: string;
  locale: string;
  nonce?: string;
}

const ServiceDetail = async ({
  namespace,
  basePath,
  serviceEntityId,
  imageSrc,
  locale,
  nonce,
}: ServiceDetailProps) => {
  const currentLocale = (locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(currentLocale, namespace);
  const tNav = await getTranslations(currentLocale, "navbar");
  const localePrefix = `/${currentLocale}`;
  const baseUrl = "https://ridger.ch";
  const canonicalUrl = `${baseUrl}/${currentLocale}${localizePath(
    basePath,
    currentLocale,
  )}/`;

  const rawTitle = (t("Hero.Title") as string) || "";
  const { title, subtitle } = splitTitle(rawTitle);
  const heroDescription = (t("Hero.Description") as string) || "";
  const cta = (t("Hero.CTA") as string) || (currentLocale === "fr" ? "Demander un entretien confidentiel" : "Request a confidential consultation");

  const intro = Array.isArray(t("Intro") as unknown)
    ? (t("Intro") as unknown as string[])
    : [];
  const pillars = Array.isArray(t("Pillars") as unknown)
    ? (t("Pillars") as unknown as Pillar[])
    : [];
  const perimeter = (t("Perimeter") as string) || "";
  const closingTitle = (t("Closing.Title") as string) || "";
  const closingBody = (t("Closing.Body") as string) || "";

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": serviceEntityId,
    name: title || rawTitle,
    description: heroDescription,
    provider: { "@id": arkEntityIds.organization },
    areaServed: [
      { "@id": arkEntityIds.areaGeneva },
      { "@type": "Country", name: "Switzerland" },
    ],
    url: canonicalUrl,
  } as const;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: (tNav("Services") as string) || "Services",
        item: `${baseUrl}${localePrefix}/services/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title || rawTitle,
        item: canonicalUrl,
      },
    ],
  } as const;

  return (
    <div>
      <StructuredData nonce={nonce} data={[breadcrumbJsonLd, serviceJsonLd]} />

      <section className="relative w-full bg-background px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.8fr)] lg:items-center">
          <div className="min-w-0 max-w-3xl">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-1 text-sm text-muted-foreground">
                <li>
                  <Link href={`${localePrefix}/`} className="hover:underline">
                    {(tNav("Home") as string) || "Home"}
                  </Link>
                </li>
                <li className="flex items-center gap-1">
                  <span className="text-muted-foreground/60">/</span>
                  <Link
                    href={`${localePrefix}/services/`}
                    className="hover:underline"
                  >
                    {(tNav("Services") as string) || "Services"}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="max-w-[16ch] text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
              {tidyTitle(title || rawTitle)}
            </h1>
            {subtitle ? (
              <p className="mt-4 max-w-[40ch] text-xl font-medium leading-8 text-muted-foreground sm:text-2xl">
                {tidyTitle(subtitle)}
              </p>
            ) : null}
            <p className="mt-7 max-w-[58ch] text-base leading-8 text-muted-foreground sm:text-lg">
              {heroDescription}
            </p>
            <div className="mt-10">
              <Link
                href={`${localePrefix}/contact/`}
                locale={locale}
                prefetch={false}
              >
                <Button
                  size="lg"
                  className="btn-main-cta rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white"
                >
                  <span>{cta}</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative min-h-[320px] w-full overflow-hidden rounded-[28px] bg-muted/30 shadow-sm sm:min-h-[420px] lg:min-h-[520px]">
            <Image
              src={imageSrc}
              alt=""
              className="object-cover"
              sizes="(min-width:1024px) 520px, 90vw"
              priority
              fetchPriority="high"
              quality={60}
              fill
            />
          </div>
        </div>
      </section>

      <section className="w-full px-5 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto w-full max-w-[1240px]">
          {intro.length > 0 ? (
            <div className="mb-14 max-w-3xl space-y-6">
              {intro.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-base leading-8 text-muted-foreground sm:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}

          {pillars.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {pillars.map((pillar, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 rounded-2xl bg-surface-warm p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle
                      className="size-5 shrink-0 text-brand"
                      weight="fill"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {pillar.Title}
                    </h2>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {pillar.Body}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {closingTitle || closingBody ? (
            <div className="mt-14 max-w-3xl space-y-4">
              {closingTitle ? (
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {tidyTitle(closingTitle)}
                </h2>
              ) : null}
              {closingBody ? (
                <p className="text-base leading-8 text-muted-foreground sm:text-lg">
                  {closingBody}
                </p>
              ) : null}
            </div>
          ) : null}

          {perimeter ? (
            <p className="mt-14 max-w-3xl border-t border-border/50 pt-8 text-sm leading-7 text-muted-foreground/80">
              {perimeter}
            </p>
          ) : null}

          <div className="mt-12">
            <Link
              href={`${localePrefix}/contact/`}
              locale={locale}
              prefetch={false}
            >
              <Button
                size="lg"
                className="btn-main-cta rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white"
              >
                <span>{cta}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetail;
