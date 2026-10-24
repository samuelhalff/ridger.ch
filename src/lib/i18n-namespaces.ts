export const namespaces = [
  "ai-profile",
  "contact",
  "cookie",
  "family-office",
  "faq",
  "footer",
  "home",
  "legal",
  "metadata",
  "navbar",
  "privacy",
  "ressources",
  "services",
  "servicesItems",
] as const;

export type Namespace = (typeof namespaces)[number];

export const namespaceSet: ReadonlySet<string> = new Set(namespaces);
