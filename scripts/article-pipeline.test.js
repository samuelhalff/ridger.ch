"use strict";

/**
 * Tests for the pure parts of the Ridger article pipeline:
 * topic picker & diversity, keyword derivation from autocomplete JSON, hard
 * rules (incl. the 2026 legal-audit rejections), SEO/GEO structure checks,
 * number parity, FAQ extraction, backlog integrity — plus one offline
 * end-to-end dry run through the real orchestrator with a mocked model.
 * No network, no Azure.
 */

const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const kw = require("./lib/keywordResearch");
const rules = require("./lib/ridgerArticleRules");
const backlogLib = require("./lib/articleBacklog");

const ROOT = path.join(__dirname, "..");

// ─── Keyword research ─────────────────────────────────────────────────────

test("parseAutocompleteResponse reads the firefox client format and rejects junk", () => {
  const raw = JSON.stringify(["rachat lpp", ["rachat lpp", "Rachat LPP conditions", "rachat lpp impot"]]);
  assert.deepEqual(kw.parseAutocompleteResponse(raw), ["rachat lpp", "rachat lpp conditions", "rachat lpp impot"]);
  assert.deepEqual(kw.parseAutocompleteResponse("<html>consent</html>"), []);
  assert.deepEqual(kw.parseAutocompleteResponse(""), []);
  assert.deepEqual(kw.parseAutocompleteResponse(["q", "nope"]), []);
});

test("buildAutocompleteUrl targets the requested market", () => {
  const u = new URL(kw.buildAutocompleteUrl("impôt fortune", { hl: "fr", gl: "ch" }));
  assert.equal(u.hostname, "suggestqueries.google.com");
  assert.equal(u.searchParams.get("client"), "firefox");
  assert.equal(u.searchParams.get("hl"), "fr");
  assert.equal(u.searchParams.get("gl"), "ch");
  assert.equal(u.searchParams.get("q"), "impôt fortune");
});

test("markets cover fr-CH/fr-FR, en-GB/en-US, de-CH/de-DE, es-ES, pt-PT/pt-BR", () => {
  const flat = Object.entries(kw.AUTOCOMPLETE_MARKETS).flatMap(([l, ms]) => ms.map((m) => `${l}:${m.hl}-${m.gl}`));
  for (const want of ["fr:fr-ch", "fr:fr-fr", "en:en-gb", "en:en-us", "de:de-ch", "de:de-de", "es:es-es", "pt:pt-PT-pt", "pt:pt-BR-br"]) {
    assert.ok(flat.includes(want), want);
  }
});

const market = { hl: "fr", gl: "ch", weight: 1.5 };
const frResults = [
  { query: "rachat lpp", market, suggestions: ["rachat lpp", "rachat lpp conditions", "rachat lpp deduction impot", "rachat lpp suisse", "rachat lpp 3 ans avant la retraite", "rachat lpp frontalier", "rachat lpp par l'employeur", "rachat lpp c est quoi", "rachat lpp indépendant"] },
  { query: "rachat lpp ", market, suggestions: ["rachat lpp conditions", "rachat lpp deduction impot", "rachat lpp suisse", "rachat lpp prix", "rachat lpp 2019", "rachat lppj"] },
  { query: "rachat lpp comment", market, suggestions: ["rachat lpp comment faire", "rachat lpp comment déclarer", "rachat lpp comment ça marche"] },
  { query: "comment rachat lpp", market, suggestions: ["comment rachat lpp suisse", "comment rachat lpp geneve"] },
  { query: "rachat 2e pilier", market, suggestions: ["rachat 2e pilier impot", "rachat 2e pilier fiduciaire geneve"] },
];

test("deriveKeywords: confirmed head term becomes primary; long tails become secondary", () => {
  const out = kw.deriveKeywords("fr", {
    seed: "rachat lpp déduction",
    targetKeywords: ["rachat lpp", "rachat 2e pilier", "déduction rachat lpp"],
    results: frResults,
    avoidTerms: ["fiduciaire"],
  });
  assert.equal(out.primary, "rachat lpp");
  assert.ok(out.secondary.length >= 5 && out.secondary.length <= 10, `secondary=${out.secondary.length}`);
  assert.ok(out.secondary.includes("rachat lpp conditions"));
  assert.ok(out.questions.some((q) => q.includes("comment")), "keeps real questions");
  const all = [out.primary, ...out.secondary, ...out.questions].join(" | ");
  assert.doesNotMatch(all, /prix/, "pricing queries excluded");
  assert.doesNotMatch(all, /2019/, "stale years excluded");
  assert.doesNotMatch(all, /lppj/, "truncated tokens excluded");
  assert.doesNotMatch(all, /fiduciaire/, "ark core terms excluded");
  assert.doesNotMatch(all, /comment rachat lpp suisse/, "prefix echoes dropped");
  assert.equal(out.stats.source, "autocomplete");
});

