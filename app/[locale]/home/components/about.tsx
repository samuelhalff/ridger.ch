import { getCurrentLocale, getTranslations, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import ContextualLinksServer from "@/src/components/ui/contextual-links-server";
import SectionHeading from "@/src/components/site/section-heading";
import StructuredCopy from "@/src/components/site/structured-copy";
import Reveal from "@/src/components/motion/reveal";

export default async function About() {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "home");

  const content = (t("About.Content") as unknown) as string[];

  return (
    <section className="mx-auto flex w-full flex-col items-center bg-background px-5 py-14 sm:px-8 xs:py-20">
      <div className="w-full max-w-[1240px]">
        <Reveal className="mb-10 max-w-3xl">
          <SectionHeading
            eyebrow={(t("About.Eyebrow") as string) || (t("About.Title") as string)}
            title={tidyTitle(t("About.Title") as string)}
            align="left"
          />
        </Reveal>

        <div className="w-full space-y-10 text-left">
          <Reveal>
            <StructuredCopy paragraphs={content} locale={locale} />
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            <Reveal className="space-y-4 rounded-2xl bg-surface-warm p-6 text-center shadow-sm sm:p-7">
              <h3 className="text-2xl font-semibold leading-tight tracking-tight">
                {tidyTitle(t("About.Quality.Title") as string)}
              </h3>
              <div className="mx-auto max-w-[38rem] text-sm leading-7 text-muted-foreground sm:text-base">
                <ContextualLinksServer locale={locale}>
                  {(t("About.Quality.Content") as unknown) as string}
                </ContextualLinksServer>
              </div>
            </Reveal>

            <Reveal
              className="space-y-4 rounded-2xl bg-surface-warm p-6 text-center shadow-sm sm:p-7"
              delay={0.08}
            >
              <h3 className="text-2xl font-semibold leading-tight tracking-tight">
                {tidyTitle(t("About.Innovation.Title") as string)}
              </h3>
              <div className="mx-auto max-w-[38rem] text-sm leading-7 text-muted-foreground sm:text-base">
                <ContextualLinksServer locale={locale}>
                  {(t("About.Innovation.Content") as unknown) as string}
                </ContextualLinksServer>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
