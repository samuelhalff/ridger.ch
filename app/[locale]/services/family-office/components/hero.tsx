import ServiceHero from "@/src/components/ui/service-hero";

const FamilyOfficeHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      locale={params.locale}
      namespace="family-office"
      imageSrc="/assets/hero/services/family-office-hero.optimized.webp"
      imageAlt="Swiss Alps landscape with family estate, Switzerland"
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss excellence"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="Family legacy"
      titleKey="Hero.Title"
      titleFallback="Family Office Services"
      descriptionKey="Hero.Description"
      descriptionFallback="Comprehensive family office services for high-net-worth individuals and families, including wealth management, estate planning, tax optimization, and succession planning."
      ctaKey="Hero.CTA"
      ctaFallback="Secure your legacy"
    />
  );
};

export default FamilyOfficeHero;
