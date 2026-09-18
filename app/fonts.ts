import localFont from "next/font/local";

// Fraunces — display/heading serif, variable (opsz + wght axes), weights 300–600
export const fraunces = localFont({
  src: [
    {
      path: "../public/fonts/Fraunces-vf-latin.woff2",
      style: "normal",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
  weight: "300 600",
});

// Instrument Sans — body/UI sans, variable weight 400–700
export const instrumentSans = localFont({
  src: [
    {
      path: "../public/fonts/InstrumentSans-vf-latin.woff2",
      style: "normal",
    },
  ],
  variable: "--font-instrument-sans",
  display: "swap",
  preload: true,
  weight: "400 700",
});

// IBM Plex Mono — mono for labels, figures, nav labels
export const ibmPlexMono = localFont({
  src: [
    {
      path: "../public/fonts/IBMPlexMono-400-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/IBMPlexMono-500-latin.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  preload: false,
});

// Backward-compat export used by layout.tsx className/variable — maps to Instrument Sans
export const inter = {
  className: instrumentSans.className,
  variable: instrumentSans.variable,
} as const;
