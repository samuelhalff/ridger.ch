import { Metadata } from "next";
import { headers } from "next/headers";
import Hero from "./components/hero";
import Presentation from "./components/presentation";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import StructuredData from "@/src/components/seo/StructuredData";
import {
  arkEntityIds,
  buildHowTo,
  buildServiceSchema,
  getArkServiceEntityId,
} from "@/src/lib/structuredData";

export const revalidate = false;

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  return await generateMetadataForPage(
    locale as Locale,
    "/services/incorporation"
  );
}

const Incorporation = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const baseUrl = "https://ridger.ch";
  const localePrefix = params.locale ? `/${params.locale}` : "";
  const tNav = await getTranslations(params.locale as Locale, "navbar");
  const tService = await getTranslations(
    params.locale as Locale,
    "incorporation"
  );
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: tNav("Services") as string,
        item: `${baseUrl}${localePrefix}/services/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: (tNav("Incorporation.Title") as string) || "Incorporation",
        item: `${baseUrl}/${params.locale}${localizePath(
          "/services/incorporation",
          params.locale as Locale
        )}/`,
      },
    ],
  } as const;
  const howToJsonLd = buildHowTo({
    name: "Créer une société à Genève - Étapes",
    description:
      "Processus détaillé des principales étapes pour constituer une entreprise à Genève, de l'analyse initiale aux affiliations sociales.",
    totalTime: "P1M", // Durée globale indicative (1 mois)
    tools: [
      "Modèle de statuts",
      "Outil de planification financière",
      "Accès eGov / Registre du commerce",
    ],
    supplies: [
      "Capital libéré (numéraire)",
      "Pièces d'identité des fondateurs",
      "Attestation bancaire de blocage du capital",
      "Adresse de siège social",
    ],
    steps: [
      {
        name: "Analyse de la forme juridique",
        text: "Comparer SA, Sàrl ou entreprise individuelle selon responsabilité, fiscalité, capital et gouvernance.",
        estimatedTime: "PT2H",
      },
      {
        name: "Planification du capital & statuts",
        text: "Rédiger les statuts (objet, capital, actions/parts, gouvernance) et définir la répartition du capital.",
        estimatedTime: "P2D",
      },
      {
        name: "Dépôt du capital et authentification",
        text: "Déposer le capital auprès d'une banque ou notaire, obtenir l'attestation et signer l'acte constitutif.",
        estimatedTime: "P3D",
      },
      {
        name: "Dossier Registre du commerce",
        text: "Compiler statuts signés, attestations, formulaires RC et pièces d'identité puis déposer électroniquement ou physiquement.",
        estimatedTime: "P5D",
      },
      {
        name: "Affiliations TVA & assurances sociales",
        text: "Évaluer l'assujettissement TVA, s'enregistrer si seuil atteint, puis affilier employés (AVS, LPP, LAA).",
        estimatedTime: "P10D",
      },
      {
        name: "Mise en place comptable & outils",
        text: "Configurer le plan comptable, l'outil de facturation et les contrôles internes de base.",
        estimatedTime: "P7D",
      },
    ],
  });

  const serviceJsonLd = buildServiceSchema({
    id: getArkServiceEntityId("incorporation"),
    name:
      (tService("Hero.Title") as string) ||
      (tNav("Incorporation.Title") as string) ||
      "Incorporation",
    description:
      (tService("Hero.Description") as string) ||
      "Company incorporation and registration assistance in Switzerland.",
    serviceType: "Incorporation",
    url: `${baseUrl}/${params.locale}${localizePath(
      "/services/incorporation",
      params.locale as Locale
    )}/`,
    schemaType: "ProfessionalService",
    areaServed: [
      { "@id": arkEntityIds.areaGeneva },
      { "@type": "Country", name: "Switzerland" },
    ],
    provider: {
      "@id": arkEntityIds.organization,
    },
  });

  return (
    <div>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <StructuredData nonce={nonce} data={[howToJsonLd, serviceJsonLd]} />
      <Hero locale={params.locale} />
      <nav
        aria-label="Breadcrumb"
        className="mx-auto mb-6 mt-4 w-full max-w-[1240px] px-5 sm:px-8"
      >
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <a href={`${localePrefix}/`} className="hover:underline">
              {tNav("Home") as string}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <a href={`${localePrefix}/services/`} className="hover:underline">
              {tNav("Services") as string}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <span aria-current="page" className="font-medium text-foreground">
              {(tNav("Incorporation.Title") as string) || "Incorporation"}
            </span>
          </li>
        </ol>
      </nav>
      <Presentation />
    </div>
  );
};

export default Incorporation;
