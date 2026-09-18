// Server component: no client hooks, translations provided by server
import { Button } from "@/src/components/ui/button";
import Link from "next/link";
// import { useTranslation } from "react-i18next";
// import "@/src/i18n";
import { splitTitle } from "@/src/lib/typography";
import Reveal from "@/src/components/motion/reveal";

interface HeroFact {
  label: string;
  value: string;
  sub: string;
}

interface HeroProps {
  locale?: string;
  heroIndex?: number; // kept for caller compatibility
  translations?: Record<string, string>; // server-provided translations to avoid hydration mismatch
  facts?: HeroFact[];
}

const Hero = ({ locale, heroIndex, translations, facts }: HeroProps) => {
  const currentLocale = (locale || "fr") as string;
  // const { t } = useTranslation("home");
  const t = (key: string) => translations?.[key] || key; // fallback to key if translation missing
  const localePrefix = currentLocale ? `/${currentLocale}` : "/fr";

  const rawTitle = t("Hero.Title") as string;
  const { title, subtitle } = splitTitle(rawTitle);

  return (
    <section className="relative w-full bg-background px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-16 lg:pt-20">
      <div className="mx-auto w-full max-w-[1240px]">
        <Reveal className="max-w-5xl" from="bottom">
          <h1 className="max-w-[14ch] text-balance text-5xl font-semibold leading-[0.98] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl">
            {title}
            {subtitle ? (
              <>
                <br />
                <span className="text-brand-hover dark:text-brand">
                  {subtitle}
                </span>
              </>
            ) : null}
          </h1>

          <p className="mt-8 max-w-[56ch] text-lg leading-8 text-muted-foreground sm:text-xl">
            {t("Hero.Description")}
          </p>

          <div className="mt-10 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={`${localePrefix}/agent/`}
              className="w-full sm:w-auto"
              locale={locale}
              prefetch={false}
            >
              <Button
                size="lg"
                className="btn-main-cta w-full rounded-full bg-foreground px-6 text-base text-background transition-colors hover:text-white sm:w-auto"
              >
                <span>{t("Hero.SecondaryCTA")}</span>
              </Button>
            </Link>
            <Link
              href={`${localePrefix}/contact/`}
              className="w-full sm:w-auto"
              locale={locale}
            >
              <Button
                size="lg"
                variant="secondary"
                className="btn-secondary-cta w-full rounded-full px-6 text-base sm:w-auto"
              >
                <span>{t("Hero.CTA")}</span>
              </Button>
            </Link>
          </div>

          {facts && facts.length > 0 && (
            <div className="mt-16 border-t border-border/50 pt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                    {fact.label}
                  </p>
                  <p className="text-[28px] font-semibold leading-none tracking-[-0.025em] text-foreground sm:text-[32px]">
                    {fact.value}
                  </p>
                  <p className="text-[13.5px] leading-[1.55] text-muted-foreground">
                    {fact.sub}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
};
export default Hero;
