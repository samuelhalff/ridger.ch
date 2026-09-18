import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import HttpBackend from "@/src/lib/i18n-http-backend";
import { locales, type Locale } from "@/src/lib/i18n-locales";
import { namespaces } from "@/src/lib/i18n-namespaces";

const FALLBACK_LOCALE: Locale = "fr";
const SUPPORTED_LANGS = locales as readonly string[];
const INITIAL_NAMESPACES: string[] = ["home", "navbar", "footer"];

const getPathLocale = (): Locale | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    const segments = window.location.pathname.split("/").filter(Boolean);
    const potential = segments[0];
    return locales.includes(potential as Locale) ? (potential as Locale) : undefined;
  } catch {
    return undefined;
  }
};

// Minimal client-only init for existing client components
if (!i18n.isInitialized && typeof window !== "undefined") {
  i18n
    .use(HttpBackend as any)
    .use(initReactI18next)
    .init({
      lng: getPathLocale(),
      fallbackLng: FALLBACK_LOCALE,
      supportedLngs: SUPPORTED_LANGS,
      ns: INITIAL_NAMESPACES,
      defaultNS: "home",
      fallbackNS: "home",
      interpolation: { escapeValue: false },
      returnEmptyString: false,
      cleanCode: true,
      load: "currentOnly",
      react: { useSuspense: false },
      backend: {
        loadPath: "/api/translations/{{lng}}/{{ns}}",
        allowMultiLoading: false,
      },
    })
    .catch(() => {});
}

export { namespaces };
export default i18n;
