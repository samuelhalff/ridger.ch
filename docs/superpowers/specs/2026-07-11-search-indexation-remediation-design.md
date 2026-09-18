# Search Indexation Remediation Design

## Objective

Improve qualified organic discovery and lead generation by concentrating crawl and indexing signals on canonical, useful, genuinely localized pages. Preserve every contact form, quote-agent flow, service CTA, and existing backlink redirect.

## Evidence

- The live sitemap contains 715 URLs while Search Console reports 404 indexed and 777 excluded URLs.
- The 13 March inspection sample contains 513 crawled-not-indexed URLs, 351 redirects, 50 robots-blocked URLs, 320 Open Graph image URLs, 126 query URLs, and 501 non-trailing-slash patterns.
- Recent high-value inspection data is healthier: 93 of the top 100 URLs are indexed. This argues against locale-wide suppression.
- Genuinely translated articles are already filtered by `getValidLocalesForSlug`; the repository does not support treating every non-French article as thin content.
- Live requests expose avoidable redirect chains for old French English-slug service URLs. Structured data and internal navigation still emit some of those legacy paths.
- Canonical pages use trailing slashes. Non-canonical variants should redirect once to them; serving both variants as `200` would create duplicates.

## Indexability Policy

An URL is indexable and sitemap-eligible only when it:

1. resolves directly with `200` at its canonical localized trailing-slash URL;
2. has a self-referencing canonical and reciprocal hreflang entries limited to real localized variants;
3. is not a redirect, query/filter state, generated image, API route, missing page, placeholder locale, or duplicate translation;
4. provides useful standalone content and an intentional route to a lead-generating service, contact flow, or relevant next step.

This policy retains all current service and conversion pages and all genuine translations. Locale-wide `noindex` will not be introduced without conversion evidence.

## URL Canonicalization

- Keep locale-prefixed, localized, trailing-slash URLs as canonical.
- Preserve permanent redirects for backlinks and retired content, but ensure known entry points reach the final canonical target in one hop.
- Remove legacy English-slug French URLs from internal links, metadata, and structured data.
- Keep redirect responses non-indexable. Do not serve slash and non-slash duplicates as `200`.
- Keep query URLs crawlable enough for Google to observe `noindex`; do not add a blanket robots query-string block.

## Sitemap And Hreflang

- Generate sitemap entries only from the shared indexability policy.
- Retain genuine translated articles and exclude absent or byte-equivalent translations.
- Ensure every sitemap `loc`, alternate, canonical, and structured-data URL uses the same localization helper and trailing-slash format.
- Use content dates for articles. Static `lastmod` must reflect a real content release rather than request time.

## Structured Data And Metadata

- Correct organization/service offer URLs that currently use obsolete French English slugs.
- Keep stable organization identifiers at the root domain while making page and service URLs locale-canonical.
- Preserve current Organization, ProfessionalService, Service, Article, Breadcrumb, FAQ, and Offer coverage; do not add unsupported claims.
- Validate that every canonical and hreflang target is a direct `200` response.

## Crawl Noise

- Keep API, generated social images, private paths, and framework assets out of the index.
- Treat robots-blocked social-image URLs, intentional redirects, and deliberate `noindex` query states as expected exclusions, not pages to force into the index.
- Fix sources that emit obsolete or malformed internal links. Retain `410` for irrecoverable malformed crawl junk.

## Lead-Generation Guardrails

- Do not alter contact and agent APIs, forms, Odoo lead submission, CTA destinations, phone/email links, or conversion copy except to correct a broken URL.
- Verify the contact page, instant-quote agent, and service CTAs remain reachable through direct canonical links.
- Prefer consolidating weak informational pages into stronger service journeys only when a specific duplicate is proven; no bulk article deletion is in scope.

## Verification

Automated checks will cover:

- sitemap URLs and hreflang targets are canonical, unique, and non-redirecting;
- localized paths are used consistently by metadata and structured data;
- known legacy variants redirect in one hop;
- non-canonical slash variants redirect to the canonical form;
- query states and generated images remain non-indexable;
- genuine translated articles remain eligible;
- contact, agent, and service lead paths remain present;
- `npm run lint`, `npm run test`, `npm run seo:check`, metadata validation, and a Node 20 production build.

## Rollout And Measurement

After deployment, resubmit the sitemap and validate representative service and article URLs in Search Console. Judge the change over subsequent crawls by canonical agreement, direct sitemap fetches, reduction in newly discovered redirect URLs, indexed high-value pages, organic service impressions, and completed lead actions rather than by forcing the excluded-page count to zero.
