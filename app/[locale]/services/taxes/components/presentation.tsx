import { CheckCircle as Check } from "@phosphor-icons/react/dist/ssr";
import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ServiceLongForm from "@/src/components/ui/service-longform";
import ServiceExpertBanner from "@/src/components/ui/service-expert-banner";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
import CaseStudiesSection from "@/src/components/site/case-studies-section";
import { getTaxCaseStudies } from "../caseStudies";
import { getInternationalTaxFaq } from "../internationalTaxFaq";
const ServicesListServer = dynamic(
  () => import("@/src/components/ui/services-list-server"),
);
const Presentation = async () => {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "taxes");
  const title = (t("Presentation.Title") as string) || "Taxes";
  const subtitle = (t("Presentation.Subtitle") as string) || "Expertise and compliance";
  const intro = (t("Presentation.Intro") as unknown as string[]) || [
    "Welcome to our tax services",
  ];
  const strengths = (t("Presentation.Strengths") as unknown as Array<{ Title: string; Desc: string }>) || [
    { Title: "Comprehensive expertise", Desc: "Our team covers all areas of Swiss taxation." },
    { Title: "Personalized advice", Desc: "We analyze your situation to offer tailored solutions." },
    { Title: "Compliance and security", Desc: "We guarantee compliance with all legal obligations." },
  ];
  const services = (t("Presentation.Services") as unknown as string[]) || [
    "Service 1: Description",
    "Service 2: Description",
    "Service 3: Description",
    "Service 4: Description",
  ];
  const internationalTaxFaq = getInternationalTaxFaq(locale);
  const caseStudies = getTaxCaseStudies(locale);
  return (
    <section data-service-content className="w-full px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="mb-6 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {tidyTitle(title)}
        </h2>
          <h2 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
          {tidyTitle(subtitle)}
          </h2>
        <div className="text-left w-full">
          <div className="mb-12 max-w-3xl space-y-6">
            {intro.map((text, index) => (
              <p key={index} className="mb-8 text-base leading-8 text-muted-foreground sm:text-lg">{text}</p>
            ))}
          </div>
          <div className="space-y-16">
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">{tidyTitle(((t("Presentation.StrengthsTitle") as string) || "Our Strengths"))}</h3>
              <div className="space-y-4 mb-12">
                {strengths.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 px-6 py-4 rounded-lg bg-primary/5 mb-4">
                    <Check className="text-brand mt-1 min-w-[20px]" />
                    <div>
                      <span className="font-semibold block text-lg mb-2">{item.Title}</span>
                      <span className="text-base leading-relaxed">{item.Desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">{tidyTitle(((t("Presentation.ServicesTitle") as string) || "Services"))}</h3>
              <Suspense
                fallback={
                  <div className="space-y-4">
                    <div className="h-24 rounded-lg bg-muted/40" />
                    <div className="h-24 rounded-lg bg-muted/40" />
                    <div className="h-24 rounded-lg bg-muted/40" />
                  </div>
                }
              >
                <ServicesListServer
                  ns="taxes"
                  translationKey="Presentation.Services"
                  fallbackText={services}
                  className="space-y-6"
                  locale={locale}
                />
              </Suspense>
            </section>
            <ServiceLongForm t={t} locale={locale} />
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-4 md:leading-[2rem] tracking-tight">
                {tidyTitle(internationalTaxFaq.title)}
              </h3>
              <p className="mb-8 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                {internationalTaxFaq.intro}
              </p>
              <div className="space-y-4 max-w-4xl">
                {internationalTaxFaq.entries.map((entry) => (
                  <details
                    key={entry.question}
                    className="group rounded-[22px] bg-surface-warm px-5 py-4 shadow-sm transition-shadow open:shadow-md dark:bg-card"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-1 pr-2">
                      <span className="font-semibold tracking-tight text-lg leading-snug">
                        {entry.question}
                      </span>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground/10 text-muted-foreground transition-colors group-open:bg-foreground/15 group-open:text-foreground/90">
                        +
                      </span>
                    </summary>
                    <p className="mt-2 pb-2 text-[15px] leading-7 text-muted-foreground">
                      {entry.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
            <CaseStudiesSection
              title={caseStudies.title}
              intro={caseStudies.intro}
              locale={locale}
              cases={caseStudies.cases}
            />
            <div className="flex justify-center">
              <GoogleReviewsBadge locale={locale} />
            </div>
            <ServiceExpertBanner locale={locale} />
          </div>
        </div>
      </div>
    </section>
  );
};
export default Presentation;
