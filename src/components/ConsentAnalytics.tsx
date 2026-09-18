"use client";

/**
 * ConsentAnalytics Component
 *
 * Note: GA4 initialization and consent handling is now managed by CookieConsent.tsx.
 * This component handles GTM (Google Tag Manager) and Vercel Analytics after consent is granted.
 */

import { useEffect, useState } from "react";

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const CONSENT_KEY = "cookieConsent";

type ConsentPref = "accepted" | "minimal" | "declined" | null;

function getConsent(): ConsentPref {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined" || v === "minimal")
      return v as ConsentPref;
    return null;
  } catch (e) {
    // localStorage unavailable - check cookie fallback
    try {
      const cookieMatch = document.cookie.match(
        new RegExp(`(?:^|; )${CONSENT_KEY}=([^;]*)`)
      );
      if (cookieMatch) {
        const val = cookieMatch[1];
        if (val === "accepted" || val === "declined" || val === "minimal")
          return val as ConsentPref;
      }
    } catch {}
    return null;
  }
}

export default function ConsentAnalytics({
  gaId, // Not used in this component - GA4 is handled by CookieConsent.tsx
  gtmId,
  nonce,
}: {
  gaId: string;
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
    const onCustom = (e: Event) => {
      // custom event dispatched by CookieConsent after user action
      const val = (e as CustomEvent).detail;
      if (
        val === "accepted" ||
        val === "declined" ||
        val === "minimal" ||
        val === null
      ) {
        setConsent(val);
      } else {
        setConsent(getConsent());
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(
      "cookie-consent-changed",
      onCustom as EventListener
    );
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "cookie-consent-changed",
        onCustom as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (consent === "accepted" && !gtmLoaded) {
      // Load Google Tag Manager only after consent
      if (gtmId && typeof window !== "undefined") {
        // Avoid duplicating GTM injection
        const hasGtm = Array.from(document.scripts).some((s) =>
          s.src.includes("googletagmanager.com/gtm.js")
        );
        if (!hasGtm) {
          // Setup dataLayer and push gtm.start event
          (window as any).dataLayer = (window as any).dataLayer || [];
          (window as any).dataLayer.push({
            "gtm.start": new Date().getTime(),
            event: "gtm.js",
          });
          // Send consent update for GTM
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("consent", "update", {
              ad_storage: "granted",
              analytics_storage: "granted",
              functionality_storage: "granted",
              personalization_storage: "granted",
            });
          }
          const gtmScript = document.createElement("script");
          gtmScript.async = true;
          gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
          if (nonce) {
            gtmScript.setAttribute("nonce", nonce);
          }
          document.head.appendChild(gtmScript);
          setGtmLoaded(true);
        }
      }
    }
  }, [consent, gtmLoaded, gtmId, nonce]);

  return null;
}
