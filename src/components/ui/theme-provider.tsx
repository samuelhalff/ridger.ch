"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import { ReactNode } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  nonce?: string;
}

export default function ThemeProvider({
  children,
  nonce,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      nonce={nonce}
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}
