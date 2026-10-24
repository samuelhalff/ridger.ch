import { getTranslations, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";

type Case = { Situation?: string; WhatWeDo?: string };

// A missing key echoes back the key itself, so treat that as absent.
const text = (value: unknown, key: string): string =>
  typeof value === "string" && value && value !== key ? value : "";

/**
 * Generic "typical situations" for a service page: what families commonly ask
 * us to coordinate, described in general terms (no client, no outcome, no
 * figure). Reads `TypicalSituations.Cases` from the service namespace and the
 * shared labels from `services:TypicalSituations`. Renders nothing when the
 * block is absent in the active locale.
 */
const ServiceTypicalSituations = async ({
  locale,
  ns,
}: {
  locale: string;
  ns: string;
}) => {
  const activeLocale = (locale as Locale) || ("fr" as Locale);
  const tService = await getTranslations(activeLocale, ns);
  const rawCases = tService("TypicalSituations.Cases") as unknown;
  const cases = (Array.isArray(rawCases) ? (rawCases as Case[]) : []).filter(
    (c) => c && c.Situation && c.WhatWeDo,
  );
  if (cases.length === 0) return null;

  const tShared = await getTranslations(activeLocale, "services");
  const title = text(tShared("TypicalSituations.Title"), "TypicalSituations.Title");
  if (!title) return null;
  const disclaimer = text(
    tShared("TypicalSituations.Disclaimer"),
    "TypicalSituations.Disclaimer",
  );
  const situationLabel = text(
    tShared("TypicalSituations.SituationLabel"),
    "TypicalSituations.SituationLabel",
  );
  const whatWeDoLabel = text(
    tShared("TypicalSituations.WhatWeDoLabel"),
    "TypicalSituations.WhatWeDoLabel",
  );

  return (
    <section className="mt-14 max-w-4xl space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">
        {tidyTitle(title)}
      </h2>
      {disclaimer ? (
        <p className="text-sm italic leading-7 text-muted-foreground">
          {disclaimer}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((item, index) => (
          <div
            key={index}
            className="space-y-3 rounded-2xl bg-surface-warm p-6 text-sm leading-7 shadow-sm"
          >
            <p>
              {situationLabel ? (
                <span className="block font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-hover">
                  {situationLabel}
                </span>
              ) : null}
              <span className="text-foreground">{item.Situation}</span>
            </p>
            <p>
              {whatWeDoLabel ? (
                <span className="block font-mono text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-brand-hover">
                  {whatWeDoLabel}
                </span>
              ) : null}
              <span className="text-muted-foreground">{item.WhatWeDo}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceTypicalSituations;