test("deriveKeywords falls back to backlog targets when autocomplete is empty", () => {
  const out = kw.deriveKeywords("de", {
    seed: "pk einkauf steuern",
    targetKeywords: ["pk einkauf", "einkauf pensionskasse", "bvg einkauf steuern"],
    results: [],
  });
  assert.equal(out.primary, "pk einkauf");
  // targets first, then the seed phrase as last-resort top-up
  assert.deepEqual(out.secondary, ["einkauf pensionskasse", "bvg einkauf steuern", "pk einkauf steuern"]);
  assert.equal(out.stats.source, "backlog-fallback");
});

test("deriveKeywords drops one-token location variants", () => {
  const m = { hl: "de", gl: "ch", weight: 1 };
  const out = kw.deriveKeywords("de", {
    seed: "pk einkauf",
    targetKeywords: ["pk einkauf"],
    results: [{ query: "pk einkauf ", market: m, suggestions: ["pk einkauf steuern abziehen geneve", "pk einkauf steuern abziehen carouge", "pk einkauf steuern abziehen veyrier", "pk einkauf sinnvoll", "pk einkauf nach scheidung"] }],
  });
  const variants = out.secondary.filter((s) => s.startsWith("pk einkauf steuern abziehen"));
  assert.equal(variants.length, 1);
});

test("alignKeywordSets equalises secondary lengths across locales (index-based key parity)", () => {
  const { aligned, count, ok } = kw.alignKeywordSets({
    fr: { primary: "a", secondary: ["1", "2", "3", "4", "5", "6"] },
    en: { primary: "b", secondary: ["1", "2", "3", "4", "5"] },
  });
  assert.equal(count, 5);
  assert.ok(ok);
  assert.equal(aligned.fr.secondary.length, aligned.en.secondary.length);
});

test("containsKeywordLoosely is accent- and plural-tolerant", () => {
  assert.ok(kw.containsKeywordLoosely("Rachat LPP : quelles déductions ?", "rachat lpp deduction"));
  assert.ok(kw.containsKeywordLoosely("Impôt sur la fortune à Genève", "impot fortune geneve"));
  assert.ok(!kw.containsKeywordLoosely("Assurance ménage", "rachat lpp"));
});

test("slugify produces clean ascii kebab-case", () => {
  assert.equal(kw.slugify("Impôt sur la fortune à Genève : l'essentiel"), "impot-sur-la-fortune-a-geneve-l-essentiel");
});

test("trend signal parsing and matching are best-effort and pure", () => {
  const xml = "<rss><channel><item><title>Rachat LPP réforme</title></item><item><title>Match de hockey</title></item></channel></rss>";
  const titles = kw.parseTrendingRss(xml);
  assert.deepEqual(titles, ["rachat lpp réforme", "match de hockey"]);
  const matches = kw.matchTrending(titles, { fr: { primary: "rachat lpp", secondary: ["rachat lpp réforme"] } });
  assert.deepEqual(matches, ["rachat lpp réforme"]);
});

// ─── Topic picker & diversity ─────────────────────────────────────────────

function item(id, category, theme, extra = {}) {
  return {
    id, category, theme, audience: "affluent", priority: 2, service: "/services/tax-administration",
    angle: `Angle ${id}`,
    seeds: { fr: id, en: id, de: id, es: id, pt: id },
    targetKeywords: { fr: [`${id} alpha`], en: [id], de: [id], es: [id], pt: [id] },
    ...extra,
  };
}

const themes = { a: {}, b: {}, c: {}, d: {}, e: {} };

test("picker never repeats the last article's category", () => {
  const backlog = { themes, items: [item("zeta-one", "fiscalite", "a"), item("zeta-two", "patrimoine", "b")] };
  const articles = [{ slug: "old", title: "Ancien article", date: "2026-09-01", category: "fiscalite" }];
  const { ranked, excluded } = backlogLib.rankBacklogCandidates({ backlog, articles, today: "2026-09-30" });
  assert.deepEqual(ranked.map((r) => r.item.id), ["zeta-two"]);
  assert.ok(excluded.some((e) => e.id === "zeta-one" && /same category/.test(e.reason)));
});

test("picker skips published items and themes used in the last 4 generated articles", () => {
  const backlog = {
    themes,
    items: [item("kappa-one", "patrimoine", "a"), item("kappa-two", "gouvernance", "a"), item("kappa-three", "reporting", "c")],
  };
  const articles = [{ slug: "k1", title: "Kappa un", date: "2026-09-20", category: "patrimoine", backlogId: "kappa-one" }];
  const { ranked, excluded } = backlogLib.rankBacklogCandidates({ backlog, articles, today: "2026-09-30" });
  assert.deepEqual(ranked.map((r) => r.item.id), ["kappa-three"]);
  assert.ok(excluded.some((e) => e.id === "kappa-one" && /published/.test(e.reason)));
  assert.ok(excluded.some((e) => e.id === "kappa-two" && /theme a/.test(e.reason)));
});

