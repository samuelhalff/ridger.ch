import ServiceHero from "@/src/components/ui/service-hero";

const CorporateHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      locale={params.locale}
      namespace="corporate"
      imageSrc="/assets/hero/services/corporate-hero.optimized.webp"
      imageAlt="Matterhorn peak at sunrise with alpine skyline, Switzerland"
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss excellence"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="Business Experts"
      titleKey="Hero.Title"
      titleFallback="Strategic Corporate Services for Your Success"
      descriptionKey="Hero.Description"
      descriptionFallback="From company formation to business restructuring, we provide comprehensive corporate services to help your business thrive in Switzerland."
      ctaKey="Hero.CTA"
      ctaFallback="Contact us"
    />
  );
};

export default CorporateHero;
