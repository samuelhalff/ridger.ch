# Search Indexation Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every emitted indexable URL canonical and directly fetchable while preserving multilingual lead-generation pages and existing backlink recovery.

**Architecture:** Centralize localized canonical URL decisions in existing path/article utilities, then consume those decisions from sitemap, metadata, structured data, and redirect handling. Add deterministic offline regression tests plus live-capable validation without changing conversion flows.

**Tech Stack:** Next.js 15 App Router, TypeScript, Node.js 20, JSON translation content, shell/Node SEO validators.

---

### Task 1: Add URL-policy regression coverage

**Files:**
- Create: `scripts/seo-indexability.test.js`
- Modify: `package.json`

- [ ] Add failing assertions for localized canonical service paths, sitemap exclusion rules, genuine article translations, one-hop legacy redirects, trailing-slash canonicalization, and preserved `/contact/` and `/agent/` lead paths.
- [ ] Run `node --test scripts/seo-indexability.test.js` and confirm the assertions expose current stale URLs or redirect chains.
- [ ] Add only the minimal test script wiring required to run the suite through `npm run test`.

### Task 2: Unify canonical localized URLs

**Files:**
- Modify: `src/lib/paths.ts`
- Modify: `src/lib/structuredData.ts`
- Modify: `app/layout.tsx`
- Modify: affected navigation/content files identified by the regression test

- [ ] Reuse the existing locale path map and trailing-slash helper instead of maintaining raw service URLs.
- [ ] Replace obsolete French English-slug URLs in organization offers, service entities, metadata, and internal links with `/fr/services/comptabilite/`, `/fr/services/constitution-entreprise/`, and other canonical localized equivalents.
- [ ] Keep root-domain Organization identifiers stable and make only navigable URLs locale-specific.
- [ ] Run the focused test and verify every emitted internal URL matches its canonical localized form.

### Task 3: Collapse canonical redirects without creating duplicate pages

**Files:**
- Modify: `middleware.ts`
- Modify: `next.config.js`
- Modify: `scripts/seo-indexability.test.js`

- [ ] Encode known non-locale and legacy French service mappings so each request reaches its final localized trailing-slash URL in one permanent redirect.
- [ ] Preserve backlink redirects for retired articles and malformed-URL `410` handling.
- [ ] Keep slashless locale URLs redirected to the slash canonical; do not serve both variants as `200`.
- [ ] Ensure redirect targets are never themselves redirect rules.
- [ ] Run the focused test and inspect representative redirect responses.

### Task 4: Enforce sitemap eligibility and hreflang consistency

**Files:**
- Modify: `app/sitemap.xml/route.ts`
- Modify: `src/lib/articles.ts` only if a shared pure eligibility helper is required
- Modify: `scripts/seo-indexability.test.js`

- [ ] Generate article entries only for locales returned by the genuine-translation policy and configured non-placeholder locales.
- [ ] Drop entries with no eligible locale and deduplicate every `loc` and alternate.
- [ ] Produce canonical localized trailing-slash URLs through the shared helper.
- [ ] Preserve genuine non-French articles and reciprocal hreflang clusters.
- [ ] Assert that no sitemap URL is an API, generated image, query URL, redirect source, or missing content route.

### Task 5: Harden SEO validation without blocking valid discovery

**Files:**
- Modify: `scripts/validate-seo.js` or create one focused validator if the existing script is unsuitable
- Modify: `public/robots.txt` only if tests demonstrate a currently unmatched generated-image route
- Modify: `package.json`
- Modify: relevant file in `docs/`

- [ ] Validate sitemap uniqueness, canonical formatting, hreflang reciprocity, and direct `200` targets.
- [ ] Keep query URLs out of the sitemap and `noindex` at response level; do not blanket-disallow all query strings in robots.
- [ ] Preserve generated-image and API exclusions without expanding robots rules speculatively.
- [ ] Document which Search Console exclusions are expected and which require action.

### Task 6: Verify lead generation and production behavior

**Files:**
- Modify: no production file unless verification finds a regression

- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run lint:metadata`.
- [ ] Run `npm run seo:check`.
- [ ] Run `npm run build` under Node.js 20.x.
- [ ] Start the production build locally and inspect canonical metadata, JSON-LD, sitemap, representative one-hop redirects, query `X-Robots-Tag`, `404`/`410` behavior, `/contact/`, and `/agent/`.
- [ ] Review the complete diff for unintended content, dependency, lead API, or translation-key changes before commit and push.
