"use strict";

/**
 * Official-only reference policy for articles that make legal, tax or permit
 * statements (i.e. virtually every Ridger article): every reference must pass
 * the allowlist in referenceValidator.js AND belong to an official authority
 * or body (isOfficialReference), with at least MIN_OFFICIAL_REFERENCES of them.
 * External links in the body are held to the same rule.
 */

const { isOfficialReference } = require("./referenceValidator");

const MIN_OFFICIAL_REFERENCES = 3;

// Categories whose articles are legal/tax/permit by nature.
const LEGAL_CATEGORIES = new Set(["fiscalite", "patrimoine", "gouvernance", "emploi-domestique", "family-office"]);

// Markers of a legal/tax/permit statement in any of the 5 locales.
const LEGAL_STATEMENT_RE = new RegExp(
  [
    "\\bart(?:\\.|icle|ikel|ículo|igo)\\s*\\d",
    "\\b(?:RS|SR)\\s*\\d",
    "\\b(?:LIFD|DBG|LHID|StHG|LPP|BVG|LAVS|AHVG|LAA|UVG|LEI|AIG|OASA|VZAE|LFAIE|BewG|CO|OR|CC|ZGB|TVA|MWST|LSFin|FIDLEG|LEFin|FINIG)\\b",
    "imp[ôo]t|fiscal|imposition|permis\\b|autorisation|\\bloi\\b|ordonnance|succession|donation",
    "steuer|gesetz|bewilligung|aufenthalt|verordnung|erbschaft|schenkung",
    "\\btax(?:es|ation)?\\b|\\bpermit|\\blaw\\b|\\bordinance|inheritance|residence",
    "impuesto|tributa|\\bley\\b|permiso|autorizaci[óo]n|herencia",
    "imposto|tribut[áa]|\\blei\\b|autoriza[çc][ãa]o|heran[çc]a|resid[êe]ncia",
  ].join("|"),
  "iu",
);

function makesLegalTaxPermitStatements(article) {
  if (!article || typeof article !== "object") return false;
  if (LEGAL_CATEGORIES.has(article.category)) return true;
  const text = [article.title, article.description, article.content].filter((v) => typeof v === "string").join("\n");
  return LEGAL_STATEMENT_RE.test(text);
}

/**
 * @returns {string[]} problems (empty when the article complies or the policy
 * does not apply). `force: true` applies the policy regardless of content.
 */
function checkOfficialOnlyReferences(article, { force = false } = {}) {
  if (!force && !makesLegalTaxPermitStatements(article)) return [];
  const problems = [];
  const refs = Array.isArray(article?.references) ? article.references : [];
  const nonOfficial = refs.map((r) => r?.url).filter((u) => !isOfficialReference(u));
  if (nonOfficial.length) {
    problems.push(`legal/tax/permit article cites non-official reference(s): ${nonOfficial.join(", ")}`);
  }
  const official = refs.length - nonOfficial.length;
  if (official < MIN_OFFICIAL_REFERENCES) {
    problems.push(`legal/tax/permit article needs at least ${MIN_OFFICIAL_REFERENCES} official references (has ${official})`);
  }
  const bodyLinks = [...String(article?.content || "").matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  const badBody = [...new Set(bodyLinks.filter((u) => !isOfficialReference(u)))];
  if (badBody.length) problems.push(`legal/tax/permit article links non-official source(s) in the body: ${badBody.join(", ")}`);
  return problems;
}

module.exports = {
  LEGAL_CATEGORIES,
  MIN_OFFICIAL_REFERENCES,
  checkOfficialOnlyReferences,
  makesLegalTaxPermitStatements,
};
