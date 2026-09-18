"use client";

/**
 * Safe GA4 event helper.
 *
 * gtag is only present after the user has made a cookie choice ("accepted" or
 * "minimal" — see CookieConsent). Under "minimal", analytics_storage stays
 * denied and events go out as cookieless Consent Mode pings, which is the
 * intended behavior. Before any choice, events are dropped.
 *
 * Never let analytics break product flows: this must not throw, and callers
 * must invoke it only after their own critical work succeeded.
 */
export type AnalyticsParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params?: AnalyticsParams) {
  try {
    if (typeof window === "undefined") return;
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== "function") return;
    gtag("event", name, { transport_type: "beacon", ...params });
  } catch {
    // Analytics must never surface errors to users.
  }
}

/**
 * GA client id from the first-party `_ga` cookie ("GA1.1.<a>.<b>" → "<a>.<b>").
 * Only exists once the user accepted analytics cookies, so sending it to the
 * CRM is inherently consent-gated. Used to join CRM lead outcomes back to GA
 * acquisition data (offline conversion import).
 */
export function getGaClientId(): string | undefined {
  try {
    if (typeof document === "undefined") return undefined;
    // A leftover _ga cookie does not prove current consent: the user may have
    // downgraded to "minimal" after accepting. Only forward the id while full
    // analytics consent is active (same key/values as CookieConsent).
    let consent: string | null = null;
    try {
      consent = window.localStorage.getItem("cookieConsent");
    } catch {
      consent = null;
    }
    if (!consent) {
      consent =
        document.cookie
          .split("; ")
          .find((entry) => entry.startsWith("cookieConsent="))
          ?.slice("cookieConsent=".length) ?? null;
    }
    if (consent !== "accepted") return undefined;
    const raw = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith("_ga="))
      ?.slice("_ga=".length);
    if (!raw) return undefined;
    const parts = raw.split(".");
    if (parts.length < 4) return undefined;
    const clientId = parts.slice(-2).join(".");
    return /^\d+\.\d+$/.test(clientId) ? clientId : undefined;
  } catch {
    return undefined;
  }
}
