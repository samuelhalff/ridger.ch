# Automated article pipeline (SEO/GEO)

One new article every 3 days, in all 5 locales (fr canonical, en, de, es, pt), or nothing.
It is a port of ark-fid.ch's `ai-ressources-update.js`, adapted to Ridger's voice, topics and hard rules.

| Piece | File |
|---|---|
| Workflow (cron + manual) | `.github/workflows/ai-ressources.yml` |
| Orchestrator | `scripts/ai-ressources-update.js` |
| Editorial backlog (72 topics, 16 themes) | `data/article-backlog.json` |
| Topic picker / diversity | `scripts/lib/articleBacklog.js` |
| Keyword and trend research | `scripts/lib/keywordResearch.js` |
| Hard rules + SEO/GEO checks | `scripts/lib/ridgerArticleRules.js` |
| Azure clients (ported from ark) | `scripts/lib/azureClients.js` |
| Post-write validator | `scripts/validate-article-seo.js` |
| Research audit trail | `data/article-research-log.json` (written by the bot) |
| Tests (no network, no Azure) | `scripts/article-pipeline.test.js` (`npm run test:pipeline`, part of `npm test`) |

## How a run works

1. **Topic.** The picker ranks the backlog items that are not yet published. An article carries `backlogId`, so the bot never edits the backlog. Rules:
   - never the same category as the last article;
   - no theme repeated within the last 4 generated articles;
   - no near-duplicate of any existing article (the same all-time check as `validate-latest-article-guardrails.js`).
   Priority, seasonality (`months`), under-used categories and audience alternation raise the score. For the top 3, a cheap Google-autocomplete demand probe (fr-CH + fr-FR) picks the winner.
2. **Keyword research, before any writing.** For each locale, Google autocomplete (`suggestqueries.google.com`, `client=firefox`) is queried in these markets: fr-CH/fr-FR, en-GB/en-US, de-CH/de-DE, es-ES, pt-PT/pt-BR. The queries are the seed, the head term and question expansions ("<head> comment", "comment <head>", …).
   - **Filters:** pricing, jobs, tool and navigational queries; stale years; truncated tokens; prefix echoes; location variants; ark-fid.ch core terms (`arkCoreTerms`, the anti-cannibalisation guard).
   - **Primary keyword:** the backlog head term when autocomplete confirms it, otherwise the strongest seed-covering suggestion.
   - **Secondary keywords:** 5–10 long tails, plus the real question queries.
   - **Alignment:** secondary lists are trimmed to the same length in every locale. This is required because the build's key-parity check works by array index.
   - **Trend signal:** best effort, from Google Trends' public "trending now" RSS for CH (fr, de), matched against the keywords. It goes into the log and never fails the run. Autocomplete is best effort too: with no suggestions, the backlog `targetKeywords` are used.
3. **Research.** The first available of these is used: the Azure AI Foundry web-search agent (`AZURE_AGENT_*`, same as ark), then `AZURE_OPENAI_RESEARCH_*`, then the main deployment. It returns current developments with their legal status (in force / adopted / proposal / consultation), dated key facts, an outline written as questions, FAQ questions and official references. The references are HTTP-validated (`referenceValidator`), must come from allow-listed domains (max 2 per host) and must include at least 2 official sources.
4. **Draft (FR).** Uses `AZURE_OPENAI_DRAFT_*`. The prompt carries the Ridger voice (warm, discreet, precise), a block of verified facts from the 2026 legal audit, the hard rules and the fixed structure below.
5. **Validation, with up to 2 repair rounds.** If validation still fails, the attempt is discarded; up to 3 research attempts are made, then the run fails and nothing is written.
6. **Translation.** One call per locale, using that locale's own researched keywords. Each locale must then pass these checks, with up to 3 attempts per locale:
   - the same hard rules and SEO checks;
   - **number parity** with FR (separators are normalised, link targets ignored);
   - **structure parity** (H2/H3/FAQ/key-facts/link counts);
   - not identical to FR;
   - same tag count.
