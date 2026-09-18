/**
 * Structured Data (JSON-LD) builder utilities.
 * Keep objects small & serialisable – we only assemble plain JSON here.
 * All functions return POJOs ready to be stringified.
 */

import type { Locale } from "./i18n-locales";
import { localizePath } from "./paths";

export interface FAQEntry {
  question: string;
  answer: string;
}

type JsonLdNode = Record<string, unknown>;

export function buildFAQPage(entries: FAQEntry[], limit?: number) {
  const list = entries
    .filter((e) => e.question && e.answer)
    .slice(0, limit || entries.length)
    .map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: { "@type": "Answer", text: e.answer },
    }));
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: list,
  } as const;
}

export interface HowToStep {
  name: string;
  text?: string;
  /** Optional extra details (e.g. tools, supplies) appended for later enrichment */
  image?: string;
  url?: string;
  /** Estimated time in ISO 8601 duration (e.g. PT10M) */
  estimatedTime?: string;
}

export interface HowToConfig {
  name: string;
  description: string;
  steps: HowToStep[];
  /** Total estimated time (ISO 8601) */
  totalTime?: string;
  /** Tools used across the process */
  tools?: string[];
  /** Supplies / materials required */
  supplies?: string[];
  /** Overall cost description */
  estimatedCost?: { currency: string; value: string; name?: string };
}

export function buildHowTo(cfg: HowToConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: cfg.name,
    description: cfg.description,
    ...(cfg.totalTime ? { totalTime: cfg.totalTime } : {}),
    ...(cfg.estimatedCost
      ? {
          estimatedCost: {
            "@type": "MonetaryAmount",
            currency: cfg.estimatedCost.currency,
            value: cfg.estimatedCost.value,
            ...(cfg.estimatedCost.name ? { name: cfg.estimatedCost.name } : {}),
          },
        }
      : {}),
    ...(cfg.tools
      ? { tool: cfg.tools.map((t) => ({ "@type": "HowToTool", name: t })) }
      : {}),
    ...(cfg.supplies
      ? {
          supply: cfg.supplies.map((s) => ({
            "@type": "HowToSupply",
            name: s,
          })),
        }
      : {}),
    step: cfg.steps.map((s, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: s.name,
      ...(s.text ? { text: s.text } : {}),
      ...(s.image ? { image: s.image } : {}),
      ...(s.url ? { url: s.url } : {}),
      ...(s.estimatedTime ? { estimatedTime: s.estimatedTime } : {}),
    })),
  } as const;
}

export interface BreadcrumbItem {
  name: string;
  item: string; // absolute URL
}

export function buildBreadcrumbList(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  } as const;
}

export const arkOrganization = {
  name: "Ridger",
  legalName: "Ark Fiduciaire SA",
  alternateName: ["Ridger", "Ridger — Ark Fiduciaire SA"],
  url: "https://ridger.ch",
  logo: "https://ridger.ch/assets/ridger--color.svg",
  telephone: "+41 22 512 50 50",
  email: "info@ridger.ch",
  address: {
    streetAddress: "26 Boulevard Georges Favon",
    postalCode: "1204",
    addressLocality: "Genève",
    addressRegion: "GE",
    addressCountry: "CH",
  },
  geo: {
    latitude: 46.2021556,
    longitude: 6.1399595,
  },
  openingHours: {
    opens: "09:00",
    closes: "17:30",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  },
  // Ridger's own profiles only — never Ark's Maps/UID identifiers, so Google
  // keeps the two brands as distinct entities (affiliation is expressed via
  // parentOrganization below, not sameAs equivalence).
  sameAs: ["https://www.linkedin.com/company/ridger/"],
  languages: ["fr", "en", "de", "es", "pt"],
  knowsAbout: [
    "Multi-family office",
    "Consolidated wealth reporting",
    "Investment oversight",
    "Family governance",
    "Succession planning",
    "Swiss tax compliance coordination",
    "Administrative oversight",
    "Swiss data residency",
    "Time-weighted return reporting",
    "Fee transparency",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    telephone: "+41 22 512 50 50",
    email: "info@ridger.ch",
    availableLanguage: ["fr", "en", "de", "es", "pt"],
  },
} as const;

