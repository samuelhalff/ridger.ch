import { Metadata } from "next";
import Hero from "./components/hero";
import { headers } from "next/headers";
import Presentation from "./components/presentation";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import StructuredData from "@/src/components/seo/StructuredData";
import {
  arkEntityIds,
  buildServiceSchema,
  getArkServiceEntityId,
} from "@/src/lib/structuredData";

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

  return await generateMetadataForPage(locale as Locale, "/services/odoo");
}

const Odoo = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const baseUrl = "https://ridger.ch";
  const localePrefix = params.locale ? `/${params.locale}` : "";
  const tNav = await getTranslations(params.locale as Locale, "navbar");
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
        name: "Odoo",
        item: `${baseUrl}/${params.locale}${localizePath(
          "/services/odoo",
          params.locale as Locale
        )}/`,
      },
    ],
  } as const;
  const tService = await getTranslations(params.locale as Locale, "odoo");
  const serviceJsonLd = buildServiceSchema({
    id: getArkServiceEntityId("odoo"),
    name: (tService("Hero.Title") as string) || "Odoo",
    description:
      (tService("Hero.Description") as string) ||
      "Odoo implementation aligned to Swiss standards.",
    serviceType: "Odoo",
    url: `${baseUrl}/${params.locale}${localizePath(
      "/services/odoo",
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
      <StructuredData nonce={nonce} data={[breadcrumbJsonLd, serviceJsonLd]} />
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
              Odoo
            </span>
          </li>
        </ol>
      </nav>
      <Presentation />
    </div>
  );
};

export default Odoo;