test("picker boosts seasonal items and under-used categories; skipRotation lifts the category rule", () => {
  const backlog = {
    themes,
    items: [item("lambda-one", "fiscalite", "a", { months: [9] }), item("lambda-two", "reporting", "b"), item("lambda-three", "vie-pratique", "c")],
  };
  const articles = [{ slug: "l0", title: "Lambda zéro", date: "2026-09-10", category: "vie-pratique" }];
  const { ranked } = backlogLib.rankBacklogCandidates({ backlog, articles, today: "2026-09-30" });
  assert.equal(ranked[0].item.id, "lambda-one");
  const lifted = backlogLib.rankBacklogCandidates({ backlog, articles, today: "2026-09-30", skipRotation: true });
  assert.ok(lifted.ranked.some((r) => r.item.id === "lambda-three"));
});

test("legacy (hand-written) articles feed theme rotation, coverage and audience alternation", () => {
  const backlog = {
    themes,
    items: [
      item("nu-one", "patrimoine", "a"),
      item("nu-two", "gouvernance", "b"),
      item("nu-three", "reporting", "c", { audience: "uhnw" }),
      item("nu-four", "fiscalite", "d", { audience: "accessible" }),
    ],
    legacyArticles: {
      "old-a": { theme: "a", audience: "accessible" },
      "old-b": { theme: "e", audience: "accessible", backlogId: "nu-two" },
    },
  };
  const articles = [
    { slug: "old-a", title: "Ancien A", date: "2026-09-20", category: "vie-pratique" },
    { slug: "old-b", title: "Ancien B", date: "2026-09-01", category: "family-office" },
  ];
  const { ranked, excluded } = backlogLib.rankBacklogCandidates({ backlog, articles, today: "2026-09-30" });
  // Theme "a" comes from the legacy mapping (no backlogId on the article).
  assert.ok(excluded.some((e) => e.id === "nu-one" && /theme a/.test(e.reason)));
  // A legacy article covering a backlog item marks it as published.
  assert.ok(excluded.some((e) => e.id === "nu-two" && /published/.test(e.reason)));
  // The last article's legacy audience (accessible) drives alternation.
  const three = ranked.find((r) => r.item.id === "nu-three");
  const four = ranked.find((r) => r.item.id === "nu-four");
  assert.ok(three.reasons.includes("audience alternation"));
  assert.ok(!four.reasons.includes("audience alternation"));
  assert.deepEqual(backlogLib.checkBacklogCoverage(backlog, articles), []);
  assert.deepEqual(backlogLib.validateBacklog({ ...backlog, items: [] }).filter((p) => /legacy/.test(p)), [
    "legacy old-b: unknown backlogId nu-two",
  ]);
  const drift = backlogLib.checkBacklogCoverage(backlog, [...articles, { slug: "new-x", title: "X" }]);
  assert.deepEqual(drift, ["article new-x has no backlogId and no legacyArticles entry"]);
  const stale = backlogLib.checkBacklogCoverage(backlog, [articles[0]]);
  assert.deepEqual(stale, ["legacyArticles entry old-b matches no article"]);
});

test("every published article is traceable to the backlog (backlogId or legacyArticles)", () => {
  const backlog = backlogLib.loadBacklog(ROOT);
  const fr = require("../src/translations/fr/ressources.json").Articles;
  assert.deepEqual(backlogLib.checkBacklogCoverage(backlog, fr), []);
});

test("newest-first ordering treats later array position as newer on equal dates", () => {
  const s = backlogLib.sortArticlesNewestFirst([
    { slug: "a", date: "2026-09-30" },
    { slug: "b", date: "2026-09-30" },
    { slug: "c", date: "2026-09-01" },
  ]);
  assert.deepEqual(s.map((x) => x.slug), ["b", "a", "c"]);
});

test("chooseWithDemand lets observed demand break near ties", () => {
  const ranked = [
    { item: { id: "x" }, score: 40 },
    { item: { id: "y" }, score: 38 },
  ];
  assert.equal(backlogLib.chooseWithDemand(ranked, { x: 1, y: 20 }).item.id, "y");
  assert.equal(backlogLib.chooseWithDemand(ranked, {}).item.id, "x");
});

test("forced topic resolves a backlog id or an ad-hoc topic", () => {
  const backlog = { themes, items: [item("mu-one", "reporting", "a")] };
  assert.equal(backlogLib.resolveForcedTopic(backlog, { topic: "mu-one" }).id, "mu-one");
  const adhoc = backlogLib.resolveForcedTopic(backlog, { topic: "Impôt à la source", category: "fiscalite" });
  assert.equal(adhoc.category, "fiscalite");
  assert.ok(adhoc.id.startsWith("adhoc-impot-a-la-source"));
});

test("data/article-backlog.json is valid, broad and diverse", () => {
  const backlog = backlogLib.loadBacklog(ROOT);
  assert.deepEqual(backlogLib.validateBacklog(backlog), []);
  assert.ok(backlog.items.length >= 60, `items=${backlog.items.length}`);
  const themesUsed = new Set(backlog.items.map((i) => i.theme));
  assert.ok(themesUsed.size >= 16, `themes=${themesUsed.size}`);
  const accessible = backlog.items.filter((i) => i.audience === "accessible").length;
  assert.ok(accessible / backlog.items.length >= 0.3, "accessible topics, not only UHNW");
  for (const i of backlog.items) {
    assert.ok(rules.CANONICAL_SERVICES.includes(i.service), `${i.id} service ${i.service}`);
    for (const l of rules.LOCALES) assert.ok(i.seeds[l], `${i.id} seed ${l}`);
  }
  for (const l of rules.LOCALES) assert.ok(backlog.arkCoreTerms[l].length >= 5, `arkCoreTerms ${l}`);
});

