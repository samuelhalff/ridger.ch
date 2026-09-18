import ServiceHero from "@/src/components/ui/service-hero";

const AccountingHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      namespace="accounting"
      imageSrc="/assets/hero/services/accounting-hero.optimized.webp"
      imageAlt="Zurich old town and Lake Zurich at sunrise, Switzerland"
      locale={params.locale}
      badge1Key="Hero.Badge"
      badge1Fallback="Swiss excellence"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="AI Powered"
      titleKey="Hero.Title"
      titleFallback="Expert Accounting Services for Your Success"
      descriptionKey="Hero.Description"
      descriptionFallback="From bookkeeping to financial strategy, we provide comprehensive accounting services to help your business thrive in Switzerland."
      ctaKey="Hero.CTA"
      ctaFallback="Contact us"
    />
  );
};

export default AccountingHero;
