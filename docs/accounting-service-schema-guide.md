# Implementing AccountingService Schema

## Overview

The `buildAccountingService()` function has been added to `/src/lib/structuredData.ts` to provide enhanced schema markup for financial and accounting service pages.

## Schema Type

Uses `FinancialService` schema type (more specific than generic `Service`), which helps Google understand your fiduciary/accounting services better.

## Usage Example

### In a Service Page (e.g., `/app/[locale]/services/accounting/page.tsx`)

```tsx
import StructuredData from "@/src/components/seo/StructuredData";
import {
  buildAccountingService,
  buildBreadcrumbList,
} from "@/src/lib/structuredData";

export default async function AccountingServicePage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const t = await getTranslations(locale, "services");

  // Build AccountingService schema
  const accountingServiceSchema = buildAccountingService({
    name: t("Accounting.Title"), // e.g., "Accounting & Bookkeeping Services"
    description: t("Accounting.Description"),
    serviceType: "Accounting",
    url: `https://ark-fid.ch/${locale}/services/accounting`,
    areaServed: ["Geneva", "Lausanne", "Vaud", "Switzerland"],
    provider: {
      name: "Ark Fiduciaire SA",
      url: "https://ark-fid.ch",
      telephone: "+41 22 XXX XX XX", // Add your phone
      email: "contact@ark-fid.ch",
      address: {
        streetAddress: "Rue du Rhône 100", // Update with real address
        postalCode: "1204",
        addressLocality: "Geneva",
        addressCountry: "CH",
      },
    },
    offers: {
      description:
        "Financial statement preparation, bookkeeping, tax compliance, and advisory services for SMEs",
      priceRange: "$$", // Optional: $, $$, $$$, $$$$
    },
  });

  // Build breadcrumbs
  const breadcrumbSchema = buildBreadcrumbList([
    { name: t("Home"), item: `https://ark-fid.ch/${locale}` },
    { name: t("Services"), item: `https://ark-fid.ch/${locale}/services` },
    {
      name: t("Accounting.Title"),
      item: `https://ark-fid.ch/${locale}/services/accounting`,
    },
  ]);

  return (
    <>
      <StructuredData data={accountingServiceSchema} />
      <StructuredData data={breadcrumbSchema} />

      <main>{/* Your page content */}</main>
    </>
  );
}
```

## Service Type Recommendations

Use specific `serviceType` values for each service page:

| Page                  | serviceType             | URL                              |
| --------------------- | ----------------------- | -------------------------------- |
| Accounting            | `"Accounting"`          | `/services/accounting`           |
| Tax Advisory          | `"Tax Preparation"`     | `/services/taxes`                |
| Payroll               | `"Payroll Service"`     | `/services/payroll`              |
| Company Incorporation | `"Business Formation"`  | `/services/incorporation`        |
| Family Office         | `"Wealth Management"`   | `/services/family-office`        |
| M&A Advisory          | `"Business Consulting"` | `/services/mergers-acquisitions` |

## Area Served Options

**Geneva-focused:**

```tsx
areaServed: ["Geneva", "Canton of Geneva", "Lake Geneva Region"];
```

**Lausanne-focused:**

```tsx
areaServed: ["Lausanne", "Vaud", "Lake Geneva Region"];
```

**Romandy-wide:**

```tsx
areaServed: ["Geneva", "Lausanne", "Vaud", "Romandy", "Switzerland"];
```

**International:**

```tsx
areaServed: ["Switzerland", "France", "European Union"];
```

## Price Range Guidelines

| Range  | Meaning         | When to Use                                            |
| ------ | --------------- | ------------------------------------------------------ |
| `$`    | Budget-friendly | Basic bookkeeping, payroll for micro-businesses        |
| `$$`   | Moderate        | Standard accounting, tax returns for SMEs              |
| `$$$`  | Premium         | Family office, M&A advisory, complex tax planning      |
| `$$$$` | Luxury          | High-net-worth family office, international structures |

**Tip:** Use `$$` for most services to position as professional yet accessible.

## Benefits of FinancialService Schema

1. **Rich Snippets:** May appear with service provider details in search results
2. **Local Pack:** Better chance of appearing in Google Maps "3-pack" for local searches
3. **Voice Search:** Helps Google Assistant/Siri answer "Who does accounting in Geneva?"
4. **Knowledge Panel:** Contributes to your business knowledge panel on Google

## Testing Your Schema

1. **Google Rich Results Test:**

   - Go to: https://search.google.com/test/rich-results
   - Enter your page URL
   - Verify "FinancialService" is detected with no errors

2. **Schema Markup Validator:**
   - Go to: https://validator.schema.org
   - Paste your page URL or raw HTML
   - Check for warnings (orange) and errors (red)

## Common Mistakes to Avoid

❌ **Don't:**

- Use generic descriptions like "We provide services"
- Leave `areaServed` blank (limits local SEO)
- Use HTTP instead of HTTPS in URLs
- Forget to update schema when contact details change

✅ **Do:**

- Be specific: "Financial statement preparation and tax compliance for Geneva SMEs"
- Include geographic keywords in `areaServed`
- Keep URLs absolute: `https://ark-fid.ch/en/services/accounting`
- Sync schema data with your actual business info