export const arkEntityIds = {
  graph: `${arkOrganization.url}/#graph`,
  organization: `${arkOrganization.url}/#organization`,
  website: `${arkOrganization.url}/#website`,
  place: `${arkOrganization.url}/#place-geneva-office`,
  areaGeneva: `${arkOrganization.url}/#area-geneve`,
  serviceReporting: `${arkOrganization.url}/#service-consolidated-reporting`,
  serviceOversight: `${arkOrganization.url}/#service-investment-oversight`,
  serviceCoordination: `${arkOrganization.url}/#service-family-office-coordination`,
  serviceGovernance: `${arkOrganization.url}/#service-governance-succession`,
  serviceTaxAdmin: `${arkOrganization.url}/#service-tax-administration`,
  serviceVault: `${arkOrganization.url}/#service-digital-vault`,
} as const;

function buildAdministrativeAreaGeneva() {
  return {
    "@type": "AdministrativeArea",
    "@id": arkEntityIds.areaGeneva,
    name: "Genève",
    containedInPlace: {
      "@type": "Country",
      name: "Switzerland",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: arkOrganization.geo.latitude,
      longitude: arkOrganization.geo.longitude,
    },
  } as const;
}

function buildArkServiceNodes(locale: string) {
  const baseLocaleUrl = `${arkOrganization.url}/${locale}`;
  const areaServed = [{ "@id": arkEntityIds.areaGeneva }, { "@type": "Country", name: "Switzerland" }];
  const fr = locale === "fr";

  return [
    {
      "@type": "FinancialService",
      "@id": arkEntityIds.serviceReporting,
      name: fr ? "Reporting consolidé" : "Consolidated reporting",
      serviceType: fr
        ? "Reporting patrimonial consolidé indépendant"
        : "Independent consolidated wealth reporting",
      areaServed,
      provider: { "@id": arkEntityIds.organization },
      url: `${baseLocaleUrl}${localizePath("/services/consolidated-reporting", locale as Locale)}/`,
    },
    {
      "@type": "FinancialService",
      "@id": arkEntityIds.serviceOversight,
      name: fr ? "Surveillance des investissements" : "Investment oversight",
      serviceType: fr
        ? "Surveillance des mandats et des gérants"
        : "Oversight of mandates and managers",
      areaServed,
      provider: { "@id": arkEntityIds.organization },
      url: `${baseLocaleUrl}${localizePath("/services/investment-oversight", locale as Locale)}/`,
    },
    {
      "@type": "ProfessionalService",
      "@id": arkEntityIds.serviceCoordination,
      name: fr ? "Coordination family office" : "Family office coordination",
      serviceType: fr
        ? "Coordination des conseillers de la famille"
        : "Coordination of the family's advisors",
      areaServed,
      provider: { "@id": arkEntityIds.organization },
      url: `${baseLocaleUrl}${localizePath("/services/family-office-coordination", locale as Locale)}/`,
    },
    {
      "@type": "ProfessionalService",
      "@id": arkEntityIds.serviceGovernance,
      name: fr ? "Gouvernance et succession" : "Governance and succession",
      serviceType: fr
        ? "Gouvernance familiale et planification successorale"
        : "Family governance and succession planning",
      areaServed,
      provider: { "@id": arkEntityIds.organization },
      url: `${baseLocaleUrl}${localizePath("/services/governance-succession", locale as Locale)}/`,
    },
    {
      "@type": "ProfessionalService",
      "@id": arkEntityIds.serviceTaxAdmin,
      name: fr ? "Fiscalité et administration" : "Tax and administration",
      serviceType: fr
        ? "Coordination fiscale et supervision administrative"
        : "Tax compliance coordination and administrative oversight",
      areaServed,
      provider: { "@id": arkEntityIds.organization },
      url: `${baseLocaleUrl}${localizePath("/services/tax-administration", locale as Locale)}/`,
    },
    {
      "@type": "ProfessionalService",
      "@id": arkEntityIds.serviceVault,
      name: fr ? "Coffre-fort numérique" : "Digital vault",
      serviceType: fr
        ? "Coffre-fort documentaire chiffré, données en Suisse"
        : "Encrypted document vault with Swiss data residency",
      areaServed,
      provider: { "@id": arkEntityIds.organization },
      url: `${baseLocaleUrl}${localizePath("/services/digital-vault", locale as Locale)}/`,
    },
  ] as const;
}

