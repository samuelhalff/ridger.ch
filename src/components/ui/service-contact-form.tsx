import { getTranslations, type Locale } from "@/src/lib/i18n";
import { tidyTitle } from "@/src/lib/typography";
import { CtaBanner } from "@/src/components/ui/surface";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";

/**
 * Lightweight inline contact CTA for service pages.
 * Renders a prominent contact section with two action buttons,
 * reducing friction by surfacing the conversion path directly on the page.
 */
const ServiceContactForm = async ({
  locale,
  context,
  compact = false,
}: {
  locale: string;
  /** Optional service context shown in the description (e.g. "comptabilité") */
  context?: string;
  compact?: boolean;
}) => {
  const activeLocale = (locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(activeLocale, "services");
  const localePrefix = locale ? `/${locale}` : "/fr";

  const title =
    (t("InlineContact.Title") as string) || "Contact us";
  const rawDescription =
    (t("InlineContact.Description") as string) ||
    "Tell us about your needs and receive a personalised proposal within 24 hours. No commitment.";
  const description = context
    ? rawDescription.replace("{service}", context)
    : rawDescription;
  const primary =
    (t("InlineContact.PrimaryCTA") as string) || "Contact us";
  const secondary =
    (t("InlineContact.SecondaryCTA") as string) || "Book a call";
  const trustLine =
    (t("InlineContact.TrustLine") as string) || "";

  return (
    <CtaBanner
      className={compact ? "my-10 p-6 sm:p-8" : "my-16"}
      variant="warm"
      title={tidyTitle(title)}
      titleClassName={compact ? "text-xl sm:text-2xl" : undefined}
      description={
        <>
          {description}
          {trustLine ? (
            <span className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground/80">
            <CheckCircle size={16} aria-hidden="true" className="text-green-500" />
            {trustLine}
            </span>
          ) : null}
        </>
      }
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

export default ServiceContactForm;
