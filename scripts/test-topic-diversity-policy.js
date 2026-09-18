#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const {
  describeTopic,
  detectTopic,
  findRecentTopicConflict,
} = require("./lib/articleTopicGuardrails");
const {
  EVERGREEN_TOPICS,
  guessCategoryFromText,
  pickOutlineForCategory,
} = require("./lib/trends");
const {
  buildTopicGuidanceForAgent,
  getAvailableTopics,
  validateArticleTopicAgainstAvailable,
} = require("./lib/topicSelector");

const treasuryArticle = {
  slug: "tresorerie-pme-2026-franc-fort-retards-paiement",
  title: "Trésorerie PME en 2026 : 7 réflexes face au franc fort, à l'énergie et aux retards de paiement",
  description: "Cash-flow, budget, relances clients et pilotage de trésorerie.",
};

assert.equal(
  detectTopic(treasuryArticle),
  "finance",
  "paiement/cash-flow/trésorerie should classify as finance, not payroll",
);

assert.equal(
  detectTopic({
    slug: "odoo-suisse-parametrage-comptabilite-tva-erreurs",
    title: "Odoo en Suisse : optimiser la comptabilité et gérer la TVA",
    description:
      "Configuration d'Odoo, plan comptable suisse, intégration des taux de TVA locaux et erreurs fréquentes.",
  }),
  "odoo",
  "Odoo accounting/TVA articles should classify as Odoo, not generic accounting or tax",
);

assert.equal(
  detectTopic({
    slug: "revision-comptes-pme-controle-ordinaire-restreint",
    title: "Révision des comptes en Suisse : contrôle ordinaire ou restreint pour PME",
  }),
  "audit",
  "révision/audit topics should classify as audit",
);

assert.equal(
  detectTopic({
    slug: "succession-entrepreneur-pme-suisse-fiscalite",
    title:
      "Succession de l'entrepreneur: préparer patrimoine, société et fiscalité avant l'urgence",
    description:
      "Succession entrepreneur, transmission PME, patrimoine, fiscalité succession, actions société, Suisse.",
  }),
  "family-office",
  "specific succession/patrimoine topics should classify as family office, not generic tax",
);

assert.equal(
  detectTopic({
    slug: "ayants-droit-economiques-registre-actions-suisse",
    title:
      "Ayants droit économiques et registre des actions: obligations pratiques pour SA et Sàrl",
  }),
  "corporate",
  "beneficial-owner and share-register topics should classify as corporate governance",
);

assert.equal(
  detectTopic({
    slug: "controle-interne-pme-securisation-facturation-achats-paiements-acces-bancaires-2026",
    title:
      "Contrôle interne PME : sécuriser facturation, achats, paiements et accès bancaires en 2026",
    description:
      "Contrôles concrets, séparation des tâches, matrice d'accès et gouvernance pour limiter fraudes ou erreurs.",
  }),
  "accounting",
  "internal-control process topics should classify as accounting, not corporate governance",
);

assert.equal(describeTopic("audit"), "Audit & révision");

assert.equal(
  guessCategoryFromText("Révision restreinte en Suisse pour PME").category,
  "audit",
  "trend/category detection should support audit topics",
);

assert.deepEqual(pickOutlineForCategory("audit"), [
  "H2 seuils et obligations",
  "H2 contrôle ordinaire vs restreint",
  "H2 préparation du dossier",
  "H2 erreurs fréquentes",
  "FAQ",
]);

assert.ok(
  EVERGREEN_TOPICS.some((topic) => topic.category === "audit"),
  "evergreen rotation should include audit/révision topics",
);

const requiredLeadGenTopics = [
  "frontaliers-teletravail-paie-suisse-france",
  "tva-prestations-internationales-suisse-reverse-charge",
  "migration-odoo-depuis-excel-legacy-erp",
  "debiteurs-recouvrement-retards-paiement-pme",
  "archivage-numerique-comptable-suisse-pme",
  "succursale-ou-filiale-suisse-entreprise-etrangere",
  "ayants-droit-economiques-registre-actions-suisse",
  "succession-entrepreneur-pme-suisse-fiscalite",
];

