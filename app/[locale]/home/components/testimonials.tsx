import dynamic from "next/dynamic";
import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import GoogleReviewsBadge from "@/src/components/ui/google-reviews-badge";
import SectionHeading from "@/src/components/site/section-heading";
import Reveal from "@/src/components/motion/reveal";

// Dynamic import to avoid blocking first paint
const TestimonialsCarousel = dynamic(() => import("./testimonials-carousel"), {
  loading: () => (
    <div className="w-full overflow-hidden relative">
      <div className="flex gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="shrink-0 w-[350px] sm:w-[420px] lg:w-[480px] h-[180px] bg-muted/30 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  ),
});

interface Testimonial {
  name?: string;
  company?: string;
  service?: string;
  testimonial: string;
}

export default async function Testimonials() {
  const locale: Locale = await getCurrentLocale();
  const t = await getTranslations(locale, "testimonials");

  const eyebrow = (t("Eyebrow") as string) || "Client reviews";
  const title = (t("SectionTitle") as string) || "Testimonials";
  const subtitle = (t("Subtitle") as string) || "";
  const testimonials: Testimonial[] = (t("List") as Testimonial[]) || [];
  const anonymousLabel = (t("Anonymous") as string) || "Anonymous";

  return (
    <section
      id="testimonials"
      className="w-full py-12 xs:py-20 mb-10"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <Reveal className="mb-12 max-w-4xl mx-auto" delay={0.04}>
          <SectionHeading
            eyebrow={eyebrow}
            title={tidyTitle(title)}
            description={subtitle}
          />
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <TestimonialsCarousel
          testimonials={testimonials}
          anonymousLabel={anonymousLabel}
        />
      </Reveal>

      {/* Google Reviews badge — social proof */}
      <Reveal className="flex justify-center mt-8" delay={0.1}>
        <GoogleReviewsBadge locale={locale} />
      </Reveal>
    </section>
  );
}
