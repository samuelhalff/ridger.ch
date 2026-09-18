import { Metadata } from "next";
import { headers } from "next/headers";
import StructuredData from "@/src/components/seo/StructuredData";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { buildServiceSchema } from "@/src/lib/structuredData";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import Hero from "./components/hero";
import Presentation from "./components/presentation";

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
    "/services/mergers-acquisitions"
  );
}

const MAServicesPage = async (props: { params: Promise<{ locale: string }> }) => {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  const baseUrl = "https://ridger.ch";
  const localePrefix = params.locale ? `/${params.locale}` : "";
  const locale = params.locale as Locale;
  const tNav = await getTranslations(locale, "navbar");
  const tService = await getTranslations(locale, "mna");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: (tNav("Services") as string) || "Services",
        item: `${baseUrl}${localePrefix}/services/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name:
          (tService("Hero.Title") as string) ||
          (tNav("MAServices.Title") as string) ||
          "M&A advisory",
        item: `${baseUrl}/${params.locale}${localizePath(
          "/services/mergers-acquisitions",
          locale
        )}/`,
      },
    ],
  } as const;

  const serviceJsonLd = buildServiceSchema({
    name:
      (tService("Hero.Title") as string) ||
      (tNav("MAServices.Title") as string) ||
      "M&A advisory",
    description:
      (tService("Hero.Description") as string) ||
      "Swiss mergers and acquisitions advisory for mid-market companies.",
    serviceType: "Mergers and acquisitions advisory",
    url: `${baseUrl}/${params.locale}${localizePath(
      "/services/mergers-acquisitions",
      locale
    )}/`,
    areaServed: ["Geneva", "Lausanne", "Romandy", "Zurich", "Switzerland"],
    provider: {
      name: "Ridger",
      url: baseUrl,
      logo: `${baseUrl}/assets/arkfid--color.svg`,
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
              {(tNav("Home") as string) || "Home"}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <a href={`${localePrefix}/services/`} className="hover:underline">
              {(tNav("Services") as string) || "Services"}
            </a>
          </li>
          <li className="flex items-center gap-1">
            <span className="text-muted-foreground/60">/</span>
            <span aria-current="page" className="font-medium text-foreground">
              {(tNav("MAServices.Title") as string) || "M&A advisory"}
            </span>
          </li>
        </ol>
      </nav>
      <Presentation />
    </div>
  );
};

export default MAServicesPage;