test("backlog items do not near-duplicate existing Ridger articles", () => {
  const backlog = backlogLib.loadBacklog(ROOT);
  const fr = require("../src/translations/fr/ressources.json").Articles;
  const published = new Set(fr.map((a) => a.slug));
  for (const i of backlog.items) assert.ok(!published.has(i.id), `${i.id} is an existing slug`);
});

// ─── Hard rules ───────────────────────────────────────────────────────────

const art = (content, extra = {}) => ({ title: "T", description: "", content, ...extra });
const codes = (content) => rules.checkHardRules(art(content)).map((v) => v.code);

test("hard rules: prices, quote tool, AI assistant, e-mail, guarantees, US persons", () => {
  assert.ok(codes("Nos honoraires démarrent à CHF 5'000 par mois.").includes("PRICE"));
  assert.ok(codes("Our fees start from CHF 20,000 per year.").includes("PRICE"));
  assert.ok(codes("Demandez un devis en ligne dès aujourd'hui.").includes("QUOTE_TOOL"));
  assert.ok(codes("Notre assistant IA vous répond.").includes("AI_ASSISTANT"));
  assert.ok(codes("Ask our AI assistant anything.").includes("AI_ASSISTANT"));
  assert.ok(codes("Écrivez à contact@ridger.ch pour en savoir plus.").includes("EMAIL"));
  assert.ok(codes("Nous garantissons un rendement stable.").includes("GUARANTEE"));
  assert.ok(codes("Savings are guaranteed with this setup.").includes("GUARANTEE"));
  assert.ok(codes("A US trust can shelter US persons.").includes("US_PERSON"));
  assert.ok(codes("Pour les US persons, la FATCA complique tout.").includes("US_PERSON"));
});

test("hard rules allow legitimate factual phrasing", () => {
  assert.deepEqual(codes("Le salaire minimum du CTT-EDom est fixé par le canton ; la garantie de loyer est plafonnée."), []);
  assert.deepEqual(codes("esisuisse garantit les dépôts jusqu'à 100 000 francs par client."), []);
  assert.deepEqual(codes("Ridger ne garantit aucun résultat et ne rend pas de décision."), []);
  assert.deepEqual(codes("Il faut disposer de CHF 5 à 10 millions pour justifier une telle structure."), []);
});

test("Ark group may be mentioned at most once", () => {
  assert.deepEqual(codes("Ridger fait partie du groupe Ark."), []);
  assert.ok(codes("Ark est là. Le groupe Ark aussi.").includes("ARK_MENTIONS"));
  assert.deepEqual(codes("Nous parlons d'arkose et de Parker."), [], "no false match on substrings");
});

test("legal audit: 183-day myth rejected in all locales, correct uses allowed", () => {
  assert.ok(codes("En Suisse, vous devenez résident fiscal après 183 jours de présence.").includes("LEGAL_183_DAYS"));
  assert.ok(codes("You become Swiss tax resident after 183 days.").includes("LEGAL_183_DAYS"));
  assert.ok(codes("Nach 183 Tagen sind Sie in der Schweiz steuerpflichtig.").includes("LEGAL_183_DAYS"));
  assert.ok(codes("Tras 183 días en Suiza pasa a ser residente fiscal.").includes("LEGAL_183_DAYS"));
  assert.ok(codes("Após 183 dias na Suíça torna-se residente fiscal.").includes("LEGAL_183_DAYS"));
  assert.deepEqual(codes("La règle des 183 jours est un mythe : le droit suisse retient 30 jours avec activité ou 90 jours sans."), []);
  assert.deepEqual(codes("La règle des 183 jours figure dans les conventions de double imposition pour les travailleurs."), []);
});

test("legal audit: forfait 5× rent rejected (rule is 7×)", () => {
  assert.ok(codes("La base doit atteindre au moins cinq fois le loyer annuel.").includes("LEGAL_FORFAIT_5X"));
  assert.ok(codes("At least five times the annual rent.").includes("LEGAL_FORFAIT_5X"));
  assert.ok(codes("Mindestens das Fünffache des jährlichen Mietzinses.").includes("LEGAL_FORFAIT_5X"));
  assert.ok(codes("Al menos igual al quíntuplo del alquiler anual.").includes("LEGAL_FORFAIT_5X"));
  assert.ok(codes("Pelo menos igual ao quíntuplo da renda anual.").includes("LEGAL_FORFAIT_5X"));
  assert.deepEqual(codes("La base doit atteindre au moins sept fois le loyer annuel."), []);
});