7. **Write.** The article is appended to all 5 `ressources.json` files at the same index. The research log gets an entry, and the workflow outputs `has_new`, `slug` and `title`.
8. **Workflow.** The workflow then runs these steps:
   1. fix internal links;
   2. `validate-article-seo --slug`;
   3. `validate-latest-article-guardrails --slug`;
   4. `validate-reference-source-policy --slug`;
   5. article-facts, translations and link checks;
   6. `npm run build` (includes the prebuild `validate-translations.js` with its fatal code-reference and key-parity checks);
   7. commit `content(ressources): <title>` and push to `main`;
   8. deploy: a PAT push triggers `build-and-deploy.yml` on its own; with `GITHUB_TOKEN`, the workflow dispatches it;
   9. wait until the FR URL returns 200;
   10. ping sitemaps;
   11. IndexNow (`POST /api/indexnow/` with the 5 URLs; same key as `indexnow-reindex.yml`).

## Article structure and where each keyword goes

| Element | Field / markup | Rule (checked) |
|---|---|---|
| Slug | `slug` (shared by all locales) | kebab-case ASCII ≤ 90, carries the FR primary keyword |
| `<title>` | `seoTitle` → `"{seoTitle} - Ridger"` | ≤ 51 chars (≤ 60 with brand), contains primary, no brand |
| Meta description | `metaDescription` (used verbatim) | 110–160 chars, contains primary |
| H1 | `title` | 20–75 chars, contains primary |
| Direct answer (GEO) | paragraph before the first H2 | 2–3 sentences (max 4), contains primary |
| Key facts box | `## Points clés` / Key facts / Das Wichtigste in Kürze / Puntos clave / Pontos-chave | first or second H2, ≥ 3 bullets, dated official facts |
| Question H2s | `## …?` | ≥ 3; ≥ 2 contain a secondary keyword (≥ 1 in translations) |
| Internal link | `[descriptive anchor](/fr/services/…/)` | resolves (service maps parsed from `src/lib/paths.ts`, or an existing article); anchor ≥ 2 words, not generic |
| External links | Markdown links in body | validated reference URLs only |
| Update date | ISO date line ("Sources officielles consultées le 2026-…") + `updated` field | required |
| FAQ | `## Questions fréquentes` + 4–6 `### …?` | rendered visibly and emitted as **FAQPage JSON-LD** |
| References | `### Références` (auto-appended) + `references[]` | official sources |
| Image alt | `imageAlt` | 10–125 chars; used for `og:image:alt` and the JSON-LD `image.caption` |
| Keywords | `keywords: { primary, secondary[] }` (per locale) | emitted as JSON-LD `keywords` (with tags). No visible meta-keywords tag. |

