# Resources Validation System

## Overview
The AI-driven resources update system has multiple layers of validation to prevent 404s and hallucinations.

## Validation Layers

### 1. AI Generation (`scripts/ai-ressources-update.js`)

**File URL Validation:**
- Checks `source_url` accessibility with `httpOk()` function
- Retries up to 2 times if URL is not reachable (env: `AI_FILE_RETRIES`)
- Double-check with `urlReachableTwice()` (checks twice with 500ms delay)
- If still unreachable after retries, agent regenerates a new file

**Article References Validation:**
- Validates all `references[].url` with `httpOk()` function  
- Retries up to 2 times if URLs are not reachable (env: `AI_REF_RETRIES`)
- Automatically filters out unreachable references
- Can fail entirely with `FAIL_ON_BAD_REFERENCE=1`
- Restricts public source URLs to the curated allowlist in `docs/reference-source-policy.md`
- Blocks known fiduciary, consulting, Odoo integrator, and competitor domains even if runtime allowlist variables are extended

**Agent Instructions:**
- System prompt explicitly states: "Tous les liens DOIVENT être pertinents et répondre HTTP 200"
- Instructs agent to use web search tool to verify URLs exist
- "Ne renvoie JAMAIS d'URL inventée ou spéculative"
- Allows competitor pages only as private research inspiration; their URLs must not appear in published sources
- If not 100% certain a PDF exists, should set `source_url: null`

### 2. PDF Download (`scripts/download-missing-pdfs.js`)

- Only downloads responses that are PDF-like (content-type check)
- Skips HTML pages that don't contain PDFs
- Logs warnings for failed downloads

### 3. CI Validation (`.github/workflows/ai-ressources-every-2-days.yml`)

**Step 1: Local File Check**
```bash
node scripts/check-ressources-links.js --all-locales
```
- Verifies all referenced PDFs exist in `public/assets/downloads/`
- Exit code 1 if any files are missing

**Step 2: Remote HTTP Check**
```bash
node scripts/check-ressources-links.js --all-locales --remote
```
- Validates File `source_url` accessibility (HTTP 200)
- Validates Article `references[].url` accessibility (HTTP 200)
- Exit code 2 if any remote URLs return 404 or fail
- **CI FAILS if this step fails** → prevents 404s from reaching production

**Step 3: Curated Source Policy Check**
```bash
npm run validate:reference-sources
```
- Validates `source_url`, `references[].url`, and article body links without network calls
- Fails on domains outside the curated source policy
- Prevents publishing competitor/firm URLs as article sources

## Environment Variables

- `AI_FILE_RETRIES` - Number of retries for file URL validation (default: 2)
- `AI_REF_RETRIES` - Number of retries for reference URL validation (default: 2)
- `FAIL_ON_BAD_REFERENCE` - Fail entirely if references can't be fixed (default: false)
- `LINK_CHECK_TIMEOUT_MS` - HTTP request timeout for validation (default: 10000)
- `OFFLINE_MODE=1` - Skip all HTTP checks (for testing)

## Recent Issue & Resolution

**Problem:** 6 PDF entries had broken URLs (HTML pages or 404s):
1. `impot-anticipe-cryptomonnaies-2025.pdf` - HTML page, not PDF
2. `presentations-du-panorama-fiscal-2025.pdf` - HTML page
3. `presentations-panorama-fiscal-2025-ge.pdf` - HTML page
4. `presentations-panorama-fiscal-geneve-2025.pdf` - HTML page  
5. `checklist-teletravail-frontaliers-2025.pdf` - 404 Not Found
6. `projet-adaptation-pratique-tva.pdf` - 404 Not Found

**Root Cause:** These were likely manually added without validation.

**Resolution:** Removed all 6 entries from all locale files (fr, en, de, es, pt).

**Result:** All 17 remaining PDFs now pass validation ✅

## Best Practices

1. **Never manually add PDFs without validation** - Always run the check script
2. **Use the AI update script** - It has built-in validation
3. **Monitor CI failures** - If CI fails on resource checks, investigate immediately
4. **Test locally first**: `node scripts/check-ressources-links.js --all-locales --remote`
5. **For manual additions**: Verify URLs return 200 before committing

## Testing

Run validation locally before committing:
```bash
# Check local files only
node scripts/check-ressources-links.js --all-locales

# Check local files + remote URLs (recommended)
node scripts/check-ressources-links.js --all-locales --remote

# Check specific locale
node scripts/check-ressources-links.js --locale fr --remote
```
