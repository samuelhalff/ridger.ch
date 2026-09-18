import ServiceHero from "@/src/components/ui/service-hero";

const OutsourcingHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      namespace="outsourcing"
      imageSrc="/assets/hero/services/outsourcing-hero.optimized.webp"
      imageAlt="Aerial view of lush forest meeting turquoise Swiss lake"
      locale={params.locale}
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss Quality"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="BPO Experts"
      titleKey="Hero.Title"
      titleFallback="Streamline Your Business Operations"
      descriptionKey="Hero.Description"
      descriptionFallback="Focus on your core business while we handle your back office operations with Swiss precision and reliability."
      ctaKey="Hero.CTA"
      ctaFallback="Contact us"
    />
  );
};

export default OutsourcingHero;
