import { notFound } from "next/navigation";
import { buildInternalUrl } from "@/src/lib/paths";
import { Suspense, type ReactNode } from "react";
import ServicesElements from "@/app/[locale]/navigation";
import { getTranslations } from "@/src/lib/i18n";
import { localizePath } from "@/src/lib/paths";
import nextDynamic from "next/dynamic";
import ScrollToTop from "@/src/components/ScrollToTop";

const locales = ["en", "fr", "de", "es", "pt"] as const;
type Locale = (typeof locales)[number];
const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);
const Navbar = nextDynamic(
  () => import("@/src/components/navigation/NavbarClient"),
  { ssr: true }
);
const Footer = nextDynamic(() => import("@/app/[locale]/shared/footer"));

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Remove generateMetadata here to avoid alternates duplication; use per-page metadata utilities instead.

export default async function LocaleLayout(
  props: {
    children: ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;

  // Validate that the incoming `locale` parameter is valid
  if (!isLocale(locale)) {
    notFound();
  }

  const activeLocale: Locale = locale;

  // NOTE: Root layout (`app/layout.tsx`) is responsible for <html> and <body>.
  // Nested layouts must NOT render html/body. Keep this layout minimal so
  // providers (ThemeProvider) and NavBar remain singletons in the root.
  // Prepare server-side translated navigation labels and services list to avoid SSR key leakage
  const tNavbar = await getTranslations(activeLocale, "navbar");
  const tServices = await getTranslations(activeLocale, "servicesItems");
  const navData = {
    labels: {
      home: tNavbar("Home"),
      services: tNavbar("Services"),
      approach: tNavbar("Approach"),
      ressources: tNavbar("Ressources"),
      contact: tNavbar("Contact"),
      mobileNavigation: tNavbar("MobileNavigation"),
    },
    services: ServicesElements.map((service) => ({
      ...service,
      href: buildInternalUrl(service.href, activeLocale),
      title: tServices(service.titleKey),
      description: tServices(service.descriptionKey),
    })),
  };
  return (
    <div data-locale={activeLocale} lang={activeLocale}>
      <ScrollToTop />
      {/* Render client NavBar with server-provided locale */}
      <Navbar locale={activeLocale} navData={navData} />
      <main id="main-content" role="main">
        {children}
      </main>
      <Suspense fallback={<div className="h-64 bg-muted" aria-hidden="true" />}>
        <Footer locale={activeLocale} />
      </Suspense>
    </div>
  );
}
