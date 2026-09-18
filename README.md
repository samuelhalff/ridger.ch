Ridger Website 2025

## IndexNow Automation

This repo includes an automated IndexNow reindex step via GitHub Actions.

- API route: `POST /api/indexnow/reindex` – submits core localized pages to IndexNow
- Auth: Provide `x-indexnow-secret` header matching `INDEXNOW_SECRET`

### Setup

1. Configure environment variables in your hosting platform:

   - `NEXT_PUBLIC_SITE_URL` – e.g. `https://ridger.ch`
   - `INDEXNOW_KEY` – a random key string; the key file will be served at `/<INDEXNOW_KEY>.txt`
   - `INDEXNOW_SECRET` – a separate secret to protect the reindex endpoint

2. In GitHub repository settings → Secrets and variables → Actions, create:

   - `INDEXNOW_SECRET` – same value as in hosting
   - (Optional) `SITE_URL` – override if not using `https://ridger.ch`

3. The workflow lives at `.github/workflows/indexnow-reindex.yml` and runs on:
   - push to `main`
   - manual dispatch

The job retries up to 3 times on non-200 responses.

## SEO & Internationalization

### Locale-specific Open Graph / Twitter Images

Place per-locale images in `public/assets/og/` named:

- `og-fr.webp`
- `og-de.webp`
- `og-en.webp`
- `og-es.webp`
- `og-pt.webp`

Guidelines:

- 1200x630 px (or 1200x628), ≤300 KB, WebP preferred.
- Provide PNG only if a platform rejects WebP.
- Missing locale falls back to `/assets/main-bg.webp`.
- Logic: `src/lib/metadata.ts` (selectOgImageForLocale).

Verification:

1. View page source for `og:image` / `twitter:image`.
2. Use Sharing Debugger / Card Validator.
3. Keep filenames stable or append `?v=2` for cache bust.

### Google Search Console Checklist

1. Verify domain property via DNS (preferred) or URL-prefix via HTML tag.
2. Submit sitemap: `https://ridger.ch/sitemap.xml`.
3. Live test sample localized URLs to confirm hreflang cluster.
4. Monitor Breadcrumbs, FAQ, Articles enhancement reports.
5. Coverage anomalies: spikes in soft 404 or crawled-currently-not-indexed.
6. International targeting relies on hreflang + sitemap; ensure no locale 404s.

### Structured Data Summary

- FAQPage: Home.
- BreadcrumbList: Services index + each service page + articles.
- Article: Resource articles.
- (Optional future) Organization / Website for logo.

### Security / SRI

- CSP nonce in `middleware.ts`.
- HSTS active (prod).
- Expect-CT (deprecated) retained; removable later.
- Add SRI hashes for any future external scripts.

### Core Web Vitals

- LCP images prioritized + fetchPriority.
- Dynamic imports for non-critical sections (FAQ, Testimonials) reduce main thread.
- Internal link checker (`npm run links:check`).

### Accessibility

- Global `:focus-visible` outline.
- `aria-current="page"` on active primary nav links.
- Alt text verified on key images.

## Ressources Synchronization

Canonical content lives in `src/translations/fr/ressources.json`.

Scripts:

- `npm run ressources:check` – dry-run parity check (exit code 1 if divergence)
- `npm run ressources:sync` – overwrite `en,de,es,pt` with canonical FR JSON

Direct usage:

```
node scripts/sync-ressources.js --check
node scripts/sync-ressources.js --apply
node scripts/sync-ressources.js --locales=en,pt --apply
```

Notes:

- Filenames, slugs, URLs are copied verbatim; translate only textual fields after sync.
- Run a check before committing to ensure parity.
- Add new files/articles only in FR, then sync and translate other locales as needed.

## AI Agent Chat (Quotes)

The website includes an AI quote assistant at `/<locale>/agent/`, backed by `POST /api/agent/chat`.

Environment (API key or Entra ID / DefaultAzureCredential):

```
# Required
AZURE_AGENT_ENDPOINT=...
# Use the quote agent for chat. You can optionally pin a version (e.g. ark-quote-agent:21).
AZURE_AGENT_CHAT_NAME=ark-quote-agent:21

# Auth (one of):
# - API key (preferred for Foundry endpoints):
AZURE_AGENT_API_KEY=...
# - Managed identity / Azure hosting (DefaultAzureCredential)
# - Azure CLI (`az login`) for local dev
# - Service principal secrets:
AZURE_TENANT_ID=...
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
# - Or a JSON blob (tenantId/clientId/clientSecret):
AZURE_CREDENTIALS=...

# Optional
AZURE_AGENT_CHAT_RESPONSES_API_VERSION=2025-11-15-preview
AGENT_CHAT_ALLOWED_ORIGINS=https://ridger.ch
AZURE_AGENT_RATE_LIMIT_WINDOW_MS=600000
AZURE_AGENT_RATE_LIMIT_MAX=12
```

Note: `AZURE_AGENT_CHAT_NAME` is intentionally separate from `AZURE_AGENT_NAME` to avoid coupling the website chat agent to the AI ressources update workflow.