## Integration Checklist

Before deploying schema updates:

- [ ] Update all service pages with appropriate `buildAccountingService()` calls
- [ ] Verify translations load correctly for each locale
- [ ] Test schema with Google Rich Results Test
- [ ] Check Search Console for schema errors (wait 1-2 weeks after deploy)
- [ ] Add internal links from homepage/services overview to individual service pages
- [ ] Update sitemap.xml (should happen automatically with Next.js)

## Example: Full Service Page Structure

```tsx
import { Metadata } from "next";
import { headers } from "next/headers";
import StructuredData from "@/src/components/seo/StructuredData";
import {
  buildAccountingService,
  buildBreadcrumbList,
  buildFAQPage,
} from "@/src/lib/structuredData";
import { getTranslations, type Locale } from "@/src/lib/i18n";
import { generateMetadataForPage } from "@/src/lib/metadata";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return await generateMetadataForPage(
    locale as Locale,
    "/services/accounting"
  );
}

export default async function AccountingPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const nonce = headers().get("x-nonce") || undefined;
  const t = await getTranslations(locale, "services");
  const baseUrl = "https://ark-fid.ch";
  const pagePath = `/${locale}/services/accounting`;

  // 1. Service schema
  const serviceSchema = buildAccountingService({
    name: "Accounting & Bookkeeping Services",
    description:
      "Professional accounting, financial reporting, and bookkeeping for SMEs in Geneva and Lausanne",
    serviceType: "Accounting",
    url: `${baseUrl}${pagePath}`,
    areaServed: ["Geneva", "Lausanne", "Romandy"],
    provider: {
      name: "Ark Fiduciaire SA",
      url: baseUrl,
      telephone: "+41 22 XXX XX XX",
      email: "contact@ark-fid.ch",
      address: {
        streetAddress: "Rue du Rhône 100",
        postalCode: "1204",
        addressLocality: "Geneva",
        addressCountry: "CH",
      },
    },
    offers: {
      description:
        "Monthly bookkeeping, annual financial statements, tax compliance",
      priceRange: "$$",
    },
  });

  // 2. Breadcrumb schema
  const breadcrumbSchema = buildBreadcrumbList([
    { name: t("Common.Home"), item: `${baseUrl}/${locale}` },
    { name: t("Common.Services"), item: `${baseUrl}/${locale}/services` },
    { name: t("Accounting.Title"), item: `${baseUrl}${pagePath}` },
  ]);

  // 3. Optional: FAQ schema if you have service-specific FAQs
  const faqSchema = buildFAQPage([
    {
      question: "How much does accounting cost for a Swiss SME?",
      answer:
        "Our accounting packages start at CHF XXX/month depending on transaction volume...",
    },
    {
      question: "Do you work with English-speaking clients?",
      answer: "Yes, our team is fluent in English, French, and German.",
    },
  ]);

  return (
    <>
      <StructuredData data={serviceSchema} />
      <StructuredData data={breadcrumbSchema} />
      <StructuredData data={faqSchema} />

      <main className="container mx-auto px-4 py-12">
        <h1>{t("Accounting.Title")}</h1>
        <p>{t("Accounting.Description")}</p>

        {/* Rest of your page content */}
      </main>
    </>
  );
}
```

## Next Steps

1. **Prioritize these service pages first:**

   - `/services/accounting` (highest search volume)
   - `/services/taxes` (expat-focused keywords)
   - `/services/incorporation` (conversion-focused)
   - `/services/family-office` (high-value clients)

2. **Add service-specific FAQs:**

   - Each service page should have 3-5 FAQs with `buildFAQPage()`
   - Focus on cost, process, and "why choose us" questions

3. **Monitor in Search Console:**
   - After 2-3 weeks, check "Enhancements" section
   - Look for "FinancialService" rich results
   - Fix any reported errors immediately

---

_Created: December 18, 2025_
_See also: `/docs/seo-action-plan-dec-2025.md` for full SEO strategy_
