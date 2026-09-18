import { Button } from "@/src/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { tidyTitle, splitTitle } from "@/src/lib/typography";

interface ServiceHeroProps {
  namespace: string;
  imageSrc: string;
  imageAlt: string;
  badge1Key: string;
  badge1Fallback: string;
  badge2Key: string;
  badge2Fallback: string;
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  ctaKey: string;
  ctaFallback: string;
  locale?: string;
}

const ServiceHero = async ({
  namespace,
  imageSrc,
  imageAlt,
  titleKey,
  titleFallback,
  descriptionKey,
  descriptionFallback,
  ctaKey,
  ctaFallback,
  locale,
}: ServiceHeroProps) => {
  const currentLocale = (locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(currentLocale, namespace);
  const tServices = await getTranslations(currentLocale, "services");
  const localePrefix = locale ? `/${locale}` : "/fr";
  const instantQuoteKey = "ExpertBanner.SecondaryCTA";
  const instantQuoteRaw = tServices(instantQuoteKey) as string;
  const instantQuote =
    instantQuoteRaw === instantQuoteKey ? "Get an instant quote" : instantQuoteRaw;

  return (
    <section className="relative w-full bg-background px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
      <link
        rel="preload"
        as="image"
        href={imageSrc || "/assets/hero/services/home-hero.avif"}
      />
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.8fr)] lg:items-center">
        <div className="min-w-0 max-w-3xl">
          {(() => {
            const raw = (t(titleKey) as string) || titleFallback;
            const { title, subtitle } = splitTitle(raw);
            return (
              <>
                <h1 className="mt-7 max-w-[14ch] text-balance text-5xl font-bold leading-[0.98] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                  {tidyTitle(title)}
                </h1>
                {subtitle ? (
                  <p className="mt-4 max-w-[36ch] text-xl font-semibold leading-8 text-muted-foreground sm:text-2xl">
                    {tidyTitle(subtitle)}
                  </p>
                ) : null}
              </>
            );
          })()}
          <p className="mt-7 max-w-[58ch] text-base leading-8 text-muted-foreground sm:text-lg">
            {t(descriptionKey) || descriptionFallback}
          </p>
          <div className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={`${localePrefix}/contact/`}
              className="w-full sm:w-auto"
              locale={locale}
              prefetch={false}
            >
              <Button
                size="lg"
                className="btn-main-cta w-full rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white sm:w-auto"
                style={{ cursor: "pointer" }}
              >
                <span>{t(ctaKey) || ctaFallback}</span>
              </Button>
            </Link>
            <Link
              href={`${localePrefix}/agent/`}
              className="w-full sm:w-auto"
              locale={locale}
              prefetch={false}
            >
              <Button
                size="lg"
                variant="secondary"
                className="btn-secondary-cta w-full rounded-full px-6 text-base sm:w-auto"
                style={{ cursor: "pointer" }}
              >
                <span>{instantQuote}</span>
              </Button>
            </Link>
          </div>
          {/* Inline Odoo partner branding for accounting only (reverted position) */}
          {namespace === "accounting" && (
            <div className="mt-8">
              <a
                href="https://www.odoo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full bg-surface-warm px-4 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                <Image
                  src="/assets/partners/odoo-logo.svg"
                  className="h-6 w-auto"
                  alt="Odoo Logo"
                  width={96}
                  height={32}
                  sizes="96px"
                  loading="lazy"
                  decoding="async"
                />
                <span>{t("Hero.OdooPartnerBadge") || "Official Odoo Partner"}</span>
              </a>
            </div>
          )}
        </div>
        <div className="relative min-h-[320px] w-full overflow-hidden rounded-[28px] bg-muted/30 shadow-sm sm:min-h-[420px] lg:min-h-[520px]">
          {(() => {
            const key = "ImageAlt";
            const translated = t(key) as string;
            const altText = translated === key ? imageAlt : translated;
            // If the target image is missing (assets being refreshed), fall back to a bundled abstract background
            const fallback = "/assets/hero/services/home-hero.avif";
            const src = imageSrc || fallback;
            return (
              <Image
                src={src}
                alt={altText}
                className="object-cover"
                sizes="(min-width:1024px) 520px, 90vw"
                priority
                fetchPriority="high"
                quality={60}
                fill
              />
            );
          })()}
        </div>
      </div>
    </section>
  );
};

export default ServiceHero;
