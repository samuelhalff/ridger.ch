export const namespaces = [
  "accounting",
  "ai-profile",
  "contact",
  "cookie",
  "corporate",
  "domiciliation",
  "family-office",
  "faq",
  "footer",
  "home",
  "immigration",
  "incorporation",
  "legal",
  "metadata",
  "navbar",
  "odoo",
  "outsourcing",
  "payroll",
  "privacy",
  "ressources",
  "services",
  "servicesItems",
  "taxes",
  "testimonials",
] as const;

export type Namespace = (typeof namespaces)[number];

export const namespaceSet: ReadonlySet<string> = new Set(namespaces);
