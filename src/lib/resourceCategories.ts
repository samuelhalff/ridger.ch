export type ResourceCategoryId =
  | "odoo"
  | "accounting"
  | "tax"
  | "payroll"
  | "audit"
  | "corporate"
  | "domiciliation"
  | "outsourcing"
  | "ma"
  | "family-office"
  | "incorporation"
  | "immigration"
  | "finance"
  | "regulatory"
  | "general";

export type ResourceCategoryLabels = Partial<
  Record<ResourceCategoryId | "all" | "international" | "digital", string>
> & { all: string };

export type ResourceCategoryArticle = {
  slug: string;
  title: string;
  description?: string;
  category?: string;
};

const categoryOrder: ResourceCategoryId[] = [
  "odoo",
  "accounting",
  "tax",
  "payroll",
  "audit",
  "corporate",
  "domiciliation",
  "outsourcing",
  "ma",
  "family-office",
  "incorporation",
  "immigration",
  "finance",
  "regulatory",
  "general",
];

export function buildResourceCategories(
  articles: ResourceCategoryArticle[],
  labels: ResourceCategoryLabels,
) {
  const bySlug: Record<string, ResourceCategoryId> = {};

  for (const article of articles) {
    bySlug[article.slug] = detectResourceCategory(article);
  }

  const items = categoryOrder
    .filter((id) => articles.some((article) => bySlug[article.slug] === id))
    .map((id) => ({ id, label: labels[id] || fallbackCategoryLabel(id) }));

  return { bySlug, items };
}

function detectResourceCategory(
  article: ResourceCategoryArticle,
): ResourceCategoryId {
  if (article.category && isResourceCategoryId(article.category)) {
    return article.category;
  }

  const haystack =
    `${article.slug} ${article.title} ${article.description || ""}`.toLowerCase();

  if (/(tva|vat|mwst|imp[oô]t|tax|fiscal|steuer)/i.test(haystack)) {
    return "tax";
  }
  if (
    /(paie|salaire|payroll|rh|hr|avs|anobag|permis|permit|immigration|lohn)/i.test(
      haystack,
    )
  ) {
    return "payroll";
  }
  if (/(odoo|digital|ia|ai|microsoft|automatisation|automation)/i.test(haystack)) {
    return "odoo";
  }
  if (/(compt|account|buchhaltung|plan comptable|bilan|audit)/i.test(haystack)) {
    return "accounting";
  }
  if (
    /(succursale|entreprise|s[aà]rl|sa|domiciliation|liquidation|holding|company|corporate|soci[eé]t[eé])/i.test(
      haystack,
    )
  ) {
    return "corporate";
  }
  if (/(suisse|swiss|international|[ée]tranger|foreign|frontali)/i.test(haystack)) {
    return "immigration";
  }

  return "general";
}

function isResourceCategoryId(value: string): value is ResourceCategoryId {
  return (categoryOrder as readonly string[]).includes(value);
}

export function fallbackCategoryLabel(id: ResourceCategoryId | string) {
  // Malformed article data has shipped a non-string category before (an
  // object from the AI pipeline's classifier) and 500'd every locale of the
  // article — never let bad taxonomy take a page down.
  const value = typeof id === "string" && id ? id : "general";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
