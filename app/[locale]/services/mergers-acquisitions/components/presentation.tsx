import Link from "next/link";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { getCurrentLocale, getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import { tidyTitle } from "@/src/lib/typography";
import ServiceLongForm from "@/src/components/ui/service-longform";
import ServiceExpertBanner from "@/src/components/ui/service-expert-banner";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
import { CheckCircle as Check } from "@phosphor-icons/react/dist/ssr";
const ServicesListServer = dynamic(
  () => import("@/src/components/ui/services-list-server"),
);
const MAPresentation = async () => {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "mna");
  const localePrefix = `/${locale}`;
  const title = t("Presentation.Title") as string;
  const subtitle = t("Presentation.Subtitle") as string;
  const intro = (t("Presentation.Intro") as unknown as string[]) || [];
  const partnerNote = t("Presentation.PartnerNote") as string;
  const partnerLinkLabel = t("Presentation.PartnerLinkLabel") as string;
  const strengths =
    (t("Presentation.Strengths") as unknown as Array<{
      Title: string;
      Desc: string;
    }>) || [];
  return (
    <section data-service-content className="w-full px-5 py-12 sm:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-[1240px]">
        <h2 className="mb-6 max-w-[18ch] text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
          {tidyTitle(title || "Swiss M&A advisory for SMEs")}
        </h2>
        <h2 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
          {tidyTitle(subtitle || "Guiding founders through each transaction step")}
        </h2>
        <div className="text-left w-full">
          <div className="mb-12 max-w-3xl space-y-6">
            {(Array.isArray(intro) && intro.length > 0
              ? intro
              : [
                  "We advise Swiss entrepreneurs and investors on buy-side and sell-side mandates with a focus on deals up to the mid-market size.",
                  "Our team blends financial modelling, company valuation, deal structuring and post-merger integration planning backed by Swiss regulatory know-how.",
                ]
            ).map((p, idx) => (
              <p key={idx} className="mb-6">
                {p}
              </p>
            ))}
            {partnerNote && (
              <p className="mb-6">
                {partnerNote}{" "}
                <Link
                  href={`${localePrefix}${localizePath("/partners", locale)}/`}
                  className="text-primary hover:underline"
                  prefetch={false}
                >
                  {partnerLinkLabel || "Discover our partners"}
                </Link>
                .
              </p>
            )}
          </div>
          <div className="space-y-16">
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
                {tidyTitle(
                  (t("Presentation.StrengthsTitle") as string) || "How we support your deal"
                )}
              </h3>
              <div className="space-y-4 mb-8">
                {(Array.isArray(strengths) && strengths.length > 0
                  ? strengths
                  : [
                      {
                        Title: "Sector aware advice",
                        Desc: "Experience with Swiss industrial, services and tech SMEs so we can benchmark terms, valuation ranges and buyer expectations.",
                      },
                      {
                        Title: "Process discipline",
                        Desc: "Clear milestones for due diligence, vendor data rooms, management presentations and negotiation rounds.",
                      },
                      {
                        Title: "Integration and succession focus",
                        Desc: "We anticipate people, tax and reporting impacts so the post-merger integration or succession handover runs smoothly.",
                      },
                    ]
                ).map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 px-6 py-4 rounded-lg bg-primary/5 mb-4"
                  >
                    <Check className="text-brand mt-1 min-w-[20px]" />
                    <div>
                      <span className="font-semibold block text-lg mb-2">
                        {item.Title}
                      </span>
                      <span className="text-base leading-relaxed">{item.Desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xl xs:text-2xl md:text-2xl font-bold mb-8 md:leading-[2rem] tracking-tight">
                {tidyTitle(
                  (t("Presentation.ServicesTitle") as string) || "M&A services"
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
                  ns="mna"
                  translationKey="Presentation.Services"
                  fallbackText={[
                    "Buy-side and sell-side advisory mandates",
                    "Financial modelling and valuation analyses",
                    "Coordination of due diligence and data rooms",
                    "Post-merger integration planning",
                  ]}
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
export default MAPresentation;
