const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

const LOCALES = ["fr", "en", "de", "es", "pt"];

// Localized service slugs per locale → canonical (English) route directory.
// Must stay in sync with src/lib/paths.ts (scripts/redirect-destinations.test.js
// asserts both directions).
const serviceSlugMap = {
  fr: {
    "reporting-consolide": "consolidated-reporting",
    "surveillance-investissements": "investment-oversight",
    "coordination-family-office": "family-office-coordination",
    "gouvernance-succession": "governance-succession",
    "fiscalite-administration": "tax-administration",
    "coffre-fort-numerique": "digital-vault",
    "immobilier-transactions": "real-estate-transactions",
    "personnel-maison-salaires": "household-staff",
    "installation-permis-sejour": "relocation-residence",
    "domiciliation-courrier": "domiciliation-mail",
    "gerance-immobiliere": "property-management",
  },
  de: {
    "konsolidiertes-reporting": "consolidated-reporting",
    "anlageueberwachung": "investment-oversight",
    "family-office-koordination": "family-office-coordination",
    "governance-nachfolge": "governance-succession",
    "steuerverwaltung": "tax-administration",
    "digitaler-tresor": "digital-vault",
    "immobilien-transaktionen": "real-estate-transactions",
    "hauspersonal-lohn": "household-staff",
    "umzug-aufenthaltsbewilligung": "relocation-residence",
    "domizil-postverwaltung": "domiciliation-mail",
    "liegenschaftsverwaltung": "property-management",
  },
  es: {
    "reporting-consolidado": "consolidated-reporting",
    "supervision-inversiones": "investment-oversight",
    "coordinacion-family-office": "family-office-coordination",
    "gobernanza-sucesion": "governance-succession",
    "administracion-fiscal": "tax-administration",
    "caja-fuerte-digital": "digital-vault",
    "inmobiliario-transacciones": "real-estate-transactions",
    "personal-domestico-nominas": "household-staff",
    "traslado-permisos-residencia": "relocation-residence",
    "domiciliacion-correo": "domiciliation-mail",
    "gestion-inmobiliaria": "property-management",
  },
  pt: {
    "reporting-consolidado": "consolidated-reporting",
    "supervisao-investimentos": "investment-oversight",
    "coordenacao-family-office": "family-office-coordination",
    "governanca-sucessao": "governance-succession",
    "administracao-fiscal": "tax-administration",
    "cofre-digital": "digital-vault",
    "imobiliario-transacoes": "real-estate-transactions",
    "pessoal-domestico-salarios": "household-staff",
    "mudanca-autorizacoes-residencia": "relocation-residence",
    "domiciliacao-correio": "domiciliation-mail",
    "gestao-imobiliaria": "property-management",
  },
};
const approachSlugMap = {
  fr: "approche",
  de: "ansatz",
  es: "enfoque",
  pt: "abordagem",
};

// Localized public URL (with trailing slash) for a canonical base path.
function localizedUrl(locale, basePath) {
  if (basePath === "/") return `/${locale}/`;
  const service = basePath.match(/^\/services\/([a-z-]+)$/);
  if (service && serviceSlugMap[locale]) {
    const localized = Object.keys(serviceSlugMap[locale]).find(
      (key) => serviceSlugMap[locale][key] === service[1],
    );
    if (localized) return `/${locale}/services/${localized}/`;
  }
  if (basePath === "/approach" && approachSlugMap[locale]) {
    return `/${locale}/${approachSlugMap[locale]}/`;
  }
  return `/${locale}${basePath}/`;
}

