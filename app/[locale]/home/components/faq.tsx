import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import SectionHeading from "@/src/components/site/section-heading";
import Reveal from "@/src/components/motion/reveal";
import { Plus as PlusIcon } from "@phosphor-icons/react/dist/ssr";

const faq = Array.from({ length: 16 }).map((_, i) => ({
  questionKey: `Question${i + 1}`,
  answerKey: `Answer${i + 1}`,
}));

export default async function FAQ() {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "faq");
  const title = (t("Title") as string) || "FAQ";
  const subtitle = (t("Subtitle") as string) || "";
  const lastUpdated = new Date();

  const items = faq
    .map(({ questionKey, answerKey }) => {
      const q = t(questionKey) as string;
      const a = t(answerKey) as string;
      return { questionKey, answerKey, q, a };
    })
    .filter(({ questionKey, answerKey, q, a }) => {
      const isMissingQ = !q || q === questionKey;
      const isMissingA = !a || a === answerKey;
      return !(isMissingQ || isMissingA);
    });

  return (
    <div
      id="faq"
      className="mx-auto mb-10 w-full max-w-[1240px] px-5 py-8 sm:px-8 xs:py-16"
    >
      <Reveal className="max-w-4xl mx-auto">
        <SectionHeading
          eyebrow="FAQ"
          title={tidyTitle(title)}
          description={subtitle}
        />
      </Reveal>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        <span>{(t("LastUpdated") as string) || "dernière mise à jour"}</span>{" "}
        <span suppressHydrationWarning>
          {new Intl.DateTimeFormat(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(lastUpdated)}
        </span>
      </p>

      {/* Use CSS columns; add explicit columnGap to ensure spacing even if async CSS is delayed */}
      <div
        className="mt-8 columns-1 md:columns-2"
        style={{ columnGap: "1rem" }}
      >
        {items.map(({ q, a, questionKey }, index) => (
          <Reveal
            key={questionKey}
            className="mb-4 break-inside-avoid"
            delay={Math.min((index % 6) * 0.03, 0.15)}
          >
            <details
              className="group rounded-[22px] bg-surface-warm px-5 py-4 shadow-sm transition-shadow open:shadow-md dark:bg-card"
            >
              <summary className="faq-summary flex items-center justify-between gap-4 cursor-pointer select-none py-1 pr-2">
                <h3 className="font-semibold tracking-tight text-lg leading-snug">
                  {q}
                </h3>
                <span className="faq-icon inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground group-open:text-foreground/90 group-open:bg-foreground/15 transition-colors flex-none shrink-0">
                  <PlusIcon className="transition-transform group-open:rotate-45" />
                </span>
              </summary>
              <div className="mt-2 pb-2 text-[15px] text-left text-muted-foreground">
                {a}
              </div>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