test("legal audit: golden visa / residency by investment rejected unless negated", () => {
  assert.ok(codes("La Suisse propose un golden visa aux investisseurs.").includes("LEGAL_GOLDEN_VISA"));
  assert.ok(codes("Switzerland offers residency by investment.").includes("LEGAL_GOLDEN_VISA"));
  assert.ok(codes("Die Schweiz bietet ein goldenes Visum.").includes("LEGAL_GOLDEN_VISA"));
  assert.ok(codes("Suiza ofrece un visado dorado.").includes("LEGAL_GOLDEN_VISA"));
  assert.ok(codes("A Suíça oferece um visto gold.").includes("LEGAL_GOLDEN_VISA"));
  assert.deepEqual(codes("Il n'existe pas de golden visa en Suisse."), []);
});

test("legal audit: CHF 435,000 is a minimum base, not a minimum tax", () => {
  assert.ok(codes("L'impôt minimum fédéral est de CHF 435 000.").includes("LEGAL_435K_TAX"));
  assert.ok(codes("A minimum tax of CHF 435,000 applies.").includes("LEGAL_435K_TAX"));
  assert.ok(codes("Die Mindeststeuer beträgt CHF 435'000.").includes("LEGAL_435K_TAX"));
  assert.deepEqual(codes("La base de calcul minimale de l'impôt fédéral est de CHF 435 000."), []);
  assert.deepEqual(codes("The federal minimum taxable base is CHF 435,000."), []);
});

test("legal audit: unqualified 'no inheritance/wealth tax' rejected", () => {
  assert.ok(codes("En Suisse, il n'y a pas d'impôt sur la fortune.").includes("LEGAL_NO_INHERITANCE_WEALTH_TAX"));
  assert.ok(codes("Switzerland has no inheritance tax.").includes("LEGAL_NO_INHERITANCE_WEALTH_TAX"));
  assert.ok(codes("Die Schweiz kennt keine Erbschaftssteuer.").includes("LEGAL_NO_INHERITANCE_WEALTH_TAX"));
  assert.ok(codes("En Suiza no hay impuesto de sucesiones.").includes("LEGAL_NO_INHERITANCE_WEALTH_TAX"));
  assert.ok(codes("Na Suíça não há imposto sobre heranças.").includes("LEGAL_NO_INHERITANCE_WEALTH_TAX"));
  assert.deepEqual(codes("Il n'y a pas d'impôt fédéral sur les successions ; les cantons en prélèvent."), []);
  assert.deepEqual(codes("There is no inheritance tax for spouses in any canton."), []);
});

test("legal audit: Lex Koller tightening / EU package not presented as in force", () => {
  assert.ok(codes("Depuis avril 2026, le durcissement de la Lex Koller interdit ces achats.").includes("LEGAL_LEX_KOLLER_IN_FORCE"));
  assert.ok(codes("The tightened Lex Koller rules of 2026 now ban such purchases.").includes("LEGAL_LEX_KOLLER_IN_FORCE"));
  assert.deepEqual(codes("Le Conseil fédéral a mis en consultation un projet de durcissement de la Lex Koller en 2026."), []);
  assert.ok(codes("Le nouveau paquet Suisse-UE est en vigueur et élargit la libre circulation.").includes("LEGAL_EU_PACKAGE_IN_FORCE"));
  assert.ok(codes("The new EU package is in force.").includes("LEGAL_EU_PACKAGE_IN_FORCE"));
  assert.ok(codes("Das neue Paket mit der EU ist in Kraft.").includes("LEGAL_EU_PACKAGE_IN_FORCE"));
  assert.deepEqual(codes("Le paquet Suisse-UE n'est pas encore en vigueur : il doit passer devant le Parlement."), []);
});

test("legal audit: buying property does not grant residence", () => {
  assert.ok(codes("L'achat d'un bien immobilier donne droit à un permis de séjour.").includes("LEGAL_PROPERTY_RESIDENCE"));
  assert.ok(codes("Buying a property grants a residence permit.").includes("LEGAL_PROPERTY_RESIDENCE"));
  assert.ok(codes("Der Kauf einer Immobilie berechtigt zu einer Aufenthaltsbewilligung.").includes("LEGAL_PROPERTY_RESIDENCE"));
  assert.ok(codes("La compra de un inmueble otorga un permiso de residencia.").includes("LEGAL_PROPERTY_RESIDENCE"));
  assert.ok(codes("A compra de um imóvel concede autorização de residência.").includes("LEGAL_PROPERTY_RESIDENCE"));
  assert.deepEqual(codes("L'achat d'un bien immobilier ne donne aucun droit à un permis de séjour."), []);
});

// ─── SEO / GEO structure ──────────────────────────────────────────────────

const servicePathMaps = rules.loadServicePathMaps(ROOT);

test("service path maps are read from src/lib/paths.ts", () => {
  assert.equal(rules.localizedServiceUrl("fr", "/services/tax-administration", servicePathMaps), "/fr/services/fiscalite-administration/");
  assert.equal(rules.localizedServiceUrl("de", "/services/tax-administration", servicePathMaps), "/de/services/steuerverwaltung/");
  assert.equal(rules.localizedServiceUrl("en", "/services/tax-administration", servicePathMaps), "/en/services/tax-administration/");
});

