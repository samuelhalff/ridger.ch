import { Metadata } from "next";
import { generateMetadataForPage } from "@/src/lib/metadata";
import { getTranslations, getTranslationsRecord, type Locale } from "@/src/lib/i18n";
import DashboardMockup, {
  type PlatformStrings,
} from "@/src/components/platform/dashboard-mockup";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const { locale } = params;
  return await generateMetadataForPage(locale as Locale, "/platform");
}

export default async function PlatformPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = (params?.locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(locale, "platform");
  const strings = getTranslationsRecord(locale, "platform") as unknown as PlatformStrings;

  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-10 sm:px-8 sm:py-14">
      <header className="mx-auto mb-10 max-w-[1080px]">
        <p className="rule-label border-t-0 p-0 text-accent">
          {t("hero.eyebrow") as string}
        </p>
        <h1 className="font-display mt-4 max-w-[20ch] text-3xl leading-tight text-foreground sm:text-4xl md:text-5xl">
          {t("hero.title") as string}
        </h1>
        <p className="mt-5 max-w-[62ch] text-base leading-8 text-muted-foreground sm:text-lg">
          {t("hero.intro") as string}
        </p>
        <p className="mt-4 text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {t("hero.illustration") as string}
        </p>
      </header>

      <DashboardMockup strings={strings} />
    </div>
  );
}