## AI-driven Ressources Update (every 4 days)

Script: `scripts/ai-ressources-update.js`

Providers:

- Azure Agent with Bing grounding (requires `AZURE_AGENT_*` envs)

Environment (API key or DefaultAzureCredential):

```
# Required
AZURE_AGENT_ENDPOINT=...
AZURE_AGENT_NAME=...
# Example: AZURE_AGENT_NAME=web-deep-search:5

# Optional: API key for Foundry agent calls
AZURE_AGENT_API_KEY=...

# Optional
AZURE_AGENT_RUN_TIMEOUT_MS=180000
AZURE_AGENT_RESPONSES_API_VERSION=2025-11-15-preview
AZURE_AGENT_FORCE_RESPONSES=0
AZURE_AGENT_RESPONSES_RETRIES=4
AZURE_AGENT_RESPONSES_BACKOFF_MS=15000
AZURE_AGENT_RESPONSES_BACKOFF_MAX_MS=120000
AZURE_AGENT_RESPONSES_BACKOFF_JITTER_MS=2000
AZURE_AGENT_RESPONSES_TIMEOUT_MS=180000
AZURE_AGENT_RESPONSES_COOLDOWN_MS=8000
AZURE_AGENT_RESPONSES_MAX_OUTPUT_TOKENS=0

# Optional (SEO): enforce minimum FR article length (retries if too short)
SEO_MIN_WORDS=1500
# Optional (SEO): max length guidance (not enforced by code)
SEO_MAX_WORDS=3000

# Optional: two-step mode (recommended for long-form 1500+ words)
AI_TWO_STEP=1
```

Authentication uses `AZURE_AGENT_API_KEY` when provided, otherwise it falls back to the Azure Identity DefaultAzureCredential chain. Supported options:

- Local dev: run `az login` first.
- GitHub Actions / CI: configure a federated service principal and call `azure/login@v2` with `allow-no-subscriptions: true` plus `AZURE_CLIENT_ID` and `AZURE_TENANT_ID` secrets.
- Service principal secrets: set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET` in the environment.
- Managed identity when running inside Azure hosting.

Usage examples:

```
# Dry run / apply
node scripts/ai-ressources-update.js --dry-run
node scripts/ai-ressources-update.js --apply
node scripts/ai-ressources-update.js --apply --translate-existing
```

Notes:

- The script expects JSON responses matching the specified schema. If the agent returns non-JSON content, adjust the agent instructions to produce `application/json` payloads.
- `AZURE_AGENT_NAME` must be a Foundry agent name (optionally pinned to a version like `web-deep-search:5`).
- For new Foundry agents (non-`asst_`), the script uses the OpenAI Responses API with an `agent_reference` payload. Keep `AZURE_AGENT_RESPONSES_API_VERSION` aligned with your project OpenAI API version (default `2025-11-15-preview`).
- Translations use Azure OpenAI (GPT-4.1) via `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, and `AZURE_OPENAI_API_VERSION` (no agent required).
- `--translate-existing` fills missing/untranslated article translations (it does not force retranslation of every article).
- Topic selection uses trend signals + editorial rotation. Default `TRENDS_PROVIDER=hybrid` uses public Google Trends RSS (broad, filtered) + evergreen rotation, and enriches keywords using Google Suggest (`TRENDS_SUGGEST=1`).
- References are validated (no 404/empty pages). The Markdown `Références` section is regenerated from the validated `newArticle.references` list to avoid mismatches/hallucinated links.
- Public reference domains are restricted to the curated policy in `docs/reference-source-policy.md`; competitor/firm URLs may be used as private research inspiration but must not be published as sources.
- CI also requires at least 1 trusted/official source via `REFERENCE_MIN_TRUSTED_DOMAINS=1`.
- GitHub workflow `.github/workflows/ai-ressources-every-4-days.yml` automates the run every four days using OIDC-based Azure login.

## Ressources Link Integrity

To detect unreachable article references in the ressources section:

Scripts:

- `node scripts/check-ressources-links.js --locale fr` – check references for a single locale.
- `node scripts/check-ressources-links.js --all-locales` – scan every locale folder.
- `node scripts/check-ressources-links.js --all-locales --remote` – perform remote HTTP HEAD/GET to validate reference URLs (slower).
- `node scripts/check-ressources-links.js --all-locales --json` – output machine-readable JSON summary.

Exit codes:

- `0` all links OK
- `1` at least one expected resource missing locally (currently unused without downloadables)
- `2` remote check enabled and at least one remote resource failed (non 2xx or network error)

Workflow recommendation:

1. Add/update entries in canonical `fr`.
2. Run link integrity check across all locales: `node scripts/check-ressources-links.js --all-locales --remote`.
3. Fix or remove any persistent 404 sources (sometimes official sources rename or retract documents).
4. Sync other locales if structure changed: `npm run ressources:sync`.

If an official reference returns 404, prefer temporarily removing its entry across locales rather than leaving a broken link in production.

```
# IndexNow setup complete
# Deployment trigger - Wed Oct  1 13:31:16 UTC 2025
```

# Test deployment
