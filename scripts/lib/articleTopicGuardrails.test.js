const test = require("node:test");
const assert = require("node:assert/strict");

const {
  detectTopic,
  findRecentTitleConflict,
  findRecentTopicConflict,
} = require("./articleTopicGuardrails");

test("detectTopic classifies commercial registry articles as incorporation", () => {
  assert.equal(
    detectTopic({
      slug: "guide-registre-commerce-suisse-documents-delais-erreurs-couts",
      title:
        "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
      description:
        "Découvrez comment inscrire votre entreprise, quels documents fournir et quels délais prévoir.",
    }),
    "incorporation",
  );
});

test("findRecentTitleConflict rejects exact duplicate titles after normalization", () => {
  const conflict = findRecentTitleConflict(
    [
      {
        slug: "registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
        title:
          "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
        date: "2026-04-13",
      },
    ],
    {
      slug: "guide-registre-commerce-suisse-documents-delais-erreurs-couts",
      title:
        "Registre du Commerce en Suisse: documents, delais, erreurs et couts (guide pratique)",
      date: "2026-04-27",
    },
  );

  assert.deepEqual(conflict, {
    code: "DUPLICATE_TITLE",
    previousSlug: "registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
    previousTitle:
      "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
  });
});

test("findRecentTitleConflict rejects near-duplicate commercial registry titles", () => {
  const conflict = findRecentTitleConflict(
    [
      {
        slug: "registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
        title:
          "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
        date: "2026-04-13",
      },
    ],
    {
      slug: "registre-commerce-suisse-guide-inscription-documents-delais-erreurs-couts-2026",
      title:
        "Registre du commerce en Suisse : guide d'inscription, documents, délais, erreurs et coûts",
      date: "2026-04-27",
    },
  );

  assert.deepEqual(conflict, {
    code: "DUPLICATE_TITLE_FINGERPRINT",
    previousSlug: "registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
    previousTitle:
      "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
  });
});

test("findRecentTopicConflict rejects recent commercial registry repeats", () => {
  const conflict = findRecentTopicConflict(
    [
      {
        slug: "registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
        title:
          "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
        description:
          "Guide pratique pour l'inscription au registre du commerce.",
        date: "2026-04-13",
      },
    ],
    {
      slug: "guide-registre-commerce-suisse-documents-delais-erreurs-couts",
      title:
        "Registre du commerce en Suisse : étapes, documents, délais et erreurs (Guide pratique 2026)",
      description:
        "Inscription, statuts, dossier, canton et coûts pour les entreprises suisses.",
      date: "2026-04-27",
    },
    { windowSize: 10 },
  );

  assert.deepEqual(conflict, {
    code: "TOPIC_DUPLICATE",
    previousSlug: "registre-commerce-suisse-guide-pratique-documents-delais-erreurs",
    previousTitle:
      "Registre du commerce en Suisse : documents, délais, erreurs et coûts (Guide pratique)",
    topic: "incorporation",
  });
});
