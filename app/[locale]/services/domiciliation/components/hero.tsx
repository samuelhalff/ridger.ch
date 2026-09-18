import ServiceHero from "@/src/components/ui/service-hero";

const DomiciliationHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      namespace="domiciliation"
      imageSrc="/assets/hero/services/domiciliation-hero.optimized.webp"
      imageAlt="Mountain ridge emerging above clouds in the Swiss Alps"
      locale={params.locale}
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss Address"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="Business Solutions"
      titleKey="Hero.Title"
      titleFallback="Professional Domiciliation Services"
      descriptionKey="Hero.Description"
      descriptionFallback="Domiciliation services provide businesses with a registered address. These services are ideal for companies looking to establish a presence in Switzerland."
      ctaKey="Hero.CTA"
      ctaFallback="Contact us"
    />
  );
};

export default DomiciliationHero;
