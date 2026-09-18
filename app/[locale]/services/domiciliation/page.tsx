import { Metadata } from "next";
import Hero from "./components/hero";
import { headers } from "next/headers";
import Presentation from "./components/presentation";
import { generateMetadataForPage } from "@/src/lib/metadata";
import StructuredData from "@/src/components/seo/StructuredData";
import {
  buildBreadcrumbList,
  buildHowTo,
  buildServiceSchema,
} from "@/src/lib/structuredData";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";

export const runtime = "nodejs";
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
    "/services/domiciliation"
  );
}

const Domiciliation = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const baseUrl = "https://ridger.ch";
  const localePrefix = params.locale ? `/${params.locale}` : "";
  const tNav = await getTranslations(params.locale as Locale, "navbar");
  const tService = await getTranslations(
    params.locale as Locale,
    "domiciliation"
  );
  const breadcrumbJsonLd = buildBreadcrumbList([
    {
      name: tNav("Services") as string,
      item: `${baseUrl}${localePrefix}/services/`,
    },
    {
      name: (tNav("DomiciliationServices.Title") as string) || "Domiciliation",
      item: `${baseUrl}/${params.locale}${localizePath(
        "/services/domiciliation",
        params.locale as Locale
      )}/`,
    },
  ]);
  const howToJsonLd = buildHowTo({
    name: "Domicilier son entreprise à Genève - Étapes",
    description:
      "Procédure pour obtenir une adresse de siège et mettre en place la domiciliation commerciale.",
    totalTime: "P14D",
    tools: [
      "Contrat de domiciliation",
      "Gestion/redirect courrier",
      "Accès eGov (RC/Zefix)",
      "Scanner PDF",
    ],
    supplies: [
      "Pièces d'identité des dirigeants",
      "Justificatif d'adresse de siège (bail ou attestation)",
      "Statuts ou projet de statuts",
      "Attestation de jouissance des locaux (si applicable)",
    ],
    steps: [
      {
        name: "Choisir l'offre de domiciliation",
        text: "Déterminer le type de domiciliation (simple, avec gestion courrier, services additionnels).",
        estimatedTime: "PT1H",
      },
      {
        name: "Constituer le dossier",
        text: "Réunir pièces d'identité, justificatifs et informations légales nécessaires.",
        estimatedTime: "P1D",
      },
      {
        name: "Signer le contrat de domiciliation",
        text: "Signer le contrat et obtenir l'attestation de domiciliation fournissant l'adresse officielle.",
        estimatedTime: "P1D",
      },
      {
        name: "Mise à jour Registre du commerce",
        text: "Adapter statuts/adresse et déposer la modification auprès du RC cantonal.",
        estimatedTime: "P5D",
      },
      {
        name: "Activer le suivi du courrier",
        text: "Mettre en place la réception, numérisation et redirection selon vos préférences.",
        estimatedTime: "P3D",
      },
    ],
  });
  const serviceJsonLd = buildServiceSchema({
    name:
      (tService("Hero.Title") as string) ||
      (tNav("DomiciliationServices.Title") as string) ||
      "Domiciliation",
    description:
      (tService("Hero.Description") as string) ||
      "Business domiciliation in Geneva or Lausanne for Swiss presence.",
    serviceType: "Domiciliation",
    url: `${baseUrl}/${params.locale}${localizePath(
      "/services/domiciliation",
      params.locale as Locale
    )}/`,
    areaServed: ["Geneva", "Lausanne", "Romandy", "Switzerland"],
    provider: {
      name: "Ridger",
      url: baseUrl,
      logo: `${baseUrl}/assets/ridger--color.svg`,
    },
  });

  return (
    <div>
      <StructuredData
        nonce={nonce}
        data={[breadcrumbJsonLd, howToJsonLd, serviceJsonLd]}
      />
      <Hero params={params} />
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
              {(tNav("DomiciliationServices.Title") as string) ||
                "Domiciliation"}
            </span>
          </li>
        </ol>
      </nav>
      <Presentation />
    </div>
  );
};

export default Domiciliation;