export function getArkServiceEntityId(
  key:
    | "consolidated-reporting"
    | "investment-oversight"
    | "family-office-coordination"
    | "governance-succession"
    | "tax-administration"
    | "digital-vault"
    // Legacy keys retained for existing article schema references.
    | "accounting"
    | "odoo"
    | "incorporation",
) {
  switch (key) {
    case "investment-oversight":
      return arkEntityIds.serviceOversight;
    case "family-office-coordination":
      return arkEntityIds.serviceCoordination;
    case "governance-succession":
      return arkEntityIds.serviceGovernance;
    case "tax-administration":
    case "accounting":
      return arkEntityIds.serviceTaxAdmin;
    case "digital-vault":
      return arkEntityIds.serviceVault;
    case "odoo":
    case "incorporation":
    case "consolidated-reporting":
    default:
      return arkEntityIds.serviceReporting;
  }
}

export function buildOrganizationGraph(locale: string = "fr") {
  const serviceNodes = buildArkServiceNodes(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildAdministrativeAreaGeneva(),
      {
        "@type": "Place",
        "@id": arkEntityIds.place,
        name:
          locale === "fr"
            ? "Bureau Ridger Genève"
            : "Ridger Geneva office",
        address: {
          "@type": "PostalAddress",
          ...arkOrganization.address,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: arkOrganization.geo.latitude,
          longitude: arkOrganization.geo.longitude,
        },
      },
      {
        "@type": ["ProfessionalService", "FinancialService"],
        "@id": arkEntityIds.organization,
        name: arkOrganization.name,
        legalName: arkOrganization.legalName,
        alternateName: arkOrganization.alternateName,
        url: arkOrganization.url,
        logo: arkOrganization.logo,
        image: arkOrganization.logo,
        telephone: arkOrganization.telephone,
        email: arkOrganization.email,
        contactPoint: arkOrganization.contactPoint,
        // The UID belongs to the operating company, expressed as its own
        // entity so Google never merges Ridger with the Ark listing.
        parentOrganization: {
          "@type": "Organization",
          name: "Ark Fiduciaire SA",
          url: "https://ark-fid.ch",
          taxID: "CHE-193.650.350",
        },
        foundingLocation: {
          "@id": arkEntityIds.place,
        },
        location: {
          "@id": arkEntityIds.place,
        },
        address: {
          "@type": "PostalAddress",
          ...arkOrganization.address,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: arkOrganization.geo.latitude,
          longitude: arkOrganization.geo.longitude,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: arkOrganization.openingHours.dayOfWeek,
          opens: arkOrganization.openingHours.opens,
          closes: arkOrganization.openingHours.closes,
        },
        areaServed: [
          { "@id": arkEntityIds.areaGeneva },
          { "@type": "Country", name: "Switzerland" },
        ],
        knowsAbout: arkOrganization.knowsAbout,
        sameAs: arkOrganization.sameAs,
        knowsLanguage: arkOrganization.languages,
        description:
          locale === "fr"
            ? "Ridger est un multi family office digital basé à Genève : reporting consolidé, surveillance des investissements, coordination et supervision administrative. Ridger ne gère pas d'actifs."
            : "Ridger is a digital-first multi-family office based in Geneva: consolidated reporting, investment oversight, coordination and administrative oversight. Ridger does not manage assets.",
      },
      {
        "@type": "WebSite",
        "@id": arkEntityIds.website,
        url: arkOrganization.url,
        name: arkOrganization.name,
        publisher: { "@id": arkEntityIds.organization },
        inLanguage: locale,
        about: [
          { "@id": arkEntityIds.organization },
          { "@id": arkEntityIds.serviceReporting },
          { "@id": arkEntityIds.serviceOversight },
          { "@id": arkEntityIds.serviceCoordination },
        ],
      },
      ...serviceNodes,
    ],
  } as const;
}

export interface PersonSchemaConfig {
  id: string;
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  url: string;
  sameAs?: string[];
  knowsLanguage?: string[];
  alumniOf?: string[];
  memberOf?: string[];
  knowsAbout?: string[];
}

