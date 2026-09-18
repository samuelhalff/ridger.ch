import ServiceHero from "@/src/components/ui/service-hero";

const TaxesHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      namespace="taxes"
      imageSrc="/assets/hero/services/taxes-hero.optimized.webp"
      imageAlt="Aerial view of winding mountain pass road in Switzerland"
      locale={params.locale}
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss Expertise"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="Tax Specialists"
      titleKey="Hero.Title"
      titleFallback="Expert Tax services for Companies and Individuals"
      descriptionKey="Hero.Description"
      descriptionFallback="We handle all aspects of tax compliance and optimization, including VAT registration, corporate taxes, and personal tax planning."
      ctaKey="Hero.CTA"
      ctaFallback="Contact us"
    />
  );
};

export default TaxesHero;
