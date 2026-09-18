import services from "@/app/[locale]/home/components/services-items";
import Link from "next/link";
import { buildInternalUrl } from "@/src/lib/paths";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import SectionHeading from "@/src/components/site/section-heading";
import Reveal from "@/src/components/motion/reveal";
import { ArrowUpRight as ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";

interface ServicesProps {
  showSubtitle?: boolean;
  showHeading?: boolean; // controls rendering of the internal heading block
  locale?: string;
}

const Services = async ({
  showSubtitle = false,
  showHeading = true,
  locale,
}: ServicesProps) => {
  const currentLocale = (locale || "fr") as Locale;
  const tHome = await getTranslations(currentLocale, "home");
  const tItems = await getTranslations(currentLocale, "servicesItems");
  return (
    <section id="services" className="w-full px-5 py-16 sm:px-8 lg:py-20">
      <div className="mx-auto w-full max-w-[1240px]">
        {showHeading && (
          <Reveal className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.7fr)] md:items-end">
            <SectionHeading
              eyebrow={(tHome("Services.Eyebrow") as string) || (tHome("Services.Title") as string)}
              title={
                currentLocale === "fr"
                  ? "Tout ce dont une entreprise a besoin — sous un seul toit."
                  : tidyTitle(tHome("Services.Title") as string)
              }
              align="left"
              titleClassName="max-w-[18ch] text-4xl sm:text-5xl lg:text-[3.25rem]"
            />
            {showSubtitle ? (
              <p className="max-w-[42ch] text-sm leading-7 text-muted-foreground sm:text-base">
                {tHome("Services.Subtitle")}
              </p>
            ) : null}
          </Reveal>
        )}
        <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 md:grid-cols-4 lg:grid-cols-6 lg:auto-rows-[minmax(180px,auto)]">
          {services.map((service, index) => {
            const headingId = `service-card-${service.titleKey.replace(
              /\./g,
              "-",
            )}`;
            const serviceHref = buildInternalUrl(service.href, currentLocale);
            const isHero = index === 0;
            const isHighlighted =
              service.titleKey === "OdooImplementation.Title";
            const spanClass = isHero
              ? "sm:col-span-2 md:col-span-4 lg:col-span-3 lg:row-span-2"
              : isHighlighted
                ? "sm:col-span-2 md:col-span-4 lg:col-span-3"
                : "sm:col-span-1 md:col-span-2 lg:col-span-2";
            const surfaceClass = isHero
              ? "bg-[#1f1b19] text-white dark:bg-surface-warm dark:text-foreground"
              : isHighlighted
                ? "bg-brand-soft"
                : "bg-surface-warm";
            const hoverClass = isHero
              ? "hover:bg-[#2a211d] dark:hover:bg-card"
              : isHighlighted
                ? "hover:bg-brand-soft/80 dark:hover:bg-brand-soft"
                : "hover:bg-card dark:hover:bg-surface-warm";
            const description = tItems(service.descriptionKey) as string;
            return (
              <Reveal
                key={service.titleKey}
                className={`group relative h-full ${spanClass}`}
                delay={Math.min(index * 0.05, 0.24)}
              >
                <Link
                  href={serviceHref}
                  prefetch={false}
                  locale={locale}
                  data-service-card
                  className={`relative flex h-full min-h-[220px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl p-5 text-left shadow-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:p-6 ${surfaceClass} ${hoverClass}`}
                  aria-labelledby={headingId}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span
                      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm transition-colors duration-200 ${
                        isHero
                          ? "bg-white/12 text-white group-hover:bg-brand dark:bg-background/75 dark:text-brand-hover dark:group-hover:bg-brand dark:group-hover:text-white"
                          : "bg-background/80 text-brand-hover group-hover:bg-brand group-hover:text-white dark:bg-background/10 dark:text-brand dark:group-hover:bg-brand dark:group-hover:text-white"
                      }`}
                      aria-hidden="true"
                    >
                      {service.icon}
                    </span>
                    <span
                      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full shadow-sm transition-colors ${
                        isHero
                          ? "bg-white/12 text-white group-hover:bg-brand dark:bg-background/75 dark:text-foreground dark:group-hover:bg-brand dark:group-hover:text-white"
                          : "bg-background text-foreground group-hover:bg-foreground group-hover:text-background dark:bg-background/10 dark:text-foreground dark:group-hover:bg-background dark:group-hover:text-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </span>
                  </span>
                  <div className="mt-8 sm:mt-10">
                    <h3
                      id={headingId}
                      className={`text-balance font-semibold leading-[1.08] tracking-tight ${
                        isHero
                          ? "max-w-[16ch] text-3xl sm:text-4xl"
                          : "text-xl sm:text-2xl"
                      }`}
                    >
                      {tItems(service.titleKey)}
                    </h3>
                    <p
                      className={`mt-4 line-clamp-3 max-w-[42ch] text-sm leading-6 transition-colors duration-200 ${
                        isHero
                          ? "text-white/75 dark:text-foreground/80"
                          : "text-foreground/80"
                      }`}
                    >
                      {description}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;
