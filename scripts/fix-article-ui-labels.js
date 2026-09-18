#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, "src", "translations");

const LABELS = {
  fr: {
    relatedServices: "Services liés",
    contactUs: "Nous contacter",
    services: {
      "Accounting Services": "Comptabilité",
      "Tax Services": "Fiscalité",
      "Payroll Services": "Paie et RH",
      "Domiciliation Services": "Domiciliation",
      "Company Incorporation": "Constitution d'entreprise",
      "Corporate Services": "Services corporatifs",
      "Outsourcing Services": "Externalisation",
      "Immigration & permits": "Immigration et permis",
      "Odoo Integration": "Intégration Odoo",
      "Our Team": "Notre équipe",
    },
  },
  en: {
    relatedServices: "Related services",
    contactUs: "Contact us",
    services: {},
  },
  de: {
    relatedServices: "Verwandte Dienstleistungen",
    contactUs: "Kontakt aufnehmen",
    services: {
      "Accounting Services": "Buchhaltung",
      "Tax Services": "Steuern",
      "Payroll Services": "Lohn & HR",
      "Domiciliation Services": "Domizilierung",
      "Company Incorporation": "Firmengründung",
      "Corporate Services": "Unternehmensdienstleistungen",
      "Outsourcing Services": "Outsourcing",
      "Immigration & permits": "Immigration und Bewilligungen",
      "Odoo Integration": "Odoo-Integration",
      "Our Team": "Unser Team",
    },
  },
  es: {
    relatedServices: "Servicios relacionados",
    contactUs: "Contactar",
    services: {
      "Accounting Services": "Contabilidad",
      "Tax Services": "Fiscalidad",
      "Payroll Services": "Nómina y RR. HH.",
      "Domiciliation Services": "Domiciliación",
      "Company Incorporation": "Constitución de empresa",
      "Corporate Services": "Servicios corporativos",
      "Outsourcing Services": "Externalización",
      "Immigration & permits": "Inmigración y permisos",
      "Odoo Integration": "Integración Odoo",
      "Our Team": "Nuestro equipo",
    },
  },
  pt: {
    relatedServices: "Serviços relacionados",
    contactUs: "Contactar",
    services: {
      "Accounting Services": "Contabilidade",
      "Tax Services": "Fiscalidade",
      "Payroll Services": "Salários e RH",
      "Domiciliation Services": "Domiciliação",
      "Company Incorporation": "Constituição de empresa",
      "Corporate Services": "Serviços corporativos",
      "Outsourcing Services": "Externalização",
      "Immigration & permits": "Imigração e autorizações",
      "Odoo Integration": "Integração Odoo",
      "Our Team": "A nossa equipa",
    },
  },
};

function normalizeContent(content, labels) {
  if (typeof content !== "string") return content;
  let normalized = content
    .replace(/^### Related Services$/gim, `### ${labels.relatedServices}`)
    .replace(/^## Related Services$/gim, `## ${labels.relatedServices}`)
    .replace(/\[Contact Us\]\(\/contact\)/g, `[${labels.contactUs}](/contact)`);

  for (const [source, target] of Object.entries(labels.services || {})) {
    normalized = normalized.replace(
      new RegExp(`\\[${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`, "g"),
      `[${target}]`,
    );
  }
  return normalized;
}

let changes = 0;

for (const [locale, labels] of Object.entries(LABELS)) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, "ressources.json");
  if (!fs.existsSync(filePath)) continue;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!data.ArticleUiLabels) {
    data.ArticleUiLabels = labels;
    changes++;
  }
  for (const article of Array.isArray(data.Articles) ? data.Articles : []) {
    const nextContent = normalizeContent(article.content, labels);
    if (nextContent !== article.content) {
      article.content = nextContent;
      changes++;
    }
  }
  if (APPLY) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  }
}

console.log(`${APPLY ? "Applied" : "Would apply"} article UI label changes: ${changes}`);
