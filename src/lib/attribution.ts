/**
 * First-party lead attribution (first touch of the current visit).
 *
 * What is kept: landing pathname, referrer origin (external sites only),
 * allowlisted utm_* values, gclid and a trail of up to 20 visited pathnames.
 * Never full URLs or query strings.
 *
 * Where it lives: in memory for every visitor (survives client-side
 * navigation, lost on reload). Mirrored to sessionStorage only while the
 * visitor has accepted cookies. It leaves the browser only when the visitor
 * submits a lead form or the assistant, with a notice next to the button.
 *
 * Dependency-free so it can be unit tested with `node --test`.
 */

export type AttributionUtm = {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
};

export type Attribution = {
  landingPage: string;
  referrer: string;
  utm: AttributionUtm;
  gclid: string;
  pages: string[];
};

export const ATTRIBUTION_STORAGE_KEY = "leadAttribution";
export const ATTRIBUTION_MAX_PAGES = 20;
export const ATTRIBUTION_MAX_PATH = 200;
export const ATTRIBUTION_MAX_PARAM = 150;

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

/** Strips markup/control characters and bounds the length. */
export function sanitizeAttributionParam(
  value: unknown,
  max = ATTRIBUTION_MAX_PARAM,
): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f<>"'`]/g, "")
    .trim()
    .slice(0, max);
}

/** Pathname only: no query, no hash, bounded. */
export function cleanPathname(value: unknown): string {
  if (typeof value !== "string" || !value) return "";
  let path = value.split(/[?#]/)[0] || "";
  if (!path.startsWith("/")) return "";
  path = path.replace(/[\u0000-\u001f\u007f<>"'`\s]/g, "");
  return path.slice(0, ATTRIBUTION_MAX_PATH);
}

/** Origin of an external referrer; empty for same-site or invalid values. */
export function referrerOrigin(referrer: unknown, currentHost: string): string {
  if (typeof referrer !== "string" || !referrer) return "";
  try {
    const url = new URL(referrer);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const host = url.hostname.replace(/^www\./, "");
    const own = currentHost.replace(/^www\./, "");
    if (host === own) return "";
    return url.origin.slice(0, ATTRIBUTION_MAX_PARAM);
  } catch {
    return "";
  }
}

export function emptyUtm(): AttributionUtm {
  return { source: "", medium: "", campaign: "", term: "", content: "" };
}

export function createAttribution(href: string, referrer: string): Attribution {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { landingPage: "", referrer: "", utm: emptyUtm(), gclid: "", pages: [] };
  }
  const utm = emptyUtm();
  for (const key of UTM_KEYS) {
    utm[key] = sanitizeAttributionParam(url.searchParams.get(`utm_${key}`));
  }
  const landingPage = cleanPathname(url.pathname);
  return {
    landingPage,
    referrer: referrerOrigin(referrer, url.hostname),
    utm,
    gclid: sanitizeAttributionParam(url.searchParams.get("gclid"), 200),
    pages: landingPage ? [landingPage] : [],
  };
}

/** Appends a pathname once (deduplicated), capped at ATTRIBUTION_MAX_PAGES. */
export function addAttributionPage(
  attribution: Attribution,
  pathname: string,
): Attribution {
  const path = cleanPathname(pathname);
  if (!path || attribution.pages.includes(path)) return attribution;
  if (attribution.pages.length >= ATTRIBUTION_MAX_PAGES) return attribution;
  return { ...attribution, pages: [...attribution.pages, path] };
}

/** Validates a value read back from storage; returns null if unusable. */
export function parseStoredAttribution(raw: unknown): Attribution | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Attribution> | null;
    if (!data || typeof data !== "object") return null;
    const utm = emptyUtm();
    for (const key of UTM_KEYS) {
      utm[key] = sanitizeAttributionParam(data.utm?.[key]);
    }
    const pages = Array.isArray(data.pages)
      ? Array.from(new Set(data.pages.map(cleanPathname).filter(Boolean))).slice(
          0,
          ATTRIBUTION_MAX_PAGES,
        )
      : [];
    return {
      landingPage: cleanPathname(data.landingPage),
      referrer: sanitizeAttributionParam(data.referrer),
      utm,
      gclid: sanitizeAttributionParam(data.gclid, 200),
      pages,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Browser runtime (module state survives Next.js client-side navigation).
// ---------------------------------------------------------------------------

let current: Attribution | null = null;

function persist(consented: boolean) {
  try {
    if (consented && current) {
      window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(current));
    } else {
      window.sessionStorage.removeItem(ATTRIBUTION_STORAGE_KEY);
    }
  } catch {
    // Storage blocked: in-memory only.
  }
}

/** Records a page view; initialises first touch on the first call. */
export function recordAttributionPage(pathname: string, consented: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (!current) {
      let stored: Attribution | null = null;
      if (consented) {
        try {
          stored = parseStoredAttribution(
            window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY),
          );
        } catch {
          stored = null;
        }
      }
      current = stored || createAttribution(window.location.href, document.referrer);
    }
    current = addAttributionPage(current, pathname);
    persist(consented);
  } catch {
    // Attribution must never break navigation.
  }
}

/** Called when the cookie choice changes: write or wipe the session copy. */
export function syncAttributionStorage(consented: boolean) {
  if (typeof window === "undefined") return;
  persist(consented);
}

export function getAttribution(): Attribution | null {
  return current;
}

/** Fields sent with a lead submission. */
export function getAttributionPayload(): Attribution {
  if (current) return current;
  if (typeof window === "undefined") {
    return { landingPage: "", referrer: "", utm: emptyUtm(), gclid: "", pages: [] };
  }
  return createAttribution(window.location.href, document.referrer);
}

/** Current page as origin + pathname (no query string or hash). */
export function currentPageUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return `${window.location.origin}${cleanPathname(window.location.pathname)}`;
  } catch {
    return "";
  }
}

/** Test hook. */
export function resetAttributionForTests() {
  current = null;
}