The article page (`app/[locale]/ressources/articles/[slug]/page.tsx`) emits BlogPosting JSON-LD with these fields: `keywords` (researched keywords plus tags), `about` (the category's service entity plus the primary keyword as a `Thing`), `isPartOf` (the service page), `inLanguage`, `datePublished`/`dateModified`, and `image.caption`. It also emits FAQPage JSON-LD. `src/lib/metadata.ts` uses `seoTitle` and `metaDescription`, sets `og:type=article` with published/modified times, and keeps the existing hreflang alternates, which are limited to genuinely translated locales. All new fields are optional, so hand-written articles are unchanged.

## Hard rules (the article is discarded on any hit)

Enforced by `checkHardRules()` in all 5 languages:
- No prices or fees. No quote tool. No mention of an AI assistant or chatbot. No e-mail address.
- No guarantees or promised outcomes.
- No US-person or US-trust structuring (FATCA).
- The Ark group is mentioned at most once.
- **Legal audit 2026:**
  - "183 days" presented as the Swiss tax-residence test. The actual rule: 30 days with gainful activity, 90 days without, plus domicile and treaty tie-breakers.
  - The forfait base given as "5× rent". It is 7×.
  - A Swiss "golden visa" or residency-by-investment programme.
  - "CHF 435,000 minimum tax". It is the 2026 federal minimum base, not a tax.
  - An unqualified "no inheritance tax" or "no wealth tax".
  - The April 2026 Lex Koller tightening, or the Switzerland–EU package, presented as law in force.
  - Buying property presented as giving a right of residence.

`node scripts/validate-article-seo.js --hard-rules-all` reports hits in the existing corpus without failing. As of 2026-09-30 it flags 2 hand-written articles:
- `cout-family-office-suisse-modeles-facturation` quotes market fee ranges;
- `impatriation-suisse-forfait-fiscal-familles-internationales` states **5×** rent for the forfait. The rule is 7× (art. 14 LIFD) and needs a manual fix.

## Secrets and variables

Repository **secrets**, the same names ark-fid.ch uses:

| Secret | Required | Purpose |
|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | yes | Azure OpenAI resource (origin or full chat-completions URL) |
| `AZURE_OPENAI_API_KEY` | yes | key for that resource |
| `AZURE_OPENAI_RESEARCH_ENDPOINT` / `AZURE_OPENAI_RESEARCH_API_KEY` | optional | dedicated research deployment |
| `AZURE_AGENT_ENDPOINT` / `AZURE_AGENT_API_KEY` | optional | Foundry web-search agent, for live developments |
| `PAT_TOKEN` | recommended | push that triggers `build-and-deploy.yml`; without it the workflow uses `GITHUB_TOKEN` and dispatches the deploy |

Repository **variables** (all optional; defaults in brackets):
- `AZURE_OPENAI_DEPLOYMENT` [`gpt-4.1`]
- `AZURE_OPENAI_API_VERSION` [`2025-01-01-preview`]
- `AZURE_OPENAI_DRAFT_DEPLOYMENT` [`gpt-5.2`]
- `AZURE_OPENAI_DRAFT_API_VERSION`
- `AZURE_OPENAI_RESEARCH_DEPLOYMENT`
- `AZURE_OPENAI_RESEARCH_API_VERSION`
- `AZURE_AGENT_NAME` [`web-deep-search:6`]
- `AI_RESSOURCES_PAUSED`

## Running it

```
npm run articles:plan        # topic + live keyword research only, no Azure, writes nothing
npm run articles:dry-run     # full generation + validation, writes nothing (needs Azure env)
npm run articles:generate    # full run, appends to the 5 locales
npm run validate:article-seo -- --slug <slug>
npm run test:pipeline        # unit tests + an offline end-to-end run with a mocked model
```

Manual run: Actions → **AI Resources Update** → *Run workflow*. The options are:
- `dry_run`: generate and validate without committing;
- `topic`: a backlog id such as `impot-fortune-geneve-vaud-calcul-evaluation`, or free text, optionally with `topic_keywords` and `topic_category`;
- `skip_topic_rotation`.

## Adding topics

Append an item to `data/article-backlog.json` → `items`:

```json
{
  "id": "unique-kebab-id",
  "theme": "tax",
  "category": "fiscalite",
  "audience": "accessible",
  "priority": 1,
  "service": "/services/tax-administration",
  "angle": "Une phrase en français : la question précise à laquelle l'article répond.",
  "seeds": { "fr": "…", "en": "…", "de": "…", "es": "…", "pt": "…" },
  "targetKeywords": { "fr": ["…"], "en": ["…"], "de": ["…"], "es": ["…"], "pt": ["…"] },
  "officialSources": ["https://www.estv.admin.ch/…"],
  "months": [1, 2, 3]
}
```

Field values:
- `theme`: one of the 16 keys in `themes`.
- `category`: one of the 8 site categories: `family-office`, `reporting`, `fiscalite`, `patrimoine`, `gouvernance`, `emploi-domestique`, `vie-pratique`, `travaux-intendance`.
- `audience`: `accessible`, `affluent` or `uhnw`.
- `priority`: 1 is the highest.
- `service`: one of the 7 canonical service paths.
- `seeds`: how people actually search, 2–5 words.
- `months`: optional seasonal boost.

`npm run test:pipeline` validates the file: enums, all 5 locales present, no id equal to an existing slug. When the backlog runs dry, the run fails with "No eligible backlog item" and nothing is published.

## Pausing

- **Scheduled runs:** set the repository variable `AI_RESSOURCES_PAUSED=true`. Manual runs still work. Delete the variable to resume.
- **Everything:** Actions → AI Resources Update → ⋯ → *Disable workflow*.
- **A single bad article:** revert its `content(ressources): …` commit. That push redeploys.
