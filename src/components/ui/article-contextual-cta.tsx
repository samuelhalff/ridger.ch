import { type Locale } from "@/src/lib/i18n";
import { CtaBanner } from "@/src/components/ui/surface";

/**
 * Contextual call-to-action banner injected within blog articles.
 * Encourages readers to get in touch or read the matching service page.
 */
const ArticleContextualCTA = ({
  locale,
  title,
  description,
  primaryText,
  primaryHref,
  secondaryText,
  secondaryHref,
}: {
  locale: string;
  title: string;
  description: string;
  primaryText: string;
  primaryHref?: string;
  secondaryText?: string;
  secondaryHref?: string;
}) => {
  const activeLocale = (locale as Locale) || ("fr" as Locale);
  const localePrefix = locale ? `/${locale}` : "/fr";

  const resolvedPrimaryHref = primaryHref || `${localePrefix}/contact/`;

  return (
    <CtaBanner
      className="not-prose my-12 px-6 py-8 sm:px-10 sm:py-10"
      variant="warm"
      eyebrow="Ridger"
      title={title}
      titleClassName="text-xl sm:text-2xl"
      description={description}
      primary={{
        href: resolvedPrimaryHref,
        label: primaryText,
        cta: "article_mid_contact",
        locale: activeLocale,
      }}
      secondary={
        secondaryText && secondaryHref
          ? {
              href: secondaryHref,
              label: secondaryText,
              cta: "article_mid_service",
              locale: activeLocale,
            }
          : undefined
      }
    />
  );
};

export default ArticleContextualCTA;
