"use client";

import { readConsentChoice } from "@/src/lib/consent-mode";

/**
 * Safe GA4 event helper.
 *
 * gtag is defined for every visitor by the Consent Mode bootstrap in
 * app/layout.tsx. Whether an event sets cookies or goes out as a cookieless
 * ping is decided by the consent state (regional default or the visitor's
 * choice), not here.
 *
 * Never let analytics break product flows: this must not throw, and callers
 * must invoke it only after their own critical work succeeded.
 */
export type AnalyticsParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params?: AnalyticsParams) {
  if (name === "generate_lead") mirrorToGtm(name, params);
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
 * GTM has its own dataLayer (see ConsentAnalytics) that only exists after the
 * visitor accepted; lead events are copied there while consent is active.
 */
function mirrorToGtm(name: string, params?: AnalyticsParams) {
  try {
    if (typeof window === "undefined") return;
    const layer = (window as { gtmDataLayer?: unknown[] }).gtmDataLayer;
    if (!Array.isArray(layer) || readConsentChoice() !== "accepted") return;
    layer.push({ event: name, ...params });
  } catch {
    // Analytics must never surface errors to users.
  }
}

/**
 * GA client id from the first-party `_ga` cookie ("GA1.1.<a>.<b>" → "<a>.<b>").
 * The cookie can also exist under a regional opt-out default (CH, rest of
 * world), but it is only forwarded after an explicit "accept".
 */
export function getGaClientId(): string | undefined {
  try {
    if (typeof document === "undefined") return undefined;
    // A leftover _ga cookie does not prove current consent: the user may have
    // refused after accepting. Only forward the id while the visitor has
    // explicitly accepted (regional defaults do not count).
    if (readConsentChoice() !== "accepted") return undefined;
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
