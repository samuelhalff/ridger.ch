# AI Visibility Content Cleanup Plan

## Purpose

Reduce duplicate and near-duplicate resource content so search engines and AI assistants can identify the strongest canonical pages for Ark Fiduciaire SA topics.

## Canonical Article Clusters

| Topic cluster | Keep as canonical | Merge or redirect candidates | Recommendation |
| --- | --- | --- | --- |
| Registre du commerce | `/ressources/articles/registre-commerce-suisse-guide-pratique-documents-delais-erreurs/` | `registre-commerce-suisse-documents-delais-erreurs-couts`, `registre-commerce-suisse-guide-inscription-documents-delais-erreurs-couts-2026`, `registre-commerce-suisse-inscription-guide-pratique`, `registre-commerce-suisse-inscription-etapes-documents-delais-erreurs-2026` | Keep the practical documents/delays/errors guide. Merge distinct examples into the canonical article, then 301 old slugs where mappings are exact. Some redirects already exist in `next.config.js`; review remaining slugs before adding more. |
| LBA / AML / KYC | `/ressources/articles/lba-aml-obligations-kyc-risques-fiduciaire-suisse/` | `lba-aml-obligations-fiduciaire-kyc-risques`, `aml-lba-domiciliation-incorporation-suisse-so-fit` | Keep the broad obligations guide. Merge SO-FIT specific proof into a short section if verified. Add canonical/noindex to narrower duplicates if redirect mapping is not yet approved. |
| Domiciliation / substance | `/ressources/articles/domiciliation-suisse-substance-risques-guide-2026/` | `domiciliation-suisse-risques-substance-contrats`, `domiciliation-suisse-entreprises-controles-substance-risques-2026`, `domiciliation-entreprise-geneve` | Keep one Switzerland substance guide plus the Geneva service page as commercial target. Merge repeated contract/substance/risk sections. Use service-page internal links for buyer intent. |
| SA / Sàrl creation | `/ressources/articles/creer-sarl-ou-sa-geneve-differences-couts-gouvernance-fiscalite/` | `creer-sarl-ou-sa-geneve-2026-guide-complet`, `creer-une-sarl-ou-une-sa-geneve-criteres-couts-gouvernance-fiscalite`, `constitution-societe-geneve-etapes-actualisees-2025-solutions-pme-independants`, `creer-entreprise-suisse` | Keep the Geneva SA/Sàrl comparison as canonical for buyer searches. Keep a broader Switzerland company-creation guide only if it has a clearly distinct national scope. |
| Odoo accounting / TVA | `/ressources/articles/odoo-comptabilite-tva-suisse-parametrage-controles/` | `odoo-suisse-parametrage-tva-erreurs`, `odoo-suisse-comptabilite-parametrage-tva`, `odoo-suisse-parametrage-comptabilite-tva-erreurs`, `odoo-18-nouveautes-comptabilite-suisse-2025`, `odoo-18-nouveautes-comptabilite-fiduciaire-geneve` | Keep one evergreen Swiss Odoo accounting and TVA guide. Merge useful Odoo 18 points into a dated changelog section or noindex dated duplicates. Link prominently to `/services/odoo/`. |
| Payroll / social charges | `/ressources/articles/cotisations-sociales-suisse-guide-2026-employeur-exemples-erreurs-faq/` | `guide-cotisations-sociales-employeurs-suisse-2026`, `optimisation-charges-sociales-suisse-romande-guide-independants-pme-2025`, `optimiser-les-charges-sociales-en-suisse-romande-2026-erreurs-frequentes-pour-pme-independants`, `swissdec-5-paie-geneve-obligations-2025`, `swissdec-5-0-et-salaires-geneve-2025-points-cles` | Keep one employer social charges guide. Keep Swissdec as a narrow technical article only if it remains maintained; otherwise merge into payroll guide and noindex dated duplicates. |
| TVA reform / compliance | `/ressources/articles/optimiser-declaration-tva-suisse-2026-erreurs-courantes-et-guides-concrets-pme-independants/` | `anticiper-tva-geneve-fin-2025-preparer-2026`, `impacts-tva-2025-geneve-pme`, `tva-2025-geneve-impact-pme-revision-fiscale`, `preparer-pme-independants-tva-2026`, `modifications-tva-2025-changements-commerces-entreprises` | Keep one updated TVA declaration guide. Consolidate dated reform articles after confirming what remains legally current. |
| Clôture comptable | `/ressources/articles/cloture-comptable-pme-checklist-delais-controle/` | `cloture-comptable-pme-delais-controle-interne-et-erreurs-courantes`, `inventaire-stock-cloture-comptable-pme-suisse-2026` | Keep the checklist as main guide. Keep inventory/stock only as a specialized subtopic if internally linked from the checklist. |

## Safe Changes Implemented Now

- Service page longform content was replaced with concise, service-specific structures in FR and EN.
- No articles were deleted.
- No new article redirects were added beyond existing redirect mappings.
- Public pages do not claim rankings, awards, review counts or client volumes.

## TODOs Requiring Business or Editorial Confirmation

- Confirm which article in each cluster should be the official canonical source before adding more redirects.
- Confirm whether dated 2025 articles should be updated, noindexed, merged, or kept as historical resources.
- Confirm whether the SO-FIT/OAR-SRO LBA affiliation has a public listing that can be linked.
- Confirm whether Odoo partner directory details can be linked from the Odoo service page.
- Confirm any approved anonymized case studies before publishing proof content.

## Internal Link Updates To Prioritize

- Point domiciliation/substance articles to `/fr/services/domiciliation/` and `/en/services/domiciliation/`.
- Point SA/Sàrl articles to `/fr/services/constitution-entreprise/` and `/en/services/incorporation/`.
- Point Odoo articles to `/fr/services/odoo/` and `/en/services/odoo/`.
- Point payroll/social charge articles to `/fr/services/paie/` and `/en/services/payroll/`.
- Point accounting close/checklist articles to `/fr/services/comptabilite/` and `/en/services/accounting/`.
