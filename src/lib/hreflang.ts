import type { Locale } from "./i18n-locales";

export function hreflangFor(locale: Locale): string {
  switch (locale) {
    case "fr":
      return "fr-CH";
    case "de":
      return "de-CH";
    case "es":
      return "es-ES";
    case "pt":
      return "pt-PT";
    default:
      return "en";
  }
}

