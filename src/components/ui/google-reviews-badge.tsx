import { getTranslations, type Locale } from "@/src/lib/i18n";
import { GoogleLogo } from "@phosphor-icons/react/dist/ssr";

/**
 * Links to the official Google profile without publishing unverifiable
 * aggregate ratings or review counts in page content.
 */

const GoogleReviewsBadge = async ({ locale }: { locale: string }) => {
  const activeLocale = (locale as Locale) || ("fr" as Locale);
  const t = await getTranslations(activeLocale, "services");

  const label =
    (t("GoogleReviews.Label") as string) || "Google profile";
  const cta =
    (t("GoogleReviews.CTA") as string) || "Open profile";

  return (
    <div className="inline-flex items-center gap-3 rounded-full bg-background/80 px-4 py-2 shadow-sm">
      <GoogleLogo size={20} weight="bold" aria-hidden="true" className="shrink-0" />
      <span className="text-xs text-muted-foreground">{label}</span>
      <a
        href="https://maps.google.com/?cid=14946625157719331801"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-medium text-primary hover:underline"
      >
        {cta}
      </a>
    </div>
  );
};

export default GoogleReviewsBadge;
