// app/layout.tsx
import { Providers } from "@/src/components/providers";
import { Metadata, Viewport } from "next";
import { buildOrganizationGraph } from "@/src/lib/structuredData";
import { inter, fraunces, instrumentSans, ibmPlexMono } from "./fonts";
import { headers } from "next/headers";
import Defer from "@/src/components/Defer";
import ErrorBoundary from "@/src/components/ErrorBoundary";
import { CookieConsent } from "@/src/components/ClientOnlyDynamic";
import ConsentAnalytics from "@/src/components/ConsentAnalytics";
import WhatsAppLink from "@/src/components/ui/whatsapp-link";
import {
  WHATSAPP_BADGE_FALLBACK,
  WHATSAPP_CTA_FALLBACK,
} from "@/src/lib/whatsapp";
import "./globals.css";
import { getTranslations, getCurrentLocale } from "@/src/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://ridger.ch"
  ),
  // No title template: every page sets its full title (brand included) via
  // src/translations/<locale>/metadata.json, so a template would double the brand.
  title: "Ridger - Swiss Multi-Family Office",
  description:
    "Digital-first Swiss multi-family office. Accounting, tax, payroll, corporate administration and family office coordination for entrepreneurs, families and international companies.",
  keywords:
    "multi-family office, accounting, tax services, Switzerland, corporate services, payroll, domiciliation",
  authors: [{ name: "Ridger" }],
  creator: "Ridger",
  publisher: "Ridger",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180", type: "image/png" }],
  },
  other: {},
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ read nonce and UA headers from the middleware
  const nonce = (await headers()).get("x-nonce") || undefined;
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "";
  const currentLocale = await getCurrentLocale();

  const tCookie = await getTranslations(currentLocale, "cookie");
  const tContact = await getTranslations(currentLocale, "contact");
  const whatsappLabels = {
    badge: (tContact("WhatsApp.Badge") as string) || WHATSAPP_BADGE_FALLBACK,
    cta: (tContact("WhatsApp.Open") as string) || WHATSAPP_CTA_FALLBACK,
  } as const;
  const cookieLabels = {
    Title: tCookie("Title"),
    Text: tCookie("Text"),
    LearnMore: tCookie("LearnMore"),
    Accept: tCookie("Accept"),
    Decline: tCookie("Decline"),
    Manage: tCookie("Manage"),
  } as const;

  const organizationGraphJsonLd = buildOrganizationGraph(currentLocale);

  return (
    <html
      suppressHydrationWarning
      lang={currentLocale}
      className={`${inter.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <meta httpEquiv="Accept-CH" content="Sec-CH-Prefers-Color-Scheme" />
        <link
          rel="preload"
          href="/fonts/InstrumentSans-vf-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/abstract-background-light.avif"
          as="image"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/assets/abstract-background-dark.avif"
          as="image"
          fetchPriority="high"
        />
      </head>

      <body className={instrumentSans.className}>
        {/* ✅ expose nonce to client so dynamic scripts can reuse it */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.__CSP_NONCE__ = ${JSON.stringify(nonce)};`,
          }}
        />

        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[999] focus:w-auto focus:h-auto focus:px-5 focus:py-3 focus:rounded-lg bg-primary text-primary-foreground focus:shadow-xl"
        >
          Skip to content
        </a>

        {/* ✅ All inline JSON-LD scripts keep the same nonce */}
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationGraphJsonLd),
          }}
        />

        <Providers nonce={nonce}>
          <ErrorBoundary>
            <div className="text-foreground">
              {children}

              <WhatsAppLink
                badgeText={whatsappLabels.badge}
                ctaLabel={whatsappLabels.cta}
              />

              <CookieConsent
                nonce={nonce}
                locale={currentLocale}
                labels={cookieLabels}
              />

              <Defer rootMargin="0px" idle={200} placeholder={null}>
                <ConsentAnalytics
                  gaId={gaId}
                  gtmId={process.env.NEXT_PUBLIC_GTM_ID || ""}
                  nonce={nonce}
                />
              </Defer>
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
