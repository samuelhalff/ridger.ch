import { CheckCircle as Check } from "@phosphor-icons/react/dist/ssr";
import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ServiceLongForm from "@/src/components/ui/service-longform";
import ServiceExpertBanner from "@/src/components/ui/service-expert-banner";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
const ServicesListServer = dynamic(
  () => import("@/src/components/ui/services-list-server"),
);
const CorporatePresentation = async () => {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "incorporation");
  const title = (t("Presentation.Title") as string) || "Company Incorporation Services";
  const subtitle = (t("Presentation.Subtitle") as string) || "Expert Incorporation & Registration";
  const intro = (t("Presentation.Intro") as unknown as string[]) || [
    "We specialise in company incorporation, guiding you through registration, documentation, and compliance for a smooth start.",
    "From choosing the right legal form to filing with authorities, we make company formation efficient and compliant.",
  ];
  const strengths = (t("Presentation.Strengths") as unknown as Array<{ Title: string; Desc: string }>) || [
    { Title: "Formation expertise", Desc: "Experienced guidance on entity selection, registration steps and documentation." },
    { Title: "Regulatory compliance", Desc: "Ensure your new company meets all local legal and tax requirements from day one." },
    { Title: "Post-incorporation support", Desc: "Registered office, nominee services and ongoing reporting assistance." },
  ];
  const services = (t("Presentation.Services") as unknown as string[]) || [
    "Company registration and formation",
    "Preparation and filing of incorporation documents",
    "Registered office and nominee services",
    "Tax registration and compliance onboarding",
  ];
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
            {intro.map((text, idx) => (
              <p key={idx} className="mb-8 text-base leading-8 text-muted-foreground sm:text-lg">{text}</p>
            ))}
          </div>
          <div className="space-y-16">
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">{tidyTitle(((t("Presentation.StrengthsTitle") as string) || "Why Choose Our Incorporation Services"))}</h3>
              <div className="space-y-4 mb-8">
                {strengths.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 px-6 py-4 rounded-lg bg-primary/5 mb-4">
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
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">{tidyTitle(((t("Presentation.ServicesTitle") as string) || "Incorporation Services"))}</h3>
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
                  ns="incorporation"
                  translationKey="Presentation.Services"
                  fallbackText={services}
                  className="space-y-6"
                  locale={locale}
                />
              </Suspense>
            </section>
            <ServiceLongForm t={t} locale={locale} />
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
export default CorporatePresentation;
