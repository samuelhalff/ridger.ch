import { getTranslations, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import { CtaBanner } from "@/src/components/ui/surface";

const ServiceExpertBanner = async ({ locale }: { locale: string }) => {
  const activeLocale = (locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(activeLocale, "services");
  const localePrefix = locale ? `/${locale}` : "/fr";

  const title =
    (t("ExpertBanner.Title") as string) || "Speak to one of our experts";
  const description =
    (t("ExpertBanner.Description") as string) ||
    "Need a quick opinion or a clear quote? Our team replies fast and keeps it simple.";
  const primary =
    (t("ExpertBanner.PrimaryCTA") as string) || "Speak to an expert";
  const secondary =
    (t("ExpertBanner.SecondaryCTA") as string) || "Get an instant quote";

  return (
    <CtaBanner
      className="mt-16"
      variant="warm"
      title={tidyTitle(title)}
      description={description}
      primary={{
        href: `${localePrefix}/contact/`,
        label: primary,
        locale: activeLocale,
      }}
      secondary={{
        href: `${localePrefix}/agent/`,
        label: secondary,
        locale: activeLocale,
      }}
    />
  );
};

export default ServiceExpertBanner;
