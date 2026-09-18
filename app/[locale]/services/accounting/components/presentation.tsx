import Defer from "@/src/components/Defer";
import AccountingAccordion from "./sections/AccountingAccordion";
import ServicesListSection from "./sections/ServicesListSection";
import ServiceLongForm from "@/src/components/ui/service-longform";
import ServiceExpertBanner from "@/src/components/ui/service-expert-banner";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
import { getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { Suspense } from "react";
import ServicesListServer from "@/src/components/ui/services-list-server";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import CaseStudiesSection from "@/src/components/site/case-studies-section";
import { getAccountingCaseStudies } from "../caseStudies";
const AccountingPresentation = async ({ t }: { t: (key: string) => string }) => {
  const locale: Locale = await getCurrentLocale();
  const caseStudies = getAccountingCaseStudies(locale);
  return (
    <section data-service-content className="w-full px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="mb-6 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {t("Presentation.Title") || "Holistic Vision of Your Accounting"}
        </h2>
        <h2 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
          {t("Presentation.Subtitle") || "A 360° Offer"}
        </h2>
        <div className="text-left w-full">
          <div className="mb-12 max-w-3xl space-y-6">
            {(Array.isArray(t("Presentation.Intro"))
              ? (t("Presentation.Intro") as unknown as string[])
              : [
                  "We provide comprehensive accounting services for businesses of all sizes. Our expert team ensures your financial records are accurate, compliant, and optimized for growth.",
                  "From basic bookkeeping to complex financial analysis, we handle all aspects of your accounting needs with precision and professionalism.",
                ]
            ).map((text, index) => (
              <p key={index} className="mb-8 text-base leading-8 text-muted-foreground sm:text-lg">
                {text}
              </p>
            ))}
          </div>
          {/* Top-level key points list */}
          <div className="mb-12">
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
                ns="accounting"
                translationKey="Presentation.List"
                fallbackText={[
                  "General accounting",
                  "Analytical accounting",
                  "Periodic tasks",
                  "Dashboards",
                  "Custom services",
                ]}
                className="space-y-6"
                locale={locale}
              />
            </Suspense>
          </div>
          <div className="space-y-16">
            {/* Detailed sections using Accordion (deferred island) */}
            <section>
              <Defer
                rootMargin="200px"
                idle={150}
                placeholder={
                  <div className="h-40 w-full rounded-lg bg-muted/40" />
                }
              >
                <AccountingAccordion />
              </Defer>
            </section>
            {/* Custom services as highlighted cards */}
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
                {t("Presentation.Custom.Title") || "Custom Services"}
              </h3>
              <div className="space-y-4 mb-8">
                {(() => {
                  const translatedList = t("Presentation.CustomServicesList");
                  const items = Array.isArray(translatedList)
                    ? translatedList
                    : [
                        {
                          Title: "Expertise and experience",
                          Desc: "Our team brings years of experience in Swiss accounting standards.",
                        },
                        {
                          Title: "Personalized approach",
                          Desc: "We analyze your situation to offer tailored solutions.",
                        },
                        {
                          Title: "Compliance and security",
                          Desc: "We guarantee compliance with all legal obligations.",
                        },
                      ];
                  return items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 px-6 py-4 rounded-lg bg-primary/5 mb-4"
                    >
                      <CheckCircle className="ui-icon mt-1 min-w-[20px] text-brand" size={20} aria-hidden="true" />
                      <div>
                        <span className="font-semibold block text-lg mb-2">
                          {item.Title}
                        </span>
                        <span className="text-base leading-relaxed">
                          {item.Desc}
                        </span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>
            {/* Services list (deferred island) */}
            <section>
              <Defer
                rootMargin="200px"
                idle={150}
                placeholder={
                  <div className="h-48 w-full rounded-lg bg-muted/40" />
                }
              >
                <ServicesListSection />
              </Defer>
            </section>
            <ServiceLongForm t={t} locale={locale} />
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
export default AccountingPresentation;
