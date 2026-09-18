import Script from "next/script";

interface ArticleStructuredDataProps {
  title: string;
  description: string;
  author: string;
  authorUrl?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
  locale: string;
  nonce?: string;
}

export default function ArticleStructuredData({
  title,
  description,
  author,
  authorUrl,
  datePublished,
  dateModified,
  image,
  url,
  locale,
  nonce,
}: ArticleStructuredDataProps) {
  const breadcrumbLabels: Record<string, { home: string; resources: string }> = {
    fr: { home: "Accueil", resources: "Ressources" },
    en: { home: "Home", resources: "Resources" },
    de: { home: "Startseite", resources: "Ressourcen" },
    es: { home: "Inicio", resources: "Recursos" },
    pt: { home: "Início", resources: "Recursos" },
  };
  const labels = breadcrumbLabels[locale] || breadcrumbLabels.en;
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Ridger",
    url: "https://ridger.ch",
    logo: "https://ridger.ch/assets/ridger--color.svg",
    sameAs: ["https://www.linkedin.com/company/ridger/"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "26 Boulevard Georges Favon",
      addressLocality: "Genève",
      postalCode: "1204",
      addressCountry: "CH",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@ridger.ch",
      availableLanguage: ["fr", "en", "de", "es", "pt"],
    },
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description,
    author: {
      "@type": authorUrl ? "Person" : "Organization",
      name: author,
      ...(authorUrl && { url: authorUrl }),
    },
    publisher: {
      "@type": "Organization",
      name: "Ridger",
      logo: {
        "@type": "ImageObject",
        url: "https://ridger.ch/assets/ridger--color.svg",
      },
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(image && {
      image: {
        "@type": "ImageObject",
        url: image,
      },
    }),
    inLanguage: locale,
    about: [
      {
        "@type": "Thing",
        name: "Fiscalité Suisse",
      },
      {
        "@type": "Thing",
        name: "Comptabilité",
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.home,
        item: `https://ridger.ch/${locale}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: labels.resources,
        item: `https://ridger.ch/${locale}/ressources/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: url,
      },
    ],
  };

  return (
    <>
      <Script
        id="article-structured-data"
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleSchema),
        }}
      />
      <Script
        id="organization-structured-data"
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <Script
        id="breadcrumb-structured-data"
        type="application/ld+json"
        nonce={nonce}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
    </>
  );
}
