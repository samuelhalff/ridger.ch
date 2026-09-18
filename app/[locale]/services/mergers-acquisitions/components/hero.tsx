import ServiceHero from "@/src/components/ui/service-hero";

const MAHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      locale={params.locale}
      namespace="mna"
      imageSrc="/assets/hero/services/mna-hero.optimized.webp"
      imageAlt="Morning light over Lake Blausee in the Swiss Alps"
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss mid-market focus"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="Trusted deal partner"
      titleKey="Hero.Title"
      titleFallback="Mergers & acquisitions advisory"
      descriptionKey="Hero.Description"
      descriptionFallback="Advisory support for Swiss founders, investors, and SMEs across the full deal lifecycle."
      ctaKey="Hero.CTA"
      ctaFallback="Talk to our M&A team"
    />
  );
};

export default MAHero;
