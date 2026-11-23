"use client";

/**
 * ConsentAnalytics Component
 *
 * GA4 is loaded for every visitor by the Consent Mode bootstrap in
 * app/layout.tsx; CookieConsent sends the consent updates. This component
 * only loads Google Tag Manager, and only after the visitor accepted (after
 * the load event, in idle time).
 *
 * GTM runs on its own dataLayer ("gtmDataLayer") so it never replays the
 * gtag queue collected before consent. Lead events are mirrored into that
 * layer by trackEvent() (src/lib/analytics.ts) while consent is accepted.
 */

import { useEffect, useState } from "react";
import {
  CONSENT_KEY,
  readStoredConsentValue,
  type StoredConsent,
} from "@/src/lib/consent-mode";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    gtmDataLayer?: any[];
  }
}

export const GTM_DATA_LAYER = "gtmDataLayer";

export type ConsentPref = StoredConsent | null;

export function getConsent(): ConsentPref {
  return readStoredConsentValue();
}

export default function ConsentAnalytics({
  gtmId,
  nonce,
}: {
  gtmId?: string;
  nonce?: string;
}) {
  const [consent, setConsent] = useState<ConsentPref>(null);
  const [gtmLoaded, setGtmLoaded] = useState(false);

  useEffect(() => {
    setConsent(getConsent());
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_KEY) setConsent(getConsent());
    };
    const onCustom = () => setConsent(getConsent());
    window.addEventListener("storage", onStorage);
    window.addEventListener("cookie-consent-changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cookie-consent-changed", onCustom);
    };
  }, []);

  useEffect(() => {
    if (consent !== "accepted" || gtmLoaded || !gtmId) return;
    if (!/^GTM-[A-Z0-9]{4,12}$/.test(gtmId)) return;
    const hasGtm = Array.from(document.scripts).some((s) =>
      s.src.includes("googletagmanager.com/gtm.js"),
    );
    if (hasGtm) return;
    let cancelled = false;
    const inject = () => {
      if (cancelled) return;
      if (Array.from(document.scripts).some((s) => s.src.includes("googletagmanager.com/gtm.js"))) return;
      const layer = (window[GTM_DATA_LAYER] = window[GTM_DATA_LAYER] || []);
      layer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      const gtmScript = document.createElement("script");
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}&l=${GTM_DATA_LAYER}`;
      if (nonce) gtmScript.setAttribute("nonce", nonce);
      document.head.appendChild(gtmScript);
      setGtmLoaded(true);
    };
    // gtm.js waits for the load event, then idle time (3 s at most). Events
    // pushed in the meantime stay queued in the layer.
    const idle = () => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(inject, { timeout: 3000 });
      else window.setTimeout(inject, 1);
    };
    if (document.readyState === "complete") idle();
    else window.addEventListener("load", idle, { once: true });
    return () => {
      cancelled = true;
      window.removeEventListener("load", idle);
    };
  }, [consent, gtmLoaded, gtmId, nonce]);

  return null;
}
