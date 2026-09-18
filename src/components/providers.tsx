// This is the most important part: mark this component as a client component.
"use client";

import ThemeProvider from "@/src/components/ui/theme-provider";
import React from "react";

// Keep providers minimal to reduce baseline JS. Client i18n is initialized only
// in components that actually use it (see translated-* and pages that call useTranslation).
export function Providers({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  return (
    <ThemeProvider nonce={nonce}>{children}</ThemeProvider>
  );
}
