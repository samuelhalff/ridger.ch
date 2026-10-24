"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

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

// ─── validate-latest-article-guardrails.js: `updated` must not precede `date` ──

function runLatestValidator(latestExtra) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ridger-latest-"));
  fs.mkdirSync(path.join(dir, "src", "translations", "fr"), { recursive: true });
  const filler = Array.from({ length: 760 }, (_, i) => `mot${i % 40}`).join(" ");
  const article = (slug, title, date, extra = {}) => ({
    slug,
    title,
    description: `Description ${slug}`,
    date,
    category: "reporting",
    tags: ["a", "b", "c"],
    content: filler,
    ...extra,
  });
  const data = {
    Articles: [
      article("ancien-sujet-gouvernance", "Gouvernance familiale et assemblées annuelles", "2026-01-10"),
      article("dernier-article-reporting", "Reporting consolidé des comptes bancaires multiples", "2026-07-03", latestExtra),
    ],
  };
  fs.writeFileSync(path.join(dir, "src", "translations", "fr", "ressources.json"), JSON.stringify(data));
  const r = spawnSync(process.execPath, [path.join(__dirname, "validate-latest-article-guardrails.js")], { cwd: dir, encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return r;
}

test("latest-article validator: updated before date fails", () => {
  const r = runLatestValidator({ updated: "2026-07-02" });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /updated \(2026-07-02\) is before its date \(2026-07-03\)/);
});

test("latest-article validator: malformed updated fails", () => {
  const r = runLatestValidator({ updated: "yesterday" });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /invalid updated date/);
});

test("latest-article validator: updated on/after date, or absent, passes", () => {
  assert.equal(runLatestValidator({ updated: "2026-07-03" }).status, 0);
  assert.equal(runLatestValidator({ updated: "2026-10-24" }).status, 0);
  assert.equal(runLatestValidator({}).status, 0);
});

// ─── translate-articles.js carries updated / SEO fields / keywords ───────────

test("translate-articles keeps updated, backlogId, keywords and translates SEO fields", () => {
  const { buildLocalizedEntry, buildTranslatePrompt } = require("./translate-articles");
  const fr = {
    slug: "s", author: "Ridger", image: "i.avif", date: "2026-01-01", updated: "2026-10-24", category: "reporting", backlogId: "b-1",
    title: "Titre", seoTitle: "Titre seo", metaDescription: "Méta", imageAlt: "Alt", description: "Desc", content: "Contenu",
    tags: ["un", "deux", "trois"], keywords: { primary: "fr", secondary: ["a"] }, references: [{ labelKey: "l", url: "https://x.admin.ch" }], topicId: "t",
  };
  const local = { keywords: { primary: "en", secondary: ["b"] }, seoTitle: "Old seo", metaDescription: "Old meta", imageAlt: "Old alt", tags: ["one", "two", "three"] };
  const tr = { title: "Title", description: "Description", content: "Content", seoTitle: "Seo title", metaDescription: "Meta", imageAlt: "Alt text", tags: ["One", "Two", "Three"] };
  const out = buildLocalizedEntry(fr, local, tr);
  assert.equal(out.updated, "2026-10-24");
  assert.equal(out.backlogId, "b-1");
  assert.equal(out.topicId, "t");
  assert.deepEqual(out.keywords, { primary: "en", secondary: ["b"] });
  assert.equal(out.seoTitle, "Seo title");
  assert.equal(out.metaDescription, "Meta");
  assert.equal(out.imageAlt, "Alt text");
  assert.deepEqual(out.tags, ["one", "two", "three"]);
  // model omits SEO fields: keep the locale's, never silently ship French
  const kept = buildLocalizedEntry(fr, local, { title: "T", description: "D", content: "C" });
  assert.equal(kept.seoTitle, "Old seo");
  assert.deepEqual(kept.tags, ["one", "two", "three"]);
  assert.match(buildTranslatePrompt("en", fr), /seoTitle/);
  // model omits a SEO value and there is no prior localized one: fail, never copy French
  const { MissingSeoTranslationError } = require("./translate-articles");
  assert.throws(
    () => buildLocalizedEntry(fr, { tags: ["one", "two", "three"] }, { title: "T", description: "D", content: "C" }),
    MissingSeoTranslationError,
  );
  assert.throws(
    () => buildLocalizedEntry(fr, null, { title: "T", description: "D", content: "C", seoTitle: "S", metaDescription: "M" }),
    /imageAlt/,
  );
});
