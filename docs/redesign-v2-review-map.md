# Redesign V2 Review Map

## Source of Truth

- Current production repo behavior and content remain the baseline for logic, SEO, routing, forms, schema, cookie consent, WhatsApp, and agent protections.
- `new-design/v2/IMPLEMENTATION_BRIEF.md` is the implementation brief for the full mockup pass.
- `new-design/v2/*.html` and `new-design/v2/shared.css` define the target hierarchy, spacing, card rhythm, and visual system.
- Mockup claims that are not already in the repo, such as response-time promises, prices, fake counts, or new legal claims, must not be copied.

## Page and Component Map

| Area | Mockup Reference | Repo Surface | Work Items |
| --- | --- | --- | --- |
| Global shell | `shared.css` nav/footer/floating controls | `app/layout.tsx`, `NavbarClient`, `MobileMenu`, footer, cookie, WhatsApp | Full-width opaque header, content-width nav alignment, no global decorative banner, icon-only floating controls, preserve mobile menu depth. |
| Shared page hero | all `new-design/v2/*.html` hero sections | `src/components/site/page-hero.tsx`, `section-heading.tsx` | Replace old rounded gradient hero cards with clean editorial sections, large H1s, left alignment, restrained peach accent. |
| Home hero | `home.html` hero/facts | `home/components/hero.tsx`, `fr/home.json` | Match title/content direction, CTA hierarchy, no Swiss Made badge, clean fact row rather than card-like stats. |
| Home services | `home.html` bento | `home/components/services.tsx` | Keep 11 services, bento spans, first black tile, Odoo peach tile, minimal cards, mobile-safe grid. |
| Home lower sections | `home.html` approach/testimonials/FAQ/final CTA | `page.tsx`, about/faq/testimonials/contact | Preserve existing testimonials carousel and content, structure text into readable blocks, avoid invented process claims. |
| Team/about | `about.html` | `team/page.tsx`, team data/images | Required intro, real portraits, Catia fallback, editorial image scale, no mockup-only concepts. |
| Contact | `contact.html` | `contact/page.tsx`, contact form, GoogleMap | Clean contact layout, real map, shadcn-style subject select, preserve form protections and schema. |
| Resources | `ressources.html` | `ressources/page.tsx`, resource grid/cards/filter | Minimal text-led cards, functional filters, colored tags, no dead counters/tabs/images. |
| Article | `article.html` | article detail page, prose CSS, article CTA | Preserve canonical/schema/dates/author, match prose hierarchy and CTA styling. |
| Service detail | `service-detail.html` | service pages/presentation components | Mobile overflow audit, no invented examples/prices, service content preserved. |
| Agent | `agent.html` | `agent/page.tsx`, `AgentChat`, API routes | Utility layout around current chat/protection flow, no static mock form, no hardcoded fees. |

## Verification Map

- Source guard: `node scripts/validate-bento-redesign.js`.
- Code checks: `npm run lint`, `npm run test`, `npm run build` under Node 20 container.
- Browser audit: `/fr/`, `/fr/contact/`, `/fr/ressources/`, one article, one service page, `/fr/team/`, `/fr/agent/` at mobile and desktop widths.
- Visual assertions: no horizontal overflow, no global decorative banner, full-width top bar, clean page heroes, mobile menu present, map iframe visible, resource filters change results, WhatsApp/cookie controls present and icon-only.