export function buildPersonSchema(cfg: PersonSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": cfg.id,
    name: cfg.name,
    ...(cfg.jobTitle ? { jobTitle: cfg.jobTitle } : {}),
    ...(cfg.description ? { description: cfg.description } : {}),
    ...(cfg.image ? { image: cfg.image } : {}),
    url: cfg.url,
    worksFor: {
      "@type": "Organization",
      "@id": `${arkOrganization.url}/#organization`,
      name: arkOrganization.name,
      url: arkOrganization.url,
    },
    ...(cfg.sameAs?.length ? { sameAs: cfg.sameAs } : {}),
    ...(cfg.knowsLanguage?.length ? { knowsLanguage: cfg.knowsLanguage } : {}),
    ...(cfg.knowsAbout?.length ? { knowsAbout: cfg.knowsAbout } : {}),
    ...(cfg.alumniOf?.length
      ? {
          alumniOf: cfg.alumniOf.map((name) => ({
            "@type": "EducationalOrganization",
            name,
          })),
        }
      : {}),
    ...(cfg.memberOf?.length
      ? {
          memberOf: cfg.memberOf.map((name) => ({
            "@type": "Organization",
            name,
          })),
        }
      : {}),
  } as const;
}

export interface ArticleSchemaConfig {
  schemaType?: "Article" | "BlogPosting" | "TechArticle";
  headline: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  authorUrl?: string;
  publisherName?: string;
  image?: string;
  url: string;
  locale: string;
  section?: string;
  keywords?: string[];
  timeRequired?: string;
  about?: Array<Record<string, unknown>>;
  isPartOf?: Record<string, unknown>;
}

export function buildArticleSchema(cfg: ArticleSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": cfg.schemaType || "Article",
    headline: cfg.headline,
    ...(cfg.description ? { description: cfg.description } : {}),
    ...(cfg.author
      ? {
          author: {
            "@type": cfg.authorUrl ? "Person" : "Organization",
            name: cfg.author,
            ...(cfg.authorUrl ? { url: cfg.authorUrl } : {}),
          },
        }
      : {}),
    publisher: {
      "@type": "Organization",
      "@id": `${arkOrganization.url}/#organization`,
      name: cfg.publisherName || arkOrganization.name,
      logo: {
        "@type": "ImageObject",
        url: arkOrganization.logo,
      },
    },
    ...(cfg.datePublished ? { datePublished: cfg.datePublished } : {}),
    dateModified: cfg.dateModified || cfg.datePublished,
    url: cfg.url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": cfg.url,
    },
    inLanguage: cfg.locale,
    ...(cfg.image
      ? {
          image: {
            "@type": "ImageObject",
            url: cfg.image,
          },
        }
      : {}),
    ...(cfg.section ? { articleSection: cfg.section } : {}),
    ...(cfg.keywords?.length ? { keywords: cfg.keywords.join(", ") } : {}),
    ...(cfg.timeRequired ? { timeRequired: cfg.timeRequired } : {}),
    ...(cfg.about?.length ? { about: cfg.about } : {}),
    ...(cfg.isPartOf ? { isPartOf: cfg.isPartOf } : {}),
  } as const;
}

export function buildWebSiteSearchAction(siteUrl: string) {
  // Potential future enhancement – not wired yet.
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  } as const;
}

export interface ServiceSchemaConfig {
  id?: string;
  name: string;
  description: string;
  serviceType?: string;
  url: string; // absolute URL
  areaServed?: Array<string | JsonLdNode>;
  provider?:
    | { "@id": string }
    | { name: string; url?: string; logo?: string };
  offers?: JsonLdNode | JsonLdNode[];
  schemaType?: "Service" | "ProfessionalService" | "AccountingService";
}

export function buildServiceSchema(cfg: ServiceSchemaConfig) {
  return {
    "@context": "https://schema.org",
    "@type": cfg.schemaType || "Service",
    ...(cfg.id ? { "@id": cfg.id } : {}),
    name: cfg.name,
    description: cfg.description,
    ...(cfg.serviceType ? { serviceType: cfg.serviceType } : {}),
    url: cfg.url,
    ...(cfg.areaServed ? { areaServed: cfg.areaServed } : {}),
    ...(cfg.provider
      ? {
          provider:
            "@id" in cfg.provider
              ? cfg.provider
              : {
                  "@type": "Organization",
                  name: cfg.provider.name,
                  ...(cfg.provider.url ? { url: cfg.provider.url } : {}),
                  ...(cfg.provider.logo ? { logo: cfg.provider.logo } : {}),
                },
        }
      : {}),
    ...(cfg.offers
      ? {
          offers: cfg.offers,
        }
      : {}),
  } as const;
}

