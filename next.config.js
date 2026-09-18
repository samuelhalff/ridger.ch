const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

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
    return [
      // Consolidated article redirects — avoid 404s for merged content
      {
        source: "/:locale/ressources/articles/odoo-18-nouveautes-comptabilite-suisse-2025/",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-nouveautes-comptabilite-suisse-2025",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-nouveautes-comptabilite-fiduciaire-geneve/",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-nouveautes-comptabilite-fiduciaire-geneve",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-nouveautes-pour-gestion-comptable-et-paie-geneve-2025/",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-nouveautes-pour-gestion-comptable-et-paie-geneve-2025",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-paie-comptabilite-nouveautes-geneve-2025/",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-18-paie-comptabilite-nouveautes-geneve-2025",
        destination: "/:locale/services/odoo/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/optimiser-les-charges-sociales-en-suisse-romande-2026-erreurs-frequentes-pour-pme-independants/",
        destination: "/:locale/ressources/articles/optimisation-charges-sociales-suisse-romande-guide-independants-pme-2025/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/optimiser-les-charges-sociales-en-suisse-romande-2026-erreurs-frequentes-pour-pme-independants",
        destination: "/:locale/ressources/articles/optimisation-charges-sociales-suisse-romande-guide-independants-pme-2025/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/creer-sarl-ou-sa-geneve-differences-couts-gouvernance-fiscalite/",
        destination: "/:locale/ressources/articles/creer-sarl-sa-geneve-criteres-capital-fiscalite-gouvernance-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/creer-sarl-ou-sa-geneve-differences-couts-gouvernance-fiscalite",
        destination: "/:locale/ressources/articles/creer-sarl-sa-geneve-criteres-capital-fiscalite-gouvernance-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/creer-une-sarl-ou-une-sa-geneve-criteres-couts-gouvernance-fiscalite/",
        destination: "/:locale/ressources/articles/creer-sarl-sa-geneve-criteres-capital-fiscalite-gouvernance-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/creer-une-sarl-ou-une-sa-geneve-criteres-couts-gouvernance-fiscalite",
        destination: "/:locale/ressources/articles/creer-sarl-sa-geneve-criteres-capital-fiscalite-gouvernance-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/lba-fiduciaire-obligations-kyc-mros-2026/",
        destination: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/lba-fiduciaire-obligations-kyc-mros-2026",
        destination: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-suisse-comptabilite-parametrage-tva/",
        destination: "/:locale/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-suisse-comptabilite-parametrage-tva",
        destination: "/:locale/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-suisse-parametrage-comptabilite-tva-erreurs/",
        destination: "/:locale/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-suisse-parametrage-comptabilite-tva-erreurs",
        destination: "/:locale/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-suisse-parametrage-tva-erreurs/",
        destination: "/:locale/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/odoo-suisse-parametrage-tva-erreurs",
        destination: "/:locale/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-documents-delais-erreurs-couts/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-documents-delais-erreurs-couts",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-guide-inscription-documents-delais-erreurs-couts-2026/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-guide-inscription-documents-delais-erreurs-couts-2026",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-guide-pratique-documents-delais-erreurs/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-inscription-guide-pratique/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-inscription-guide-pratique",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/domiciliation-suisse-entreprise-verifications-substance-risques-2026/",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/domiciliation-suisse-entreprise-verifications-substance-risques-2026",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/domiciliation-suisse-risques-substance-contrats/",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/domiciliation-suisse-risques-substance-contrats",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-transparence-ayants-droit-economiques-2026-sa-sarl-obligations-controle/",
        destination: "/:locale/ressources/articles/ayants-droit-economiques-registre-actions-sa-sarl-obligations-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-transparence-ayants-droit-economiques-2026-sa-sarl-obligations-controle",
        destination: "/:locale/ressources/articles/ayants-droit-economiques-registre-actions-sa-sarl-obligations-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/certificat-de-salaire-erreurs-controle-bonnes-pratiques-2026/",
        destination: "/:locale/ressources/articles/certificat-salaire-erreurs-controles/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/certificat-de-salaire-erreurs-controle-bonnes-pratiques-2026",
        destination: "/:locale/ressources/articles/certificat-salaire-erreurs-controles/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/succession-entrepreneur-preparer-patrimoine-societe-fiscalite-suisse-2026/",
        destination:
          "/:locale/ressources/articles/succession-entrepreneur-suisse-preparer-patrimoine-societe-fiscalite-2026/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/succession-entrepreneur-preparer-patrimoine-societe-fiscalite-suisse-2026",
        destination:
          "/:locale/ressources/articles/succession-entrepreneur-suisse-preparer-patrimoine-societe-fiscalite-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/preparer-pme-independants-tva-2026/",
        destination:
          "/:locale/ressources/articles/optimiser-declaration-tva-suisse-2026-erreurs-courantes-et-guides-concrets-pme-independants/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/preparer-pme-independants-tva-2026",
        destination:
          "/:locale/ressources/articles/optimiser-declaration-tva-suisse-2026-erreurs-courantes-et-guides-concrets-pme-independants/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/anticiper-tva-geneve-fin-2025-preparer-2026/",
        destination:
          "/:locale/ressources/articles/optimiser-declaration-tva-suisse-2026-erreurs-courantes-et-guides-concrets-pme-independants/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/anticiper-tva-geneve-fin-2025-preparer-2026",
        destination:
          "/:locale/ressources/articles/optimiser-declaration-tva-suisse-2026-erreurs-courantes-et-guides-concrets-pme-independants/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/domiciliation-suisse-entreprise-contrat-substance-risques-2026/",
        destination:
          "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/domiciliation-suisse-entreprise-contrat-substance-risques-2026",
        destination:
          "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/domiciliation-suisse-entreprises-controles-substance-risques-2026/",
        destination:
          "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source:
          "/:locale/ressources/articles/domiciliation-suisse-entreprises-controles-substance-risques-2026",
        destination:
          "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-guide-2026/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/registre-commerce-suisse-guide-2026",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/guide-registre-commerce-suisse-documents-delais-erreurs-couts/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/guide-registre-commerce-suisse-documents-delais-erreurs-couts",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/guide-pratique-registre-commerce-suisse/",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/guide-pratique-registre-commerce-suisse",
        destination: "/:locale/ressources/articles/registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-dossier-conformite-fiduciaire/",
        destination: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-dossier-conformite-fiduciaire",
        destination: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/lba-aml-obligations-fiduciaire-kyc-risques/",
        destination: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/lba-aml-obligations-fiduciaire-kyc-risques",
        destination: "/:locale/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/regles-pv-assemblee-generale-suisse-2026-guide-pratique-pme-independants/",
        destination: "/:locale/ressources/articles/proces-verbal-assemblee-generale-obligations-redaction-suisse-2025/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/regles-pv-assemblee-generale-suisse-2026-guide-pratique-pme-independants",
        destination: "/:locale/ressources/articles/proces-verbal-assemblee-generale-obligations-redaction-suisse-2025/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/cotisations-sociales-suisse-guide-2026-employeur-exemples-erreurs-faq/",
        destination: "/:locale/ressources/articles/guide-cotisations-sociales-employeurs-suisse-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/cotisations-sociales-suisse-guide-2026-employeur-exemples-erreurs-faq",
        destination: "/:locale/ressources/articles/guide-cotisations-sociales-employeurs-suisse-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/cloture-comptable-pme-checklist-delais-controle-qualite/",
        destination: "/:locale/ressources/articles/cloture-comptable-pme-delais-controle-interne-et-erreurs-courantes/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/cloture-comptable-pme-checklist-delais-controle-qualite",
        destination: "/:locale/ressources/articles/cloture-comptable-pme-delais-controle-interne-et-erreurs-courantes/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/domiciliation-entreprise-definition-contrats-risques/",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/domiciliation-entreprise-definition-contrats-risques",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/optimiser-domiciliation-et-direction-pme-suisse-romande-2026-pieges-etapes-conseils-pratiques/",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
      {
        source: "/:locale/ressources/articles/optimiser-domiciliation-et-direction-pme-suisse-romande-2026-pieges-etapes-conseils-pratiques",
        destination: "/:locale/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    // Map localized slugs (per locale) to English-slug routes for rendering.
    const serviceSlugMap = {
      fr: {
        "reporting-consolide": "consolidated-reporting",
        "surveillance-investissements": "investment-oversight",
        "coordination-family-office": "family-office-coordination",
        "gouvernance-succession": "governance-succession",
        "fiscalite-administration": "tax-administration",
        "coffre-fort-numerique": "digital-vault",
      },
      de: {
        "konsolidiertes-reporting": "consolidated-reporting",
        "anlageueberwachung": "investment-oversight",
        "family-office-koordination": "family-office-coordination",
        "governance-nachfolge": "governance-succession",
        "steuerverwaltung": "tax-administration",
        "digitaler-tresor": "digital-vault",
      },
      es: {
        "reporting-consolidado": "consolidated-reporting",
        "supervision-inversiones": "investment-oversight",
        "coordinacion-family-office": "family-office-coordination",
        "gobernanza-sucesion": "governance-succession",
        "administracion-fiscal": "tax-administration",
        "caja-fuerte-digital": "digital-vault",
      },
      pt: {
        "reporting-consolidado": "consolidated-reporting",
        "supervisao-investimentos": "investment-oversight",
        "coordenacao-family-office": "family-office-coordination",
        "governanca-sucessao": "governance-succession",
        "administracao-fiscal": "tax-administration",
        "cofre-digital": "digital-vault",
      },
    };
    const approachSlugMap = {
      fr: "approche",
      de: "ansatz",
      es: "enfoque",
      pt: "abordagem",
    };
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
