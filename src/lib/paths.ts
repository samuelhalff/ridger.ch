import type { Locale } from "./i18n-locales";

// Base-to-localized path mapping per locale.
// Canonical (English) service slugs are the route directory names; each locale
// map translates them to a locale-specific slug where relevant.
const frMap: Record<string, string> = {
  "/": "/",
  "/services": "/services",
  "/approach": "/approche",
  "/services/consolidated-reporting": "/services/reporting-consolide",
  "/services/investment-oversight": "/services/surveillance-investissements",
  "/services/family-office-coordination": "/services/coordination-family-office",
  "/services/governance-succession": "/services/gouvernance-succession",
  "/services/tax-administration": "/services/fiscalite-administration",
  "/services/digital-vault": "/services/coffre-fort-numerique",
  "/services/real-estate-transactions": "/services/immobilier-transactions",
};

const deMap: Record<string, string> = {
  "/approach": "/ansatz",
  "/services/consolidated-reporting": "/services/konsolidiertes-reporting",
  "/services/investment-oversight": "/services/anlageueberwachung",
  "/services/family-office-coordination": "/services/family-office-koordination",
  "/services/governance-succession": "/services/governance-nachfolge",
  "/services/tax-administration": "/services/steuerverwaltung",
  "/services/digital-vault": "/services/digitaler-tresor",
  "/services/real-estate-transactions": "/services/immobilien-transaktionen",
};

const esMap: Record<string, string> = {
  "/approach": "/enfoque",
  "/services/consolidated-reporting": "/services/reporting-consolidado",
  "/services/investment-oversight": "/services/supervision-inversiones",
  "/services/family-office-coordination": "/services/coordinacion-family-office",
  "/services/governance-succession": "/services/gobernanza-sucesion",
  "/services/tax-administration": "/services/administracion-fiscal",
  "/services/digital-vault": "/services/caja-fuerte-digital",
  "/services/real-estate-transactions": "/services/inmobiliario-transacciones",
};

const ptMap: Record<string, string> = {
  "/approach": "/abordagem",
  "/services/consolidated-reporting": "/services/reporting-consolidado",
  "/services/investment-oversight": "/services/supervisao-investimentos",
  "/services/family-office-coordination": "/services/coordenacao-family-office",
  "/services/governance-succession": "/services/governanca-sucessao",
  "/services/tax-administration": "/services/administracao-fiscal",
  "/services/digital-vault": "/services/cofre-digital",
  "/services/real-estate-transactions": "/services/imobiliario-transacoes",
};

const identity = (p: string) => p;

const maps: Record<Locale, (p: string) => string> = {
  en: identity,
  fr: (p: string) => frMap[p] || p,
  de: (p: string) => deMap[p] || p,
  es: (p: string) => esMap[p] || p,
  pt: (p: string) => ptMap[p] || p,
};

// Localize a base path (e.g., "/services/accounting") to a locale-specific slug.
export function localizePath(path: string, locale: Locale): string {
  const normalize = (s: string) =>
    s.endsWith("/") && s !== "/" ? s.slice(0, -1) : s;
  const key = normalize(path);
  const mapper = maps[locale] || identity;
  const localized = mapper(key);
  return localized;
}

// Map a localized path back to the base path (for rewrites if needed).
// Currently only supports FR mappings.
export function delocalizePath(path: string, locale: Locale): string {
  const normalize = (s: string) =>
    s.endsWith("/") && s !== "/" ? s.slice(0, -1) : s;
  const key = normalize(path);
  if (locale === "fr") {
    const entry = Object.entries(frMap).find(([, v]) => v === key);
    return entry ? entry[0] : key;
  }
  return key;
}

/**
 * Ensures a URL path ends with a trailing slash.
 * This is the canonical URL format for this site to prevent redirect chains
 * and duplicate content issues.
 *
 * @example
 * withTrailingSlash("/fr/contact") => "/fr/contact/"
 * withTrailingSlash("/fr/contact/") => "/fr/contact/"
 * withTrailingSlash("/") => "/"
 */
export function withTrailingSlash(path: string): string {
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Builds a normalized internal URL with locale prefix and trailing slash.
 * Use this for all internal navigation links to ensure URL consistency.
 *
 * @example
 * buildInternalUrl("/contact", "fr") => "/fr/contact/"
 * buildInternalUrl("/services/accounting", "fr") => "/fr/services/comptabilite/"
 */
export function buildInternalUrl(basePath: string, locale: Locale): string {
  const localized = basePath === "/" ? "" : localizePath(basePath, locale);
  return withTrailingSlash(`/${locale}${localized}`);
}

const internalHosts = new Set(["ridger.ch", "www.ridger.ch"]);
const fileExtRegex = /\.[a-zA-Z0-9]{1,8}$/;

function hasFileExtension(path: string): boolean {
  return fileExtRegex.test(path);
}

function isSpecialRoute(path: string): boolean {
  return path.includes("/opengraph-image") || path.includes("/twitter-image");
}

/**
 * Normalize an internal href to include locale + trailing slash.
 * Preserves query/hash and leaves external links untouched.
 */
export function normalizeInternalHref(href: string, locale: Locale): string {
  if (!href) return href;

  let path = href;
  let search = "";
  let hash = "";

  if (/^https?:\/\//i.test(href)) {
    try {
      const url = new URL(href);
      if (!internalHosts.has(url.host)) return href;
      path = url.pathname || "/";
      search = url.search || "";
      hash = url.hash || "";
    } catch {
      return href;
    }
  } else if (href.startsWith("/")) {
    const queryIndex = href.indexOf("?");
    const hashIndex = href.indexOf("#");
    const cutIndex =
      queryIndex === -1
        ? hashIndex
        : hashIndex === -1
          ? queryIndex
          : Math.min(queryIndex, hashIndex);
    if (cutIndex !== -1) {
      path = href.slice(0, cutIndex);
      if (queryIndex !== -1) {
        const end = hashIndex !== -1 ? hashIndex : href.length;
        search = href.slice(queryIndex, end);
      }
      if (hashIndex !== -1) {
        hash = href.slice(hashIndex);
      }
    }
  } else {
    return href;
  }

  if (path.startsWith("/_next/") || path.startsWith("/assets/")) {
    return `${path}${search}${hash}`;
  }

  const localeMatch = path.match(/^\/([a-z]{2})(\/.*)?$/);
  if (localeMatch && (maps as Record<string, unknown>)[localeMatch[1]]) {
    const loc = localeMatch[1];
    const rest = localeMatch[2] || "/";
    let normalized = rest === "/" ? `/${loc}/` : `/${loc}${rest}`;
    if (
      normalized.length > 1 &&
      !normalized.endsWith("/") &&
      !hasFileExtension(normalized) &&
      !isSpecialRoute(normalized)
    ) {
      normalized += "/";
    }
    return `${normalized}${search}${hash}`;
  }

  const basePath =
    path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  let normalized = buildInternalUrl(basePath, locale);
  if (hasFileExtension(basePath) || isSpecialRoute(basePath)) {
    normalized = `/${locale}${localizePath(basePath, locale)}`;
  }
  return `${normalized}${search}${hash}`;
}