for (const slug of requiredLeadGenTopics) {
  assert.ok(
    EVERGREEN_TOPICS.some((topic) => topic.topic === slug),
    `evergreen rotation should include ${slug}`,
  );
}

const rotationFixture = {
  Articles: [
    {
      slug: "revision-comptes-pme-controle-ordinaire-restreint",
      title: "Révision des comptes en Suisse: contrôle ordinaire ou restreint pour PME",
      date: "2026-05-01",
    },
    {
      slug: "paie-salaires-cotisations-avs-lpp-laa",
      title: "Paie et salaires: cotisations AVS, LPP et LAA",
      date: "2026-05-02",
    },
  ],
};
const availableTopics = getAvailableTopics(rotationFixture, ["audit"], 2);
assert.ok(
  !availableTopics.availableTopics.some((topic) => topic.topic === "audit"),
  "topic selector should exclude topics already in the rotation window",
);
assert.ok(
  buildTopicGuidanceForAgent(availableTopics).includes("THÈMES DISPONIBLES"),
  "topic guidance should show the agent the valid topic pool",
);
assert.equal(
  validateArticleTopicAgainstAvailable(
    {
      slug: "audit-revision-pme-geneve",
      title: "Audit et révision des PME genevoises",
    },
    availableTopics,
  ).valid,
  false,
  "topic validator should reject generated articles outside the valid topic pool",
);

assert.equal(
  findRecentTopicConflict(
    [
      {
        slug: "controle-interne-pme-securisation-facturation-achats-paiements-acces-bancaires-2026",
        title:
          "Contrôle interne PME : sécuriser facturation, achats, paiements et accès bancaires en 2026",
        description:
          "Contrôles concrets, séparation des tâches, matrice d'accès et gouvernance pour limiter fraudes ou erreurs.",
        date: "2026-05-31",
      },
    ],
    {
      slug: "inventaire-stock-cloture-comptable-pme-suisse",
      title:
        "Inventaire et stock : préparer la clôture comptable PME suisse sans écarts coûteux",
      description:
        "Valorisation des stocks, inventaire physique, documentation pour réviseurs et corrections avant clôture.",
      date: "2026-06-06",
    },
    { windowSize: 10 },
  ),
  null,
  "distinct subtopics inside the same broad service area should remain eligible",
);

const ciFailureTopicAnalysis = {
  availableTopics: [
    { topic: "family-office", label: "Family office & patrimoine" },
    { topic: "incorporation", label: "Incorporation & constitution" },
  ],
  avoidedTopics: ["tax", "payroll", "audit"],
  avoidedTopicsLabels: ["Fiscalité & TVA", "Paie & salaires", "Audit & révision"],
};

assert.equal(
  validateArticleTopicAgainstAvailable(
    {
      slug: "succession-entrepreneur-pme-suisse-fiscalite",
      title:
        "Succession de l'entrepreneur: préparer patrimoine, société et fiscalité avant l'urgence",
      description:
        "Succession entrepreneur, transmission PME, patrimoine, fiscalité succession, actions société, Suisse.",
    },
    ciFailureTopicAnalysis,
  ).valid,
  true,
  "available family-office topics should not be rejected only because they mention fiscalité",
);

const rejectedTopic = validateArticleTopicAgainstAvailable(
  {
    slug: "tva-suisse-declaration",
    title: "TVA Suisse: délais, décomptes et erreurs fréquentes",
  },
  ciFailureTopicAnalysis,
);
assert.equal(rejectedTopic.valid, false);
assert.ok(
  rejectedTopic.error.includes("Family office & patrimoine"),
  "rotation errors should list available topic labels",
);

console.log("Topic diversity policy tests passed");
