import type { ResourceCategoryId } from "./resourceCategories";

// Article category -> service page that should receive the mid-article CTA
// traffic. Categories without their own service page point to the closest one.
export const categoryServicePath: Partial<Record<ResourceCategoryId, string>> =
  {
    odoo: "/services/odoo",
    accounting: "/services/accounting",
    tax: "/services/taxes",
    payroll: "/services/payroll",
    audit: "/services/accounting",
    corporate: "/services/corporate",
    domiciliation: "/services/domiciliation",
    outsourcing: "/services/outsourcing",
    ma: "/services/mergers-acquisitions",
    "family-office": "/services/family-office",
    incorporation: "/services/incorporation",
    immigration: "/services/immigration",
    finance: "/services/accounting",
    regulatory: "/services/corporate",
  };

export const getCategoryServicePath = (
  category: string | undefined,
): string | undefined =>
  category
    ? categoryServicePath[category as ResourceCategoryId]
    : undefined;
