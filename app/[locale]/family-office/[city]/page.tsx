import { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import StructuredData from "@/src/components/seo/StructuredData";
import { Button } from "@/src/components/ui/button";
import services from "@/app/[locale]/home/components/services-items";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { buildInternalUrl } from "@/src/lib/paths";
import { arkEntityIds } from "@/src/lib/structuredData";
import { splitTitle, tidyTitle } from "@/src/lib/typography";
import locationCities from "@/src/lib/locations.json";

export const runtime = "nodejs";
export const revalidate = false;
export const dynamicParams = false;

type Section = { Title?: string; Body?: string };

// Location landing pages: Ridger is based in Geneva and works with families
// elsewhere in Switzerland remotely and through visits — no local offices.
const cityPlace: Record<string, { name: string; region: string }> = {
  geneva: { name: "Genève", region: "Canton of Geneva" },
  lausanne: { name: "Lausanne", region: "Canton of Vaud" },
  zurich: { name: "Zürich", region: "Canton of Zurich" },
  zug: { name: "Zug", region: "Canton of Zug" },
  lugano: { name: "Lugano", region: "Canton of Ticino" },
};

export function generateStaticParams() {
  return locationCities.map((city) => ({ city }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; city: string }>;
}): Promise<Metadata> {
  const { locale, city } = await props.params;
  if (!locationCities.includes(city)) return {};
  return await generateMetadataForPage(locale as Locale, `/family-office/${city}`);
}

export default async function LocationPage(props: {
  params: Promise<{ locale: string; city: string }>;
}) {
  const { locale: rawLocale, city } = await props.params;
  if (!locationCities.includes(city)) notFound();
  const locale = (rawLocale as Locale) || ("fr" as Locale);
  const nonce = (await headers()).get("x-nonce") || undefined;
  const t = await getTranslations(locale, "locations");
  const tNav = await getTranslations(locale, "navbar");
  const tItems = await getTranslations(locale, "servicesItems");
  const baseUrl = "https://ridger.ch";
  const localePrefix = `/${locale}`;
  const pageUrl = `${baseUrl}${buildInternalUrl(`/family-office/${city}`, locale)}`;
  const c = (key: string) => t(`Cities.${city}.${key}`);

  const rawTitle = c("Hero.Title") as string;
  const { title, subtitle } = splitTitle(rawTitle);
  const description = c("Hero.Description") as string;
  const intro = Array.isArray(c("Intro")) ? (c("Intro") as unknown as string[]) : [];
  const sections = Array.isArray(c("Sections"))
    ? (c("Sections") as unknown as Section[])
    : [];
  const otherCities = locationCities.filter((other) => other !== city);
  const place = cityPlace[city];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: (tNav("Home") as string) || "Home",
          item: `${baseUrl}${localePrefix}/`,
        },
        { "@type": "ListItem", position: 2, name: title, item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: title,
      description,
      serviceType: "Multi-family office",
      url: pageUrl,
      // Provider is the Geneva office; the city is where the service is
      // delivered (remotely and through visits), not a branch location.
      provider: { "@id": arkEntityIds.organization },
      areaServed: {
        "@type": "City",
        name: place.name,
        containedInPlace: {
          "@type": "AdministrativeArea",
          name: place.region,
          containedInPlace: { "@type": "Country", name: "Switzerland" },
        },
      },
    },
  ];

  return (
    <div>
      <StructuredData nonce={nonce} data={jsonLd} />

      <section className="w-full bg-background px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <div className="mx-auto w-full max-w-[1240px]">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1 text-sm text-muted-foreground">
              <li>
                <Link href={`${localePrefix}/`} className="hover:underline">
                  {(tNav("Home") as string) || "Home"}
                </Link>
              </li>
              <li className="flex items-center gap-1">
                <span className="text-muted-foreground/60">/</span>
                <span aria-current="page" className="font-medium text-foreground">
                  {c("Name") as string}
                </span>
              </li>
            </ol>
          </nav>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#8f5f4a] dark:text-[#e1a488]">
            {t("Common.Eyebrow") as string}
          </p>
          <h1 className="mt-4 max-w-[22ch] text-balance text-5xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-6xl">
            {tidyTitle(title)}
          </h1>
          {subtitle ? (
            <p className="mt-4 max-w-[40ch] text-xl font-medium leading-8 text-muted-foreground sm:text-2xl">
              {tidyTitle(subtitle)}
            </p>
          ) : null}
          <p className="mt-7 max-w-[62ch] text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
          <p className="mt-4 max-w-[62ch] text-sm leading-7 text-muted-foreground/90">
            {t("Common.BasedInGeneva") as string}
          </p>
          <div className="mt-10">
            <Link href={`${localePrefix}/contact/`} prefetch={false}>
              <Button
                size="lg"
                className="btn-main-cta rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white"
              >
                <span>{t("Common.CTA") as string}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto w-full max-w-[1240px]">
          {intro.length > 0 ? (
            <div className="max-w-3xl space-y-6">
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
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {sections.map((section, index) => (
              <div
                key={index}
                className="rounded-2xl bg-surface-warm p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {section.Title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {section.Body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-5 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto w-full max-w-[1240px]">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {tidyTitle(t("Common.ServicesTitle") as string)}
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <li key={service.href}>
                <Link
                  href={buildInternalUrl(service.href, locale)}
                  prefetch={false}
                  className="block rounded-xl border border-border/60 p-4 transition-colors hover:bg-surface-warm"
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {tItems(service.titleKey) as string}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted-foreground">
                    {tItems(service.descriptionKey) as string}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-14 max-w-3xl space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {tidyTitle(c("Closing.Title") as string)}
            </h2>
            <p className="text-base leading-8 text-muted-foreground sm:text-lg">
              {c("Closing.Body") as string}
            </p>
          </div>

          <nav
            aria-label={t("Common.OtherLocationsTitle") as string}
            className="mt-12 border-t border-border/50 pt-8"
          >
            <p className="text-sm font-semibold text-foreground">
              {t("Common.OtherLocationsTitle") as string}
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {otherCities.map((other) => (
                <li key={other}>
                  <Link
                    href={buildInternalUrl(`/family-office/${other}`, locale)}
                    prefetch={false}
                    className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    {t(`Cities.${other}.Name`) as string}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </div>
  );
}