export interface LocalBusinessConfig {
  name: string;
  description: string;
  url: string;
  logo: string;
  telephone?: string;
  email: string;
  address: {
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
    addressCountry: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  areaServed?: string[];
  sameAs?: string[]; // Social media profiles, Google Maps, etc.
}

export function buildLocalBusiness(cfg: LocalBusinessConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": cfg.url,
    name: cfg.name,
    description: cfg.description,
    url: cfg.url,
    logo: cfg.logo,
    ...(cfg.telephone ? { telephone: cfg.telephone } : {}),
    email: cfg.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: cfg.address.streetAddress,
      postalCode: cfg.address.postalCode,
      addressLocality: cfg.address.addressLocality,
      addressCountry: cfg.address.addressCountry,
    },
    ...(cfg.geo
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: cfg.geo.latitude,
            longitude: cfg.geo.longitude,
          },
        }
      : {}),
    ...(cfg.openingHours ? { openingHours: cfg.openingHours } : {}),
    ...(cfg.priceRange ? { priceRange: cfg.priceRange } : {}),
    ...(cfg.areaServed ? { areaServed: cfg.areaServed } : {}),
    ...(cfg.sameAs ? { sameAs: cfg.sameAs } : {}),
  } as const;
}

export interface AccountingServiceConfig {
  name: string;
  description: string;
  serviceType: string;
  url: string; // absolute URL
  areaServed?: string[];
  provider?: {
    name: string;
    url: string;
    telephone?: string;
    email?: string;
    address?: {
      streetAddress: string;
      postalCode: string;
      addressLocality: string;
      addressCountry: string;
    };
  };
  offers?: {
    description: string;
    priceRange?: string;
  };
}

export function buildAccountingService(cfg: AccountingServiceConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "AccountingService",
    serviceType: cfg.serviceType,
    name: cfg.name,
    description: cfg.description,
    url: cfg.url,
    ...(cfg.areaServed ? { areaServed: cfg.areaServed } : {}),
    ...(cfg.provider
      ? {
          provider: {
            "@type": "ProfessionalService",
            name: cfg.provider.name,
            url: cfg.provider.url,
            ...(cfg.provider.telephone
              ? { telephone: cfg.provider.telephone }
              : {}),
            ...(cfg.provider.email ? { email: cfg.provider.email } : {}),
            ...(cfg.provider.address
              ? {
                  address: {
                    "@type": "PostalAddress",
                    streetAddress: cfg.provider.address.streetAddress,
                    postalCode: cfg.provider.address.postalCode,
                    addressLocality: cfg.provider.address.addressLocality,
                    addressCountry: cfg.provider.address.addressCountry,
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(cfg.offers
      ? {
          offers: {
            "@type": "Offer",
            description: cfg.offers.description,
            ...(cfg.offers.priceRange
              ? { priceRange: cfg.offers.priceRange }
              : {}),
          },
        }
      : {}),
  } as const;
}

export interface SoftwareApplicationConfig {
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  author?: {
    name: string;
    url?: string;
  };
}

export function buildSoftwareApplication(cfg: SoftwareApplicationConfig) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: cfg.name,
    description: cfg.description,
    applicationCategory: cfg.applicationCategory,
    ...(cfg.operatingSystem ? { operatingSystem: cfg.operatingSystem } : {}),
    ...(cfg.offers
      ? {
          offers: {
            "@type": "Offer",
            price: cfg.offers.price,
            priceCurrency: cfg.offers.priceCurrency,
          },
        }
      : {}),
    ...(cfg.author
      ? {
          author: {
            "@type": "Organization",
            name: cfg.author.name,
            ...(cfg.author.url ? { url: cfg.author.url } : {}),
          },
        }
      : {}),
  } as const;
}
