"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  recordAttributionPage,
  syncAttributionStorage,
} from "@/src/lib/attribution";
import { readConsentChoice } from "@/src/lib/consent-mode";

/**
 * Keeps the first-party lead attribution (src/lib/attribution.ts) up to date
 * across client-side navigation. Session storage is used only while the
 * visitor has accepted cookies.
 */
export default function AttributionTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordAttributionPage(pathname || "/", readConsentChoice() === "accepted");
  }, [pathname]);

  useEffect(() => {
    const onChange = () =>
      syncAttributionStorage(readConsentChoice() === "accepted");
    window.addEventListener("cookie-consent-changed", onChange);
    return () => window.removeEventListener("cookie-consent-changed", onChange);
  }, []);

  return null;
}