// Legacy article URLs inherited from the ark-fid.ch codebase (accounting,
// VAT, company-law topics that Ridger never published). Each points to the
// closest live Ridger page so old links never land on a 404.
const legacyArticleRedirects = {
  "odoo-18-nouveautes-comptabilite-suisse-2025": "/ressources",
  "odoo-18-nouveautes-comptabilite-fiduciaire-geneve": "/ressources",
  "odoo-18-nouveautes-pour-gestion-comptable-et-paie-geneve-2025": "/ressources",
  "odoo-18-paie-comptabilite-nouveautes-geneve-2025": "/ressources",
  "odoo-suisse-comptabilite-parametrage-tva": "/ressources",
  "odoo-suisse-parametrage-comptabilite-tva-erreurs": "/ressources",
  "odoo-suisse-parametrage-tva-erreurs": "/ressources",
  "optimiser-les-charges-sociales-en-suisse-romande-2026-erreurs-frequentes-pour-pme-independants": "/services/household-staff",
  "cotisations-sociales-suisse-guide-2026-employeur-exemples-erreurs-faq": "/services/household-staff",
  "certificat-de-salaire-erreurs-controle-bonnes-pratiques-2026": "/services/household-staff",
  "creer-sarl-ou-sa-geneve-differences-couts-gouvernance-fiscalite": "/ressources",
  "creer-une-sarl-ou-une-sa-geneve-criteres-couts-gouvernance-fiscalite": "/ressources",
  "lba-fiduciaire-obligations-kyc-mros-2026": "/ressources",
  "lba-aml-obligations-kyc-risques-dossier-conformite-fiduciaire": "/ressources",
  "lba-aml-obligations-fiduciaire-kyc-risques": "/ressources",
  "registre-commerce-suisse-documents-delais-erreurs-couts": "/ressources",
  "registre-commerce-suisse-guide-inscription-documents-delais-erreurs-couts-2026": "/ressources",
  "registre-commerce-suisse-guide-pratique-documents-delais-erreurs": "/ressources",
  "registre-commerce-suisse-inscription-guide-pratique": "/ressources",
  "registre-commerce-suisse-guide-2026": "/ressources",
  "guide-registre-commerce-suisse-documents-delais-erreurs-couts": "/ressources",
  "guide-pratique-registre-commerce-suisse": "/ressources",
  "registre-transparence-ayants-droit-economiques-2026-sa-sarl-obligations-controle": "/ressources",
  "domiciliation-suisse-entreprise-verifications-substance-risques-2026": "/services/domiciliation-mail",
  "domiciliation-suisse-risques-substance-contrats": "/services/domiciliation-mail",
  "domiciliation-suisse-entreprise-contrat-substance-risques-2026": "/services/domiciliation-mail",
  "domiciliation-suisse-entreprises-controles-substance-risques-2026": "/services/domiciliation-mail",
  "domiciliation-entreprise-definition-contrats-risques": "/services/domiciliation-mail",
  "optimiser-domiciliation-et-direction-pme-suisse-romande-2026-pieges-etapes-conseils-pratiques": "/services/domiciliation-mail",
  "succession-entrepreneur-preparer-patrimoine-societe-fiscalite-suisse-2026": "/services/governance-succession",
  "preparer-pme-independants-tva-2026": "/services/tax-administration",
  "anticiper-tva-geneve-fin-2025-preparer-2026": "/services/tax-administration",
  "regles-pv-assemblee-generale-suisse-2026-guide-pratique-pme-independants": "/services/governance-succession",
  "cloture-comptable-pme-checklist-delais-controle-qualite": "/ressources",
};

/** @type {import('next').NextConfig} */
const baseConfig = {
  trailingSlash: true,
  // Let middleware own URL canonicalization so slashless requests do not hit
  // a framework-level redirect before locale normalization/noindex headers apply.
  skipTrailingSlashRedirect: true,
  // Disable source maps on CI by default. Enable explicitly with BUILD_SOURCEMAPS=true
  productionBrowserSourceMaps: process.env.BUILD_SOURCEMAPS === "true",
  experimental: {
    optimizePackageImports: ["lucide-react", "react-hook-form", "sonner"],
    optimizeCss: true,
    swcPlugins: [
      // Configure SWC to skip polyfills for modern browsers
    ],
    esmExternals: true, // prefer native ESM deps
  },
  // Ensure runtime access to JSON translation files in standalone/serverless outputs.
  outputFileTracingIncludes: {
    "/**/*": ["src/translations/**/*"],
  },
  ...(process.env.NODE_ENV === "production" ? { output: "standalone" } : {}),
  images: {
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 640, 768, 1024, 1280, 1920],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year for static assets
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
    reactRemoveProperties: true,
  },
  async redirects() {
    const rules = [];
    for (const locale of LOCALES) {
      for (const [slug, target] of Object.entries(legacyArticleRedirects)) {
        const destination = localizedUrl(locale, target);
        for (const suffix of ["", "/"]) {
          rules.push({
            source: `/${locale}/ressources/articles/${slug}${suffix}`,
            destination,
            permanent: true,
          });
        }
      }
    }
    return rules;
  },
  async rewrites() {
    // Map localized slugs (per locale) to English-slug routes for rendering.
    const rules = [];
    for (const [locale, slugs] of Object.entries(serviceSlugMap)) {
      for (const [localized, canonical] of Object.entries(slugs)) {
        rules.push({
          source: `/${locale}/services/${localized}`,
          destination: `/${locale}/services/${canonical}`,
        });
        rules.push({
          source: `/${locale}/services/${localized}/`,
          destination: `/${locale}/services/${canonical}/`,
        });
      }
    }
    for (const [locale, localized] of Object.entries(approachSlugMap)) {
      rules.push({
        source: `/${locale}/${localized}`,
        destination: `/${locale}/approach`,
      });
      rules.push({
        source: `/${locale}/${localized}/`,
        destination: `/${locale}/approach/`,
      });
    }
    return rules;
  },
  async headers() {
    return [
      // Cache Next.js static files aggressively
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Cache public assets (images, svgs, css, js) with long TTL
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noimageindex",
          },
        ],
      },
      // Favicons and icons
      {
        source:
          "/:icon(favicon\\.ico|favicon\\.png|favicon\\.svg|apple-touch-icon\\.png)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Self-hosted fonts in /public/fonts
      {
        source: "/fonts/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Web manifests change rarely but validate on each request
      {
        source: "/:manifest(site\\.webmanifest|manifest\\.webmanifest)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      // Robots and sitemaps (revalidate each request)
      {
        source: "/:file(robots\\.txt|sitemap\\.xml|sitemap_index\\.xml)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      // Next.js internals - noindex
      {
        source: "/_next/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(baseConfig);
