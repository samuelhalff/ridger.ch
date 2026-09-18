import type { Locale } from "./i18n-locales";

// Base-to-localized path mapping per locale.
// Only French is localized for service slugs for now; others fall back to English.
const frMap: Record<string, string> = {
  "/": "/",
  "/services": "/services",
  "/services/accounting": "/services/comptabilite",
  "/services/taxes": "/services/fiscalite",
  "/services/payroll": "/services/paie",
  "/services/outsourcing": "/services/externalisation",
  "/services/mergers-acquisitions": "/services/fusions-acquisitions",
  "/services/corporate": "/services/services-corporatifs",
  "/services/domiciliation": "/services/domiciliation",
  "/services/incorporation": "/services/constitution-entreprise",
  "/services/immigration": "/services/immigration",
  "/services/odoo": "/services/odoo",
  "/services/family-office": "/services/family-office",
};

const identity = (p: string) => p;

const maps: Record<Locale, (p: string) => string> = {
  en: identity,
  fr: (p: string) => frMap[p] || p,
  de: identity,
  es: identity,
  pt: identity,
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
