# Google Business Profile (GBP) Posts Playbook

Consistent, localized GBP posts strengthen local SEO signals (freshness, engagement, relevance) and can drive incremental clicks for branded & discovery queries.

## Objectives

- Maintain continuous freshness (weekly cadence) across all supported locales.
- Reinforce topical authority around core service pillars (Accounting, Payroll, Tax, Incorporation, Odoo / Digital, Outsourcing, Corporate Governance).
- Promote key evergreen resources and new articles.
- Capture UTM‑tagged traffic for performance attribution.

## Cadence

| Week of Month | Theme Focus                           | Example Post Types                                                          |
| ------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| 1             | Accounting / Tax Deadlines            | Compliance reminder, checklist snippet, link to resource PDF                |
| 2             | Payroll / HR                          | Automation tip, regulatory change, link to payroll article                  |
| 3             | Digital / Odoo / Automation           | Odoo module highlight, AI productivity stat, digital transformation article |
| 4             | Incorporation / Governance / Strategy | Incorporation step, governance best practice, SME planning insight          |
| 5 (if any)    | Highlight best-performing prior post  | Repurpose top click-through or seasonal topic                               |

## Post Types & Structure

1. Educational Micro-Guide (How to / 3-step tip)
2. Deadline Reminder (Add urgency + CTA)
3. Resource Promotion (Whitepaper / PDF / Article)
4. Credibility Signal (Client stat, years of experience, certifications)
5. Engagement Question (Invite interaction)

Each post (ideal 80–150 words):

- Hook (1 line)
- Value statement / micro insight (2–3 lines)
- CTA with UTM link

## Localization Workflow

1. Author master (FR) & EN version in repo (optional `docs/gbp-drafts/`).
2. Translate to ES / DE / PT using consistent terminology glossary.
3. Human review (tone + regulatory accuracy).
4. Store final text with version stamp (YYYY-MM-DD) + target publish date.

## UTM Tagging Standard

Use consistent medium & source to segment GBP traffic.

```
?utm_source=google&utm_medium=gbp-post&utm_campaign=service-{pillar}-{yyyy-mm}
```

Examples:

```
?utm_source=google&utm_medium=gbp-post&utm_campaign=service-payroll-2025-09
?utm_source=google&utm_medium=gbp-post&utm_campaign=resource-tax-guide-2025-10
```

If driving to a PDF directly, append UTM to the page that links to the PDF (avoid raw PDF landing unless necessary).

## KPI Dashboard (suggested)

- Impressions (GBP dashboard)
- Clicks to site (tagged sessions)
- CTR (Clicks / Impressions)
- Conversions (lead form / contact clicks attributed via UTM)
- Engagement (Google-provided metrics, if available)

## Content Pillar Mapping

| Pillar               | Supporting Assets                                     |
| -------------------- | ----------------------------------------------------- |
| Accounting           | VAT article, tax optimization article, PDF tax guides |
| Payroll              | Payroll automation article                            |
| Tax                  | Federal/cantonal guides, optimization strategies      |
| Incorporation        | HowTo schema page, governance insights                |
| Digital / Odoo       | Digital transformation article, Odoo service page     |
| Outsourcing          | Outsourcing service page, efficiency stats            |
| Corporate Governance | Corporate service page, strategic advisory excerpts   |

## Seasonal / Trigger Events

- Fiscal year close milestones
- New VAT / tax rate adjustments
- Regulatory payroll changes (insurance thresholds, pension adjustments)
- Product / service launches or new resource publication

## Quality Checklist (Pre-Publish)

- [ ] Localized & proofread
- [ ] Single focused CTA
- [ ] Includes 1 primary keyword (natural)
- [ ] Includes brand name once (Ark Fiduciaire)
- [ ] UTM URL tested
- [ ] No overuse of ALL CAPS or emojis
- [ ] Date scheduled in calendar

## Governance

- Owner: Marketing / Content Lead
- Backup: Operations Lead
- Weekly slot: Tuesday 09:00 local (adjust for target locale prime times)
- Monthly review: analyze prior month performance + adjust themes

## Versioning & Storage

Optional JSON schema for storing planned posts (example):

```json
{
  "2025-09-02": {
    "locale": "fr",
    "pillar": "payroll",
    "type": "deadline",
    "status": "scheduled"
  },
  "2025-09-09": {
    "locale": "en",
    "pillar": "tax",
    "type": "resource",
    "status": "draft"
  }
}
```

## Expansion Ideas

- Add mini infographics (upload as image — compress first)
- A/B test CTA verb every quarter
- Quarterly performance PDF summary for leadership

---

Maintain iteration notes at bottom of this file with date + change rationale.
