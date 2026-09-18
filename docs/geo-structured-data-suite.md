# GEO Structured Data Suite

## Scope

The site now uses one canonical Ark Fiduciaire JSON-LD graph from [`src/lib/structuredData.ts`](/home/sam/dev/ark-fid.ch/src/lib/structuredData.ts). The graph consolidates:

- `ProfessionalService` + `AccountingService` for the main entity
- `WebSite`
- Geneva office `Place`
- Geneva `AdministrativeArea`
- Offer nodes for incorporation and monthly accounting
- Core service nodes for accounting, Odoo, and incorporation

All graph nodes use stable `@id` values in the `https://ark-fid.ch/#...` format.

## Verified data points

- Legal name: `Ark Fiduciaire SA`
- Alternate name: `AX-Fiduciaire`
- UID / tax ID: `CHE-193.650.350`
- Address: `26 Boulevard Georges Favon, 1204 Genève, CH`
- Geo: `46.2021556, 6.1399595`
- Hours used in schema: Monday to Friday, `09:00-17:30`
- External profiles:
  - LinkedIn company page
  - Odoo accounting-firm profile
  - Google Maps / Google Business profile

## Article strategy

Resource articles now emit:

- `TechArticle` for Odoo-category resources
- `BlogPosting` for other resource articles

`mainEntityOfPage` continues to point to the article URL, which matches Schema.org and Google article guidance. Service relationships are expressed through `about` and `isPartOf`.

## FAQ strategy

The homepage `FAQPage` continues to reflect visible on-page FAQ content only. The questions were updated to cover:

- Odoo with Swiss banking
- fiduciary costs in Geneva
- starting a Swiss company as a foreign founder

## Review policy

We intentionally do **not** publish self-serving `Review` or `AggregateRating` schema for Ark Fiduciaire entity pages.

Reason:

- Google’s current review snippet guidance excludes self-controlled reviews for `Organization` and `LocalBusiness` pages.

If Ark later publishes first-party reviews in a compliant context on a page where the review content is visibly rendered, a dedicated builder can be added then.
