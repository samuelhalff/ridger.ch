import ServiceHero from "@/src/components/ui/service-hero";

const ImmigrationHero = ({ params }: { params: { locale: string } }) => {
  return (
    <ServiceHero
      namespace="immigration"
      imageSrc="/assets/hero/services/immigration-hero.optimized.webp"
      imageAlt="Aile d'avion avec croix suisse au-dessus des nuages"
      locale={params.locale}
      badge1Key="Hero.Badge"
      badge1Fallback="Immigration suisse"
      badge2Key="Hero.BadgeTwo"
      badge2Fallback="Permis & mobilité"
      titleKey="Hero.Title"
      titleFallback="Immigration et permis de travail en Suisse"
      descriptionKey="Hero.Description"
      descriptionFallback="Accompagnement clair pour les permis L, B, C et les dossiers ANobAG en Suisse romande."
      ctaKey="Hero.CTA"
      ctaFallback="Parler à un spécialiste"
    />
  );
};

export default ImmigrationHero;
