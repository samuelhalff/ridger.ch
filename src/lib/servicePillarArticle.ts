/**
 * Reference ("pillar") article per service page, shown as a quiet
 * "further reading" card. Keys are the canonical service base paths; values
 * are article slugs that exist in every locale (guarded by a unit test).
 * The card is skipped when the article is absent in the active locale.
 */
export const servicePillarArticle: Record<string, string> = {
  "/services/family-office-coordination":
    "travailler-conseillers-existants-family-office-coordinateur",
  "/services/consolidated-reporting":
    "reporting-consolide-patrimoine-multi-banques",
  "/services/investment-oversight":
    "normes-reporting-performance-twr-mwr-benchmarks",
  "/services/governance-succession":
    "charte-gouvernance-familiale-contenu-processus",
  "/services/tax-administration":
    "calendrier-annuel-famille-fortunee-suisse-echeances-fiscales",
  "/services/digital-vault":
    "family-office-digital-agregation-coffre-fort-cybersecurite",
  "/services/real-estate-transactions":
    "immobilier-patrimoine-familial-supervision-reporting",
  "/services/household-staff": "employer-personnel-maison-geneve-obligations",
  "/services/relocation-residence": "installation-geneve-checklist-administrative",
  "/services/domiciliation-mail": "adresse-correspondance-domicile-geneve",
  "/services/property-management": "gerance-bien-locatif-geneve",
};
