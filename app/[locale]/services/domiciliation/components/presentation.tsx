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
const DomiciliationPresentation = async () => {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "domiciliation");
  const title = (t("Presentation.Title") as string) || "Professional Domiciliation Services";
  const subtitle = (t("Presentation.Subtitle") as string) || "Your Swiss Business Address Solution";
  const intro = (t("Presentation.Intro") as unknown as string[]) || [
    "Our domiciliation services provide your company with a prestigious Swiss address, mail handling, and compliance support.",
    "We help you establish a credible presence in Switzerland, whether you are a startup, SME, or international group.",
  ];
  const strengths = (t("Presentation.Strengths") as unknown as Array<{ Title: string; Desc: string }>) || [
    { Title: "Prestigious location", Desc: "Premium Swiss business address for your company." },
    { Title: "Professional handling", Desc: "Expert management of mail and administrative tasks." },
    { Title: "Legal compliance", Desc: "Full adherence to Swiss regulatory requirements." },
  ];
  const services = (t("Presentation.Services") as unknown as string[]) || [
    "Service 1: Description",
    "Service 2: Description",
    "Service 3: Description",
    "Service 4: Description",
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
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">{tidyTitle(((t("Presentation.StrengthsTitle") as string) || "Our Strengths"))}</h3>
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
                  ns="domiciliation"
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
export default DomiciliationPresentation;
