import type { ResourceCategoryId } from "./resourceCategories";

// Article category -> ridger service page that receives the mid-article CTA
// traffic. Categories without a close service match (e.g. "general") have no
// entry and fall back to the generic contact pair.
export const categoryServicePath: Partial<Record<ResourceCategoryId, string>> =
  {
    "family-office": "/services/family-office-coordination",
    reporting: "/services/consolidated-reporting",
    fiscalite: "/services/tax-administration",
    patrimoine: "/services/investment-oversight",
    gouvernance: "/services/governance-succession",
    "emploi-domestique": "/services/household-staff",
    "vie-pratique": "/services/relocation-residence",
    "travaux-intendance": "/services/property-management",
  };

export const getCategoryServicePath = (
  category: string | undefined,
): string | undefined =>
  category
    ? categoryServicePath[category as ResourceCategoryId]
    : undefined;
