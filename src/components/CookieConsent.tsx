"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CookieIcon } from "@/src/components/icons/CookieIcon";
import { cn } from "@/src/lib/utils";

type Props = {
  nonce?: string;
  locale?: string;
  labels: {
    Title: string;
    Text: string;
    LearnMore: string;
    Accept: string;
    Decline: string;
    Manage: string;
    Minimal?: string;
    Full?: string;
  };
};

type ConsentValue = "accepted" | "minimal" | "declined";

const CONSENT_KEY = "cookieConsent"; // values: "accepted" | "minimal" | "declined"
function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted" || v === "declined" || v === "minimal")
      return v as ConsentValue;
    return null;
  } catch (e) {
    // localStorage unavailable (private browsing, etc.)
    // Fallback: check cookie
    try {
      const cookieMatch = document.cookie.match(
        new RegExp(`(?:^|; )${CONSENT_KEY}=([^;]*)`),
      );
      if (cookieMatch) {
        const val = cookieMatch[1];
        if (val === "accepted" || val === "declined" || val === "minimal")
          return val as ConsentValue;
      }
    } catch {}
    return null;
  }
}

function setConsent(value: ConsentValue) {
  // Set cookie first (always works)
  const maxAge = 60 * 60 * 24 * 365; // 365 days
  try {
    document.cookie = `${CONSENT_KEY}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  } catch {}

  // Try localStorage as primary storage
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // localStorage blocked (private browsing mode) - cookie fallback is already set
  }
}

export default function CookieConsent({ nonce, locale = "fr", labels }: Props) {
  const [consent, setConsentState] = useState<ConsentValue | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const manageBtnRef = useRef<HTMLButtonElement | null>(null);
  const pathname = usePathname();
  const hideManageButton = /(^|\/)agent(\/|$)/.test(pathname || "");
  const cookieButtonPositionClasses =
    "fixed right-4 bottom-[var(--floating-whatsapp-bottom)] z-40 sm:right-6";
  const cookieButtonLayoutClasses =
    "flex size-12 items-center justify-center rounded-full";
  const cookieButtonColorClasses =
    "bg-brand text-foreground shadow-md transition-all duration-200";
  const cookieButtonHoverClasses =
    "hover:bg-brand-hover hover:text-white";
  const cookieButtonFocusClasses =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const focusWithoutScroll = (el: HTMLElement | null) => {
    if (!el) return;
    try {
      // @ts-ignore - older TS lib definitions miss FocusOptions
      el.focus({ preventScroll: true });
    } catch {
      const win = typeof window !== "undefined" ? window : null;
      const x = win?.scrollX ?? 0;
      const y = win?.scrollY ?? 0;
      el.focus?.();
      if (win && (win.scrollX !== x || win.scrollY !== y)) {
        win.scrollTo(x, y);
      }
    }
  };

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored === "declined") {
      setConsent("minimal");
      setConsentState("minimal");
    } else {
      setConsentState(stored);
    }
    const handler = () => setConsentState(null);
    window.addEventListener("open-cookie-settings", handler);
    return () => window.removeEventListener("open-cookie-settings", handler);
  }, []);
  // Minimal focus trap when the dialog is open
  useEffect(() => {
    if (consent !== null) return; // only when banner is visible
    const root = dialogRef.current;
    if (!root) return;
    const focusable = root.querySelectorAll<HTMLElement>(
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // Focus the first element but avoid scrolling the page to the bottom.
    focusWithoutScroll(first ?? null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (focusable.length === 0) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          focusWithoutScroll(last ?? null);
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          focusWithoutScroll(first ?? null);
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [consent]);

  const measurementId = useMemo(
    () =>
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      process.env.NEXT_PUBLIC_GA_ID ||
      "",
    [],
  );

  const applyGtagConsent = useCallback(
    (level: ConsentValue | null) => {
      if (
        typeof window === "undefined" ||
        !measurementId ||
        typeof (window as any).gtag !== "function"
      ) {
        return;
      }
      const gtag = (window as any).gtag as (...args: any[]) => void;
      if (level === "accepted") {
        gtag("consent", "update", {
          ad_storage: "granted",
          analytics_storage: "granted",
          functionality_storage: "granted",
          personalization_storage: "granted",
        });
        gtag("config", measurementId, {
          anonymize_ip: true,
          allow_google_signals: true,
          allow_ad_personalization_signals: true,
        });
      } else if (level === "minimal") {
        gtag("consent", "update", {
          ad_storage: "denied",
          analytics_storage: "denied",
          functionality_storage: "granted",
          personalization_storage: "denied",
        });
        gtag("config", measurementId, {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
      }
    },
    [measurementId],
  );

  useEffect(() => {
    if (consent === "accepted" || consent === "minimal") {
      applyGtagConsent(consent);
    }
  }, [consent, applyGtagConsent]);

  const accept = () => {
    setConsent("accepted");
    setConsentState("accepted");
    try {
      window.dispatchEvent(
        new CustomEvent("cookie-consent-changed", { detail: "accepted" }),
      );
    } catch {}
    applyGtagConsent("accepted");
    // Return focus to manage button for a11y
    setTimeout(() => focusWithoutScroll(manageBtnRef.current), 0);
  };
  const enableMinimal = () => {
    setConsent("minimal");
    setConsentState("minimal");
    try {
      window.dispatchEvent(
        new CustomEvent("cookie-consent-changed", { detail: "minimal" }),
      );
    } catch {}
    applyGtagConsent("minimal");
    setTimeout(() => focusWithoutScroll(manageBtnRef.current), 0);
  };

  const legalCookiesHref = `/${locale}/legal/cookies`;
  const minimalLabel =
    labels.Minimal || labels.Decline || "Essential + analytics";
  const fullLabel = labels.Full || labels.Accept || "Full consent";

  return (
    <>
      {/* Floating manage button: available after initial decision, and also before decision if user wants to open banner proactively. Hidden while banner is visible. */}
      {consent !== null && !hideManageButton && (
        <button
          type="button"
          ref={manageBtnRef}
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent("open-cookie-settings"));
            } catch {}
          }}
          className={cn(
            cookieButtonPositionClasses,
            cookieButtonLayoutClasses,
            cookieButtonColorClasses,
            cookieButtonHoverClasses,
            cookieButtonFocusClasses,
          )}
          aria-label={labels.Manage}
        >
          <CookieIcon className="size-6" />
          <span className="sr-only">{labels.Manage}</span>
        </button>
      )}

      {/* Load GA only when consent is accepted/minimal and measurement ID is configured */}
      {measurementId && (consent === "accepted" || consent === "minimal") ? (
        <>
          <Script
            nonce={nonce}
            id="ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
            strategy="afterInteractive"
            suppressHydrationWarning
          />
          <Script
            id="ga4-init"
            nonce={nonce}
            strategy="afterInteractive"
            suppressHydrationWarning
          >
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('consent', 'default', { 
                ad_storage: 'denied', 
                analytics_storage: 'denied',
                functionality_storage: 'granted',
                personalization_storage: 'denied'
              });
              gtag('config', '${measurementId}', { 
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
              });
            `}
          </Script>
        </>
      ) : null}

      {/* Banner */}
      {consent === null && (
        <div
          className="fixed inset-x-0 bottom-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
        >
          <div
            ref={dialogRef}
            className="mx-auto mb-4 max-w-4xl rounded-lg bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/75"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm leading-relaxed">
                <p id="cookie-consent-title" className="font-medium mb-1">
                  {labels.Title}
                </p>
                <p>
                  {labels.Text}{" "}
                  <Link
                    href={legalCookiesHref}
                    className="underline"
                    prefetch={false}
                  >
                    {labels.LearnMore}
                  </Link>
                  .
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={enableMinimal}
                  className="inline-flex items-center justify-center rounded-md bg-surface-warm px-3 py-2 text-sm shadow-sm hover:bg-muted"
                >
                  {minimalLabel}
                </button>
                <button
                  type="button"
                  onClick={accept}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
                >
                  {fullLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
