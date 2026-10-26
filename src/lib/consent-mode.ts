/**
 * Google Consent Mode v2 helpers shared by the root layout bootstrap, the
 * cookie banner and the analytics helpers. Dependency-free so it can be unit
 * tested with `node --test`.
 *
 * Legal line (see privacy/cookie policy):
 * - EEA + UK: everything denied until the visitor accepts (opt-in).
 * - Switzerland: analytics measurement on by default, ad signals denied until
 *   the visitor accepts (Swiss information + opt-out; Google's EU user consent
 *   policy also covers CH for ad signals).
 * - Rest of world: granted by default, the visitor can refuse.
 * A stored choice always overrides the regional default.
 */

export const CONSENT_KEY = "cookieConsent";

/** Values written by current and older banner versions. */
export type StoredConsent = "accepted" | "minimal" | "declined";
/** Normalised choice: accepted = all granted, refused = all denied. */
export type ConsentChoice = "accepted" | "refused";

export type ConsentModeState = {
  ad_storage: "granted" | "denied";
  analytics_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
};

/** EEA member states (EU 27 + IS, LI, NO) and the United Kingdom. */
export const EEA_UK_REGIONS = [
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE", "GB",
] as const;

export function consentStateFor(granted: boolean): ConsentModeState {
  const value = granted ? "granted" : "denied";
  return {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  };
}

/** Maps any stored value (old or new) to a concrete choice, or null. */
export function normaliseStoredConsent(value: unknown): ConsentChoice | null {
  if (value === "accepted") return "accepted";
  if (value === "minimal" || value === "declined") return "refused";
  return null;
}

function isStoredConsent(value: unknown): value is StoredConsent {
  return value === "accepted" || value === "minimal" || value === "declined";
}

/**
 * Picks the stored choice from the cookie and the localStorage mirror.
 * The cookie carries the 12-month expiry stated in the cookies policy, so it
 * wins; the localStorage entry only counts where the browser cannot store
 * cookies at all. An expired cookie therefore means "undecided" again, and an
 * invalid localStorage value never hides a valid cookie (e.g. a refusal).
 */
export function pickStoredConsent(
  localValue: string | null,
  cookieValue: string | null,
  cookiesEnabled: boolean
): StoredConsent | null {
  if (isStoredConsent(cookieValue)) return cookieValue;
  if (!cookiesEnabled && isStoredConsent(localValue)) return localValue;
  return null;
}

/** Raw stored value (see pickStoredConsent). */
export function readStoredConsentValue(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  let localValue: string | null = null;
  let cookieValue: string | null = null;
  let cookiesEnabled = true;
  try {
    localValue = window.localStorage.getItem(CONSENT_KEY);
  } catch {
    localValue = null;
  }
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${CONSENT_KEY}=([^;]*)`),
    );
    cookieValue = match ? match[1] : null;
  } catch {
    cookieValue = null;
  }
  try {
    cookiesEnabled = navigator.cookieEnabled !== false;
  } catch {
    cookiesEnabled = true;
  }
  return pickStoredConsent(localValue, cookieValue, cookiesEnabled);
}

export function readConsentChoice(): ConsentChoice | null {
  return normaliseStoredConsent(readStoredConsentValue());
}

/** Sends a Consent Mode update for all four v2 keys. Never throws. */
export function updateConsentMode(choice: ConsentChoice) {
  try {
    if (typeof window === "undefined") return;
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;
    gtag("consent", "update", consentStateFor(choice === "accepted"));
  } catch {
    // Analytics must never surface errors to users.
  }
}

/**
 * GA client id ("<a>.<b>") from a `document.cookie` string ("_ga=GA1.1.<a>.<b>").
 * Used to join a lead sent by the visitor back to GA acquisition data.
 *
 * Returned whenever a valid _ga cookie exists and the stored choice is not a
 * refusal. Undecided visitors only carry a _ga cookie where the regional
 * default grants analytics storage (Switzerland, rest of world); EEA/UK
 * defaults deny it, so no cookie is set there before "accept". A refusal
 * always wins, even over a leftover cookie from an earlier "accept".
 */
export function gaClientIdFromCookies(
  cookies: string,
  choice: ConsentChoice | null
): string | undefined {
  if (choice === "refused") return undefined;
  const raw = cookies
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("_ga="))
    ?.slice("_ga=".length);
  if (!raw) return undefined;
  const parts = raw.split(".");
  if (parts.length < 4) return undefined;
  const clientId = parts.slice(-2).join(".");
  return /^\d+\.\d+$/.test(clientId) ? clientId : undefined;
}

const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

export function isValidMeasurementId(id: string | undefined | null): id is string {
  return typeof id === "string" && MEASUREMENT_ID_PATTERN.test(id);
}

/**
 * Inline script for the root layout. Runs before any gtag 'js'/'config' or
 * event: regional defaults (most specific region wins, no region = rest of
 * world), then the stored choice as an update, then gtag.js is injected.
 */
export function buildConsentBootstrap(measurementId: string): string {
  if (!isValidMeasurementId(measurementId)) {
    throw new Error(`Invalid GA4 measurement id: ${measurementId}`);
  }
  const denied = consentStateFor(false);
  const granted = consentStateFor(true);
  const ch = { ...denied, analytics_storage: "granted" as const };
  const id = JSON.stringify(measurementId);
  const key = JSON.stringify(CONSENT_KEY);
  return [
    "(function(){",
    "window.dataLayer=window.dataLayer||[];",
    "function gtag(){window.dataLayer.push(arguments);}",
    "window.gtag=gtag;",
    `gtag('consent','default',${JSON.stringify({ ...denied, region: EEA_UK_REGIONS })});`,
    `gtag('consent','default',${JSON.stringify({ ...ch, region: ["CH"] })});`,
    `gtag('consent','default',${JSON.stringify(granted)});`,
    "gtag('set','ads_data_redaction',true);",
    // Same rule as pickStoredConsent: the cookie wins, localStorage only
    // counts where cookies cannot be stored.
    "var c=null,l=null,ce=true;",
    "function ok(v){return v==='accepted'||v==='minimal'||v==='declined';}",
    `try{l=window.localStorage.getItem(${key});}catch(e){}`,
    `try{var m=document.cookie.match(/(?:^|; )${CONSENT_KEY}=([^;]*)/);if(m)c=m[1];}catch(e){}`,
    "try{ce=navigator.cookieEnabled!==false;}catch(e){}",
    "if(!ok(c)){c=(!ce&&ok(l))?l:null;}",
    `if(c==='accepted'){gtag('consent','update',${JSON.stringify(granted)});}`,
    `else if(c==='minimal'||c==='declined'){gtag('consent','update',${JSON.stringify(denied)});}`,
    "gtag('js',new Date());",
    `gtag('config',${id});`,
    "var s=document.createElement('script');s.async=true;",
    `s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(${id});`,
    "var cs=document.currentScript;if(cs&&cs.nonce)s.nonce=cs.nonce;",
    "(document.head||document.documentElement).appendChild(s);",
    "})();",
  ].join("");
}
