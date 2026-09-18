import { tidyTitle } from "@/src/lib/typography";

export type CaseStudyCard = {
  slug: string;
  title: string;
  description: string;
  outcome: string;
};

type CaseStudiesSectionProps = {
  title: string;
  intro: string;
  locale: string;
  cases: CaseStudyCard[];
};

function getDisclaimer(locale: string) {
  if (locale === "fr") {
    return "Ces situations sont anonymisées et représentatives. Les résultats dépendent toujours du contexte, des faits et du calendrier.";
  }
  if (locale === "de") {
    return "Diese Situationen sind anonymisiert und repräsentativ. Ergebnisse hängen immer vom Kontext, den Fakten und dem Zeitplan ab.";
  }
  if (locale === "es") {
    return "Estas situaciones son anónimas y representativas. Los resultados dependen siempre del contexto, los hechos y el calendario.";
  }
  if (locale === "pt") {
    return "Estas situações são anónimas e representativas. Os resultados dependem sempre do contexto, dos factos e do calendário.";
  }
  return "These situations are anonymized and representative. Outcomes always depend on context, facts, and timing.";
}

const CaseStudiesSection = ({
  title,
  intro,
  locale,
  cases,
}: CaseStudiesSectionProps) => {
  return (
    <section>
      <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-4 md:leading-[2rem] tracking-tight">
        {tidyTitle(title)}
      </h3>
      <p className="mb-3 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
        {intro}
      </p>
      <p className="mb-8 max-w-3xl text-sm leading-7 text-muted-foreground/80">
        {getDisclaimer(locale)}
      </p>
      <div className="grid gap-6 lg:grid-cols-3">
        {cases.map((item) => (
          <article
            key={item.slug}
            className="rounded-[24px] border border-border/60 bg-surface-warm p-6 dark:bg-card"
          >
            <h4 className="text-lg font-semibold tracking-tight text-foreground">
              {item.title}
            </h4>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {item.description}
            </p>
            <p className="mt-4 text-sm leading-7 text-foreground/85">
              {item.outcome}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CaseStudiesSection;
