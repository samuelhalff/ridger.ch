"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  findAllTimeNearDuplicate,
} = require("./lib/articleTopicGuardrails");

// Real near-duplicates the pipeline produced in Feb–Jul 2026, months apart —
// exactly the case the windowed checks missed. The all-time gate must catch
// every pairing of these three.
const substanceGuide = {
  slug: "domiciliation-suisse-substance-risques-guide-2026",
  title: "Domiciliation en Suisse : substance, risques et contrôles — le guide 2026",
  description:
    "Substance exigée, risques et contrôles pour les sociétés domiciliées en Suisse.",
};
const substanceVerifications = {
  slug: "domiciliation-suisse-entreprise-verifications-substance-risques-2026",
  title:
    "Domiciliation d'entreprise en Suisse : vérifications, substance et risques (2026)",
  description:
    "Vérifications et exigences de substance pour la domiciliation d'entreprise en Suisse : risques et contrôles.",
};
const substanceContrat = {
  slug: "domiciliation-suisse-entreprise-contrat-substance-risques-2026",
  title:
    "Domiciliation d'entreprise en Suisse : contrat, substance et risques (2026)",
  description:
    "Contrat de domiciliation, exigences de substance et risques pour les entreprises domiciliées en Suisse.",
};

test("all-time gate catches the real domiciliation near-duplicates", () => {
  assert.ok(findAllTimeNearDuplicate([substanceGuide], substanceVerifications));
  assert.ok(findAllTimeNearDuplicate([substanceGuide], substanceContrat));
  assert.ok(
    findAllTimeNearDuplicate([substanceVerifications], substanceContrat),
  );
});

test("all-time gate lets distinct articles in the same topic family pass", () => {
  // Same 'domiciliation' topic, genuinely different angle (local money page).
  const domGeneve = {
    slug: "domiciliation-entreprise-geneve",
    title: "Domiciliation d'entreprise à Genève : siège social, options et coûts (2026)",
    description:
      "Siège social à Genève : options de domiciliation, services inclus et démarches.",
  };
  assert.equal(findAllTimeNearDuplicate([substanceGuide], domGeneve), null);

  // Same 'tax' family, different intents (VAT filing vs Odoo VAT setup).
  const tvaDeclaration = {
    slug: "optimiser-declaration-tva-suisse-2026-erreurs-courantes-et-guides-concrets-pme-independants",
    title:
      "Optimiser sa déclaration TVA suisse 2026 : erreurs courantes et conseils concrets",
    description:
      "Décomptes TVA : erreurs courantes, délais et conseils concrets pour PME et indépendants.",
  };
  const odooTva = {
    slug: "odoo-suisse-parametrage-tva-erreurs",
    title: "Odoo en Suisse : paramétrage TVA et erreurs à éviter",
    description:
      "Paramétrer la TVA dans Odoo : taux, comptes et contrôles pour une comptabilité suisse fiable.",
  };
  assert.equal(findAllTimeNearDuplicate([tvaDeclaration], odooTva), null);
});

test("all-time gate ignores the article itself (same slug)", () => {
  assert.equal(
    findAllTimeNearDuplicate([substanceGuide], substanceGuide),
    null,
  );
});

test("all-time gate passes cross-intent Odoo pairs (regression: calibration boundary)", () => {
  // Measured at title overlap 3 / ratio 0.75 with topic score 0.11–0.14 —
  // different intent (release notes vs VAT setup), must NOT be flagged.
  const odooReleaseNotes = {
    slug: "odoo-18-nouveautes-comptabilite-suisse-2025",
    title: "Odoo 18 : les nouveautés comptabilité et gestion pour PME suisses en 2025",
    description:
      "Tour des nouveautés d'Odoo 18 pour la gestion et la comptabilité des PME suisses.",
  };
  const odooTvaSetup = {
    slug: "odoo-suisse-parametrage-tva-erreurs",
    title: "Odoo en Suisse : paramétrage TVA et erreurs à éviter",
    description:
      "Paramétrer correctement la TVA suisse dans Odoo : taux, positions fiscales et contrôles.",
  };
  assert.equal(findAllTimeNearDuplicate([odooReleaseNotes], odooTvaSetup), null);
});

test("all-time gate still catches weak-title duplicates with high topic similarity", () => {
  // Measured at title 3/0.75 but topic score 0.43 — a genuine duplicate that
  // the supported-title rule must keep catching.
  const chargesA = {
    slug: "optimisation-charges-sociales-suisse-romande-guide-independants-pme-2025",
    title:
      "Optimisation des charges sociales en Suisse romande : guide pratique pour PME et indépendants (2025)",
    description:
      "Guide pratique pour optimiser les charges sociales des PME et indépendants en Suisse romande : cotisations AVS, LPP, allocations et erreurs à éviter.",
  };
  const chargesB = {
    slug: "optimiser-les-charges-sociales-en-suisse-romande-2026-erreurs-frequentes-pour-pme-independants",
    title:
      "Optimiser les charges sociales en Suisse romande (2026) : erreurs fréquentes pour PME et indépendants",
    description:
      "Optimiser les charges sociales en Suisse romande : cotisations AVS et LPP, allocations familiales, erreurs fréquentes des PME et indépendants.",
  };
  assert.ok(findAllTimeNearDuplicate([chargesA], chargesB));
});
