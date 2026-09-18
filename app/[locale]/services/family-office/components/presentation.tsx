// "use client";
import React from "react";
import ServiceExpertBanner from "@/src/components/ui/service-expert-banner";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
import ServiceLongForm from "@/src/components/ui/service-longform";
import { CtaBanner } from "@/src/components/ui/surface";
import {
  Bank,
  Briefcase,
  Globe,
  HandCoins,
  Heart,
  Books,
  ShieldCheck,
  Users,
  Gavel,
} from "@phosphor-icons/react/dist/ssr";
const serviceIcons = [Briefcase, HandCoins, Users, Books, Heart];
const highlightIcons = [ShieldCheck, HandCoins, Gavel, Globe];
const FamilyOfficePresentation = ({
  locale,
  t,
}: {
  locale: string;
  t: (key: string) => any;
}) => {
  // const params = useParams<{ locale?: string }>();
  const localePrefix = locale ? `/${locale}` : "/fr";
  return (
    <section data-service-content className="w-full px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-[1240px] space-y-16">
        <header className="space-y-6 text-left">
          <h2 className="mb-6 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {t("Presentation.Title")}
          </h2>
          <h2 className="text-xl xs:text-2xl md:text-2xl font-semibold md:leading-[2rem] tracking-tight text-muted-foreground">
            {t("Presentation.Subtitle")}
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            {t("Presentation.Intro").map((text: string, index: number) => (
              <p key={index} className="text-muted-foreground">
                {text}
              </p>
            ))}
          </div>
        </header>
        <section className="space-y-6">
          <h3 className="text-xl xs:text-2xl md:text-2xl font-bold tracking-tight">
            {t("Presentation.HighlightsTitle")}
          </h3>
          <div className="space-y-5">
            {t("Presentation.Highlights").map((item: any, index: number) => {
              const Icon = highlightIcons[index] ?? Bank;
              return (
                <div
                  key={`${item.Title}-${index}`}
                  className="flex items-center gap-5 px-6 py-5 rounded-lg bg-primary/5"
                >
                  <span className="ui-icon inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0">
                    <Icon />
                  </span>
                  <div>
                    <span className="font-semibold block text-lg mb-2">
                      {item.Title}
                    </span>
                    <span className="text-base leading-relaxed text-muted-foreground">
                      {item.Desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="space-y-6">
          <h3 className="text-xl xs:text-2xl md:text-2xl font-bold tracking-tight">
            {t("Presentation.ServicesTitle")}
          </h3>
          <div className="space-y-4">
            {t("Presentation.Services").map((text: string, index: number) => {
              const [title, ...descParts] = text.split(":");
              const desc = descParts.join(":").trim();
              const Icon = serviceIcons[index % serviceIcons.length];
              return (
                <div
                  key={index}
                  className="flex items-center gap-6 rounded-xl bg-card px-6 py-6 shadow-sm transition-colors hover:bg-surface-warm dark:bg-muted/50"
                >
                  <span className="ui-icon inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground ring-1 ring-primary/20 dark:bg-primary/10 dark:text-primary shrink-0">
                    <Icon />
                  </span>
                  <div>
                    <span className="font-semibold text-lg text-foreground block mb-2">
                      {title}
                    </span>
                    {desc && (
                      <span className="text-lg text-muted-foreground">
                        {desc}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <ServiceLongForm t={t} locale={locale} />
        <CtaBanner
          variant="warm"
          title={t("Presentation.CalloutTitle")}
          description={t("Presentation.CalloutText")}
          primary={{
            href: `${localePrefix}/contact/`,
            label: t("Presentation.CalloutCTA"),
          }}
        />
        <div className="flex justify-center">
          <GoogleReviewsBadge locale={locale} />
        </div>
        <ServiceExpertBanner locale={locale} />
      </div>
    </section>
  );
};
export default FamilyOfficePresentation;