function goodFrArticle() {
  const mock = require("./mock/article-pipeline-mock");
  const keywords = { fr: { primary: "rachat lpp", secondary: ["rachat lpp conditions", "rachat 2e pilier impot"] } };
  const references = [{ labelKey: "estv.admin.ch — AFC", url: "https://www.estv.admin.ch/estv/fr/home.html" }];
  const { newArticle } = mock.draft({
    item: { service: "/services/tax-administration" },
    research: { slug: "rachat-lpp-conditions-deduction", title: "Rachat LPP : conditions et déduction" },
    references,
    keywords,
    servicePathMaps,
    today: "2026-09-30",
  });
  newArticle.content += "\n---\n### Références\n- [estv.admin.ch — AFC](https://www.estv.admin.ch/estv/fr/home.html)\n";
  return { article: newArticle, keywords };
}

test("SEO checks accept a well-formed article", () => {
  const { article, keywords } = goodFrArticle();
  const res = rules.checkSeoStructure(article, {
    locale: "fr",
    keywords: keywords.fr,
    allowedInternalPaths: rules.buildAllowedInternalPaths("fr", { servicePathMaps }),
    checkSlug: true,
  });
  assert.deepEqual(res.errors, []);
  assert.equal(res.stats.faq, 4);
});

test("SEO checks flag missing FAQ, key facts, question H2, bad links and meta lengths", () => {
  const { article, keywords } = goodFrArticle();
  const broken = {
    ...article,
    seoTitle: "x",
    metaDescription: "trop court",
    slug: "autre-sujet",
    content: article.content
      .replace(/## Points clés/, "## Résumé")
      .replace(/## Questions fréquentes[\s\S]*?(?=\n---)/, "")
      .replace("/fr/services/fiscalite-administration/", "/fr/services/inexistant/")
      .replace(/ \?\n/g, "\n"),
  };
  const res = rules.checkSeoStructure(broken, {
    locale: "fr",
    keywords: keywords.fr,
    allowedInternalPaths: rules.buildAllowedInternalPaths("fr", { servicePathMaps }),
    checkSlug: true,
  });
  const text = res.errors.join("\n");
  for (const re of [/seoTitle length/, /metaDescription length/, /slug/, /Points clés/, /Questions fréquentes/, /question-style H2/, /does not resolve/]) {
    assert.match(text, re);
  }
});

test("FAQ extraction stops at the next section and strips markdown", () => {
  const md = "Intro\n\n## Questions fréquentes\n\n### Qui paie ?\n\nLe [canton](https://www.ge.ch/) **décide**.\n\n### Quand ?\n\nEn mars.\n\n---\n### Références\n- x";
  assert.deepEqual(rules.extractFaq(md), [
    { question: "Qui paie ?", answer: "Le canton décide." },
    { question: "Quand ?", answer: "En mars." },
  ]);
});

test("number parity normalises Swiss/English/German separators and ignores link targets", () => {
  const fr = "Un plafond de CHF 400'000, un taux de 8,1 % et 30 jours, voir [RS 642.11](https://fedlex.admin.ch/eli/cc/1991/1184_1184_1184/fr).";
  const en = "A cap of CHF 400,000, a rate of 8.1% and 30 days, see [SR 642.11](https://fedlex.admin.ch/eli/cc/1991/1184_1184_1184/en).";
  const de = "Eine Obergrenze von CHF 400 000, ein Satz von 8,1 % und 30 Tage, siehe [SR 642.11](https://fedlex.admin.ch/eli/cc/1991/1184_1184_1184/de).";
  assert.ok(rules.compareNumberParity(fr, en).ok);
  assert.ok(rules.compareNumberParity(fr, de).ok);
  const wrong = rules.compareNumberParity(fr, en.replace("30 days", "31 days"));
  assert.equal(wrong.ok, false);
  assert.deepEqual(wrong.missing, ["30"]);
});

// ─── Offline end-to-end ───────────────────────────────────────────────────

test("offline end-to-end dry run through the real orchestrator (mocked model)", () => {
  const r = spawnSync(process.execPath, ["scripts/ai-ressources-update.js", "--dry-run"], {
    cwd: ROOT,
    env: {
      ...process.env,
      OFFLINE_MODE: "1",
      AI_MOCK_MODULE: "scripts/mock/article-pipeline-mock.js",
      FORCE_TOPIC: "rachat-lpp-deduction-fiscale-blocage",
      GITHUB_OUTPUT: "",
    },
    encoding: "utf8",
    timeout: 60000,
  });
  const out = `${r.stdout}\n${r.stderr}`;
  assert.equal(r.status, 0, out.slice(-2000));
  assert.match(out, /FR article valid/);
  for (const l of ["en", "de", "es", "pt"]) assert.match(out, new RegExp(`✅ ${l} valid`));
  assert.match(out, /not written/);
});

// ─── Review follow-ups ────────────────────────────────────────────────────

test("guarantee exemption only for a negation adjacent to the guarantee", () => {
  assert.ok(codes("Not only do we guarantee results, we deliver them.").includes("GUARANTEE"));
  assert.ok(codes("This is not a myth: we guarantee success.").includes("GUARANTEE"));
  assert.deepEqual(codes("Nous ne garantissons aucune issue."), []);
  assert.deepEqual(codes("Ridger garantiert keinen Verfahrensausgang."), []);
  assert.deepEqual(codes("A Ridger não garantimos qualquer desfecho."), []);
});

test("bare URLs are rejected by the SEO checks and stripped by the sanitizer", () => {
  const { article, keywords } = goodFrArticle();
  article.content = article.content.replace("## Notre rôle", "Voir https://example.com/x pour plus.\n\n## Notre rôle");
  const res = rules.checkSeoStructure(article, {
    locale: "fr",
    keywords: keywords.fr,
    allowedInternalPaths: rules.buildAllowedInternalPaths("fr", { servicePathMaps }),
  });
  assert.ok(res.errors.some((e) => /bare URL/.test(e)));
  const { sanitizeExternalLinks } = require("./ai-ressources-update");
  const out = sanitizeExternalLinks("Voir https://example.com/x et [AFC](https://www.estv.admin.ch/) ou [X](https://evil.example/).", [{ url: "https://www.estv.admin.ch/" }]);
  assert.equal(out, "Voir et [AFC](https://www.estv.admin.ch/) ou X.");
});

// ─── Autocomplete provider fallback & stored keywords ─────────────────────

const refreshKeywords = require("./refresh-keywords");

// Fake fetcher: per-provider behaviour keyed by host; records requested URLs.
function fakeFetcher(byHost) {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    const host = new URL(url).host;
    const h = byHost[host];
    if (!h) return { ok: false, status: 404, text: "" };
    return typeof h === "function" ? h(url) : h;
  };
  return { fetcher, calls };
}
const G = "suggestqueries.google.com";
const B = "api.bing.com";
const D = "duckduckgo.com";

test("provider parsers: bing osjson, duckduckgo phrases, HTML consent page rejected", () => {
  const P = kw.AUTOCOMPLETE_PROVIDERS;
  assert.deepEqual(P.bing.parse(JSON.stringify(["q", ["Rachat LPP", "rachat lpp impôt"]])), ["rachat lpp", "rachat lpp impôt"]);
  assert.deepEqual(P.duckduckgo.parse(JSON.stringify([{ phrase: "rachat lpp" }, { phrase: "" }, {}])), ["rachat lpp"]);
  assert.deepEqual(kw.parseDuckDuckGoResponse("<html>"), []);
  assert.equal(P.google.parse("<html>consent</html>"), null);
  assert.deepEqual(kw.PROVIDER_ORDER, ["google", "bing", "duckduckgo"]);
});

test("provider market mapping covers every Ridger market", () => {
  const got = Object.values(kw.AUTOCOMPLETE_MARKETS).flat().map((m) => [kw.bingMarket(m), kw.ddgRegion(m)]);
  assert.deepEqual(got, [
    ["fr-CH", "ch-fr"], ["fr-FR", "fr-fr"],
    ["en-GB", "uk-en"], ["en-US", "us-en"],
    ["de-CH", "ch-de"], ["de-DE", "de-de"],
    ["es-ES", "es-es"],
    ["pt-PT", "pt-pt"], ["pt-BR", "br-pt"],
  ]);
  const url = new URL(kw.AUTOCOMPLETE_PROVIDERS.bing.url("rachat lpp", { hl: "fr", gl: "ch" }));
  assert.equal(url.searchParams.get("market"), "fr-CH");
  assert.equal(url.searchParams.get("query"), "rachat lpp");
});

test("fallback: google blocked → bing; errors logged once per provider; google skipped afterwards", async () => {
  const { fetcher, calls } = fakeFetcher({
    [G]: { ok: false, status: 429, text: "" },
    [B]: (url) => ({ ok: true, status: 200, text: JSON.stringify(["q", [`${new URL(url).searchParams.get("query")} geneve`]]) }),
  });
  const logs = [];
  const state = kw.newResearchState();
  const r = await kw.collectAutocomplete("fr", ["rachat lpp"], { fetcher, log: (m) => logs.push(m), state });
  assert.equal(r.provider, "bing");
  assert.equal(r.results.length, 2);
  assert.equal(logs.length, 1);
  assert.match(logs[0], /google 2\/2 requests failed — HTTP 429 ×2 \(fr-CH, fr-FR\)/);
  assert.ok(state.blocked.has("google"));
  calls.length = 0;
  const r2 = await kw.collectAutocomplete("en", ["lpp buy-in"], { fetcher, state });
  assert.equal(r2.provider, "bing");
  assert.ok(calls.every((u) => !u.includes(G)), "blocked google not retried");
});

test("fallback: google + bing empty → duckduckgo; all empty → no provider", async () => {
  const empty = { ok: true, status: 200, text: JSON.stringify(["q", []]) };
  const { fetcher } = fakeFetcher({
    [G]: empty,
    [B]: empty,
    [D]: { ok: true, status: 200, text: JSON.stringify([{ phrase: "rachat lpp conditions" }]) },
  });
  const r = await kw.collectAutocomplete("fr", ["rachat lpp"], { fetcher });
  assert.equal(r.provider, "duckduckgo");
  assert.deepEqual(r.attempts.map((a) => a.provider), ["google", "bing", "duckduckgo"]);
  const none = await kw.collectAutocomplete("fr", ["rachat lpp"], { fetcher: fakeFetcher({ [G]: empty, [B]: empty, [D]: empty }).fetcher });
  assert.equal(none.provider, null);
});

test("researchAllLocales: live → stored researchedKeywords → backlog seeds, with source", async () => {
  const item = {
    seeds: { fr: "rachat lpp", en: "lpp buy-in", de: "pk einkauf", es: "aportación lpp", pt: "resgate lpp" },
    targetKeywords: { fr: ["rachat lpp"], en: ["lpp buy-in"], de: ["pk einkauf"], es: ["aportación lpp"], pt: ["resgate lpp"] },
    researchedKeywords: {
      date: "2026-09-30",
      perLocale: { en: { primary: "lpp buy-in", secondary: ["lpp buy-in tax", "lpp buy-in rules"], questions: ["how does an lpp buy-in work"] } },
    },
  };
  const { fetcher } = fakeFetcher({
    [G]: (url) => {
      const hl = new URL(url).searchParams.get("hl");
      const q = new URL(url).searchParams.get("q").trim();
      return hl === "fr"
        ? { ok: true, status: 200, text: JSON.stringify([q, ["rachat lpp conditions", "rachat lpp impot"]]) }
        : { ok: false, status: 403, text: "" };
    },
  });
  const out = await kw.researchAllLocales(item, { fetcher, delayMs: 0 });
  assert.equal(out.fr.stats.source, "autocomplete:google");
  assert.equal(out.en.stats.source, "stored 2026-09-30");
  assert.deepEqual(out.en.secondary, ["lpp buy-in tax", "lpp buy-in rules"]);
  assert.deepEqual(out.en.questions, ["how does an lpp buy-in work"]);
  assert.equal(out.de.stats.source, "backlog-fallback");
  const noStored = await kw.researchAllLocales(item, { fetcher, delayMs: 0, useStored: false });
  assert.equal(noStored.en.stats.source, "backlog-fallback");
});

test("refresh-keywords: stores only live results, keeps previous locales", () => {
  const item = { researchedKeywords: { date: "2026-01-01", perLocale: { de: { primary: "pk einkauf", secondary: ["a b"], questions: [] } } } };
  const research = {
    fr: { primary: "rachat lpp", secondary: ["rachat lpp conditions"], questions: ["comment fonctionne le rachat lpp"], stats: { source: "autocomplete:bing", uniqueCandidates: 3 } },
    de: { primary: "x", secondary: [], questions: [], stats: { source: "backlog-fallback", uniqueCandidates: 0 } },
  };
  assert.deepEqual(refreshKeywords.applyResearch(item, research, "2026-09-30"), ["fr"]);
  assert.equal(item.researchedKeywords.date, "2026-09-30");
  assert.equal(item.researchedKeywords.perLocale.de.primary, "pk einkauf");
  assert.deepEqual(item.researchedKeywords.perLocale.fr.questions, ["comment fonctionne le rachat lpp"]);
});

test("probeDemand falls through a blocked provider", async () => {
  const { fetcher } = fakeFetcher({
    [G]: { ok: false, status: 429, text: "" },
    [B]: { ok: true, status: 200, text: JSON.stringify(["q", ["rachat lpp conditions", "rachat lpp prix"]]) },
  });
  const state = kw.newResearchState();
  const demand = await kw.probeDemand({ seeds: { fr: "rachat lpp" } }, { fetcher, state });
  assert.ok(demand > 0);
  assert.ok(state.blocked.has("google"));
});

test("junk suggestions (dictionary/word games/templates) are excluded", () => {
  for (const s of ["réunion de famille mots fléchés", "gouvernance synonyme", "family assembly what is $sp", "rachat lpp calculateur", "family office jobs"]) {
    assert.ok(kw.isExcluded(s), s);
  }
  assert.equal(kw.isExcluded("rachat lpp conditions"), false);
});

test("stored keywords are re-filtered and topped up from backlog targets", () => {
  const item = {
    targetKeywords: { fr: ["rachat lpp", "rachat lpp retraite", "rachat lpp impôt", "rachat lpp divorce"] },
    researchedKeywords: {
      date: "2026-09-30",
      perLocale: { fr: { primary: "rachat lpp", secondary: ["rachat lpp conditions", "rachat lpp mots fléchés", "rachat lpp canada"], questions: ["rachat lpp synonyme", "comment faire un rachat lpp"] } },
    },
  };
  const s = kw.storedLocaleKeywords(item, "fr", { minSecondary: 3 });
  assert.deepEqual(s.secondary, ["rachat lpp conditions", "rachat lpp retraite", "rachat lpp impôt"]);
  assert.deepEqual(s.questions, ["comment faire un rachat lpp"]);
  assert.equal(kw.storedLocaleKeywords({ researchedKeywords: { perLocale: {} } }, "fr"), null);
});
