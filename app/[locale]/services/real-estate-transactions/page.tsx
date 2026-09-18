import { Metadata } from "next";
import { headers } from "next/headers";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { type Locale } from "@/src/lib/i18n";
import ServiceDetail from "@/src/components/site/service-detail";
import { arkEntityIds } from "@/src/lib/structuredData";

export const runtime = "nodejs";
export const revalidate = false;

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  return await generateMetadataForPage(locale as Locale, "/services/real-estate-transactions");
}

export default async function Page(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <ServiceDetail
      namespace="real-estate-transactions"
      basePath="/services/real-estate-transactions"
      serviceEntityId={arkEntityIds.serviceRealEstate}
      imageSrc="/assets/hero/services/mna-hero.optimized.webp"
      locale={params.locale}
      nonce={nonce}
    />
  );
}
