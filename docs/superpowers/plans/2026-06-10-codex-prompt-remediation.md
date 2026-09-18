# CODEX Prompt Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the security, SEO, performance, and code-quality remediation tasks from `CODEX-PROMPT.md`.

**Architecture:** Keep the App Router design intact, move repeated article lookup logic into `src/lib/articles.ts`, and add scripts for repeatable static validation. Data migrations are idempotent and preserve article `slug`, `title`, `description`, `content`, and `references` except for the explicitly allowed UI-label cleanup.

**Tech Stack:** Next.js 15 App Router, TypeScript, Node.js 20, existing npm scripts only.

---

### Task 1: Security Headers And Restart Endpoints

**Files:**
- Modify: `app/api/kill/route.ts`
- Modify: `app/api/restart/route.ts`
- Modify: `middleware.ts`

- [ ] Confirm unsafe logging and CSP/referrer snippets exist.
- [ ] Remove auth-flow debug logs and keep one unauthorized warning plus one authorized action log per route.
- [ ] Remove blanket production CSP `https:` from `script-src`.
- [ ] Extract `applySecurityHeaders()` in middleware, preserve branch-specific headers, add `Vary: Accept-Language` to no-locale redirects, and switch referrer policy.
- [ ] Run `npm run typecheck && npm run lint`.
- [ ] Commit as `fix(security): harden headers and restart logging`.

### Task 2: Article Data And Shared Lookup Helpers

**Files:**
- Create: `src/lib/articles.ts`
- Create: `scripts/add-article-taxonomy.js`
- Create: `seo/thin-content-report.md`
- Modify: `src/translations/*/ressources.json`
- Modify: `scripts/ai-ressources-update.js`
- Modify: `scripts/validate-latest-article-guardrails.js`
- Modify: `src/lib/resourceCategories.ts`

- [ ] Add failing validation for article `category`, `tags`, and newest content length.
- [ ] Add idempotent taxonomy script using `detectTopic`.
- [ ] Run taxonomy script with `--apply`.
- [ ] Add shared cached article helpers with 15-minute freshness.
- [ ] Generate thin-content report.
- [ ] Run `npm run typecheck && npm run lint`.
- [ ] Commit script/helper changes and JSON migration as separate logical commits.

### Task 3: Sitemap, Article SEO, Resource Hub, RSS

**Files:**
- Modify: `app/sitemap.xml/route.ts`
- Modify: `app/[locale]/ressources/page.tsx`
- Modify: `app/[locale]/ressources/articles/[slug]/page.tsx`
- Create: `app/[locale]/feed.xml/route.ts`
- Modify: `src/lib/metadata.ts`

- [ ] Move sitemap article/path computation into cached runtime code and replace fake `new Date()` lastmod with `STATIC_LASTMOD`.
- [ ] Add server-rendered all-articles nav and FAQPage JSON-LD.
- [ ] Make Article JSON-LD image absolute with existing default OG asset, category-based section, keywords, and updated lastmod.
- [ ] Render breadcrumbs directly in crawler HTML.
- [ ] Add RSS route and metadata feed alternates.
- [ ] Run `npm run typecheck && npm run lint`.
- [ ] Commit as `fix(seo): improve article discovery metadata and feeds`.

### Task 4: Internal Link And Metadata Validators

**Files:**
- Create: `scripts/check-internal-links.js`
- Modify: `package.json`
- Modify: `scripts/lint-metadata.js`
- Modify any violating TSX files found by the new lint.

- [ ] Add `lint:links` and include it in `npm run test`.
- [ ] Add title/description length checks with warn-only existing article handling and newest article failure.
- [ ] Fix all static internal href violations through existing URL helpers.
- [ ] Run `npm run lint:links && npm run lint:metadata && npm run typecheck && npm run lint`.
- [ ] Commit as `fix(seo): lint canonical internal links and metadata lengths`.

### Task 5: Performance And Code Quality Cleanup

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/[locale]/layout.tsx`
- Modify: `app/[locale]/ressources/articles/[slug]/page.tsx`
- Modify/Create: `scripts/fix-article-ui-labels.js`
- Modify: `src/translations/*/ressources.json`
- Rename or skip: `src/lib/utils.js`
- Delete: `src/lib/structuredData.ts.backup`
- Modify: `.gitignore` if `tsconfig.tsbuildinfo` is tracked.

- [ ] Change `metadataBase` fallback to `https://ark-fid.ch` and remove invalid `<head nonce>`.
- [ ] Hoist dynamic component factories.
- [ ] Remove dead `generateStaticParams` from dynamic article page.
- [ ] Move article UI labels to JSON and add pipeline/write-time cleanup.
- [ ] Delete unused backup/build-info files if confirmed safe.
- [ ] Rename `utils.js` to `utils.ts` if small and safe, otherwise record skipped.
- [ ] Run `npm run typecheck && npm run lint`.
- [ ] Commit as logical `perf:` / `refactor:` commits.

### Task 6: CI Wiring, Report, Final Validation

**Files:**
- Inspect: `.github/workflows/*`
- Modify workflow only if existing publication flow lacks IndexNow/sitemap ping.
- Create: `CODEX-REPORT.md`

- [ ] Inspect IndexNow and sitemap ping scripts plus publication workflow.
- [ ] Add publication ping step if workflow exists and is missing it.
- [ ] Read `/api/agent/chat` and note whether request body length is bounded.
- [ ] Write `CODEX-REPORT.md` with each task status and out-of-scope recommendations only.
- [ ] Run final validation: `npm run typecheck && npm run lint && npm run build && npm run validate:translations && npm run lint:metadata && npm run validate:topic-policy && npm run lint:links`.
- [ ] Commit the report and any final workflow changes.
