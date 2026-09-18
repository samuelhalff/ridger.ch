# ridger.ch

Digital-first Swiss multi-family office — brand of Ark Fiduciaire SA, Geneva.
Next.js 15 (App Router, standalone output), i18next JSON translations
(FR canonical; EN launch locale; DE/ES/PT built but noindexed via
`PLACEHOLDER_LOCALES=de,es,pt`), Tailwind with OkLCH design tokens
(warm paper / deep pine / bronze; Fraunces + Instrument Sans + IBM Plex Mono).

Derived from the ark-fid.ch codebase (2026-09); same SEO/GEO machinery:
dynamic sitemap + hreflang, structured data graph, `llms.txt` route,
ai-profile pages, IndexNow, guardrailed articles corpus (21 FR+EN).

## Hosting

Infomaniak managed hosting shared with houle.ai
(`/srv/customer/sites/ridger.ch/`, **port 5001** — houle holds 5000).
Deploys via `.github/workflows/build-and-deploy.yml`: build in CI →
rsync artifact → extract to `releases/<ts>` → `current` symlink →
supervisor restart → health check. `KEEP=2` releases. ridger.ch is
Cloudflare-proxied; deploy control endpoints use the
`DEPLOY_ORIGIN_BASE` repo variable when set (grey-cloud hostname).

## Launch checklist (remaining)

- [ ] GitHub Actions billing unblocked (jobs currently refuse to start)
- [ ] Infomaniak Manager: add ridger.ch as Node.js site on the houle hosting, port 5001
- [ ] Cloudflare DNS: ridger.ch → hosting target, proxied; cache-bypass `/api/*`
- [ ] Cloudflare Turnstile: add `ridger.ch` to the ark widget's hostnames (keys reused)
- [ ] GA4 property (SA needs account-level Editor) → set `NEXT_PUBLIC_GA_ID` secret
- [ ] GSC domain property + submit `/sitemap.xml`
- [ ] LinkedIn company page `/company/ridger` (referenced in Organization `sameAs`)
- [ ] Post-launch: ark-fid.ch article on Ridger with backlink

## Commands

```
npm run dev            # local dev (port 5000)
npm run build          # prod build (runs validate-translations prebuild)
npm run test:unit      # node --test (needs Node >= 22 locally)
npm run test:guardrails
node scripts/seo-indexability.test.js
```

Secrets consumed by CI are listed in `.env.example`.
