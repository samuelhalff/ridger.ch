import { CheckCircle as Check } from "@phosphor-icons/react/dist/ssr";
import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import ServiceLongForm from "@/src/components/ui/service-longform";
import ServiceExpertBanner from "@/src/components/ui/service-expert-banner";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
import CaseStudiesSection from "@/src/components/site/case-studies-section";
import { getImmigrationCaseStudies } from "../caseStudies";
const ServicesListServer = dynamic(
  () => import("@/src/components/ui/services-list-server"),
);
const ImmigrationPresentation = async () => {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "immigration");
  const title = (t("Presentation.Title") as string) || "Immigration";
  const subtitle =
    (t("Presentation.Subtitle") as string) ||
    "Séjour et mobilité professionnelle";
  const intro = (t("Presentation.Intro") as unknown as string[]) || [
    "Nous aidons les entrepreneurs, cadres et familles à sécuriser leur installation en Suisse romande.",
    "Nous clarifions les options (permis L/B/C, ANobAG, création de société) et coordonnons les démarches avec les autorités cantonales.",
  ];
  const strengths =
    (t("Presentation.Strengths") as unknown as Array<{
      Title: string;
      Desc: string;
    }>) || [
      {
        Title: "Diagnostic clair",
        Desc: "Analyse rapide du statut, des délais et des documents requis.",
      },
      {
        Title: "Dossier complet",
        Desc: "Préparation et vérification des pièces pour éviter les retours.",
      },
      {
        Title: "Coordination locale",
        Desc: "Suivi avec les autorités, caisses sociales et partenaires.",
      },
    ];
  const services = (t("Presentation.Services") as unknown as string[]) || [
    "Analyse du statut et de la mobilité",
    "Coordination des permis de séjour et de travail",
    "Dossiers ANobAG et affiliation aux assurances sociales",
    "Création de société et contrat de travail",
  ];
  const caseStudies = getImmigrationCaseStudies(locale);
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
              <p key={idx} className="mb-8 text-base leading-8 text-muted-foreground sm:text-lg">
                {text}
              </p>
            ))}
          </div>
          <div className="space-y-16">
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
                {tidyTitle(
                  (t("Presentation.StrengthsTitle") as string) ||
                    "Nos points forts"
                )}
              </h3>
              <div className="space-y-4 mb-8">
                {strengths.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 px-6 py-4 rounded-lg bg-primary/5 mb-4"
                  >
                    <Check className="text-brand mt-1 min-w-[20px]" />
                    <div>
                      <span className="font-semibold block text-lg mb-2">
                        {item.Title}
                      </span>
                      <span className="text-base leading-relaxed">
                        {item.Desc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
                {tidyTitle(
                  (t("Presentation.ServicesTitle") as string) || "Services"
                )}
              </h3>
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
                  ns="immigration"
                  translationKey="Presentation.Services"
                  fallbackText={services}
                  className="space-y-6"
                  locale={locale}
                />
              </Suspense>
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
export default ImmigrationPresentation;
