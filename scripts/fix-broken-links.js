/**
 * Replace broken external links in all 5 translation files.
 * Maps old broken URLs → verified working replacements.
 * Run: node scripts/fix-broken-links.js
 */

const fs = require("fs");
const path = require("path");

// Replacement map: old URL → new working URL
const REPLACEMENTS = {
  // === kmu.admin.ch — completely restructured to flat URLs ===
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/gestion-risques/bases-normes-legales.html":
    "https://www.kmu.admin.ch/fr/la-gestion-des-risques-strategiques-et-operationnels",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/comptabilite-et-revision/comptes-annuels/organe-de-revision.html":
    "https://www.kmu.admin.ch/fr/comptabilite-et-revision-tout-savoir-les-finances-et-le-controlling",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/comptabilite-et-revision/comptes-annuels/cloture-exercice-financier.html":
    "https://www.kmu.admin.ch/fr/comptabilite-et-revision-tout-savoir-les-finances-et-le-controlling",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/impots/non-imposition/optimiser-declaration.html":
    "https://www.kmu.admin.ch/fr/la-liste-des-impots-pour-les-entrepreneurs",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/comptabilite-et-revision/comptabilite-obligatoire.html":
    "https://www.kmu.admin.ch/fr/comptabilite-et-revision-tout-savoir-les-finances-et-le-controlling",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/impots/tva.html":
    "https://www.kmu.admin.ch/fr/la-liste-des-impots-pour-les-entrepreneurs",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/impots/tva/facturation.html":
    "https://www.kmu.admin.ch/fr/la-liste-des-impots-pour-les-entrepreneurs",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/impots.html":
    "https://www.kmu.admin.ch/fr/la-liste-des-impots-pour-les-entrepreneurs",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/succession-cessation-d-activite/transmission-entreprise/evaluer-l_entreprise/due-diligence.html":
    "https://www.kmu.admin.ch/fr/succession",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/creation-pme/creation-entreprise/registre-du-commerce/inscrire-son-entreprise.html":
    "https://www.kmu.admin.ch/fr/voici-comment-inscrire-une-entreprise",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/creation-pme/creation-entreprise/choisir-une-forme-juridique.html":
    "https://www.kmu.admin.ch/fr/caracteristiques-des-differentes-formes-juridiques",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/creation-pme/creation-entreprise/registre-du-commerce.html":
    "https://www.kmu.admin.ch/fr/voici-comment-inscrire-une-entreprise",
  "https://www.kmu.admin.ch/kmu/fr/home.html":
    "https://www.kmu.admin.ch/fr",
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique.html":
    "https://www.kmu.admin.ch/fr/savoir-pratique",
  "https://www.kmu.admin.ch/kmu/fr/home/actuel/news/2025/industrie-dope-fusions-acquisitions-suisses.html":
    "https://www.kmu.admin.ch/fr/actuel",
  "https://www.kmu.admin.ch/kmu/fr/home/actuel/news/2026/guerre-moyen-orient-pourrait-freiner-reprise.html":
    "https://www.kmu.admin.ch/fr/actuel",
  "https://www.kmu.admin.ch/kmu/fr/home/actuel/theme-du-mois/2023/sa-ou-sarl-comment-choisir.html":
    "https://www.kmu.admin.ch/fr/caracteristiques-des-differentes-formes-juridiques",

  // Typo in original URL
  "https://www.kmu.admin.ch/kmu/fr/home/savoir-practice/finances/gestion-risques/bases-normes-legales.html":
    "https://www.kmu.admin.ch/fr/la-gestion-des-risques-strategiques-et-operationnels",

  // === estv.admin.ch — restructured, use homepage as fallback ===
  "https://www.estv.admin.ch/estv/fr/home/mehrwertsteuer/dienstleistungen/abrechnung/struktur-und-inhalt-der-rechnung.html":
    "https://www.estv.admin.ch/fr",
  "https://www.estv.admin.ch/estv/de/home/mehrwertsteuer/dienstleistungen/abrechnung/struktur-und-inhalt-der-rechnung.html":
    "https://www.estv.admin.ch/de",
  "https://www.estv.admin.ch/estv/en/home/mehrwertsteuer/dienstleistungen/abrechnung/struktur-und-inhalt-der-rechnung.html":
    "https://www.estv.admin.ch/en",
  "https://www.estv.admin.ch/estv/es/home/mehrwertsteuer/dienstleistungen/abrechnung/struktur-und-inhalt-der-rechnung.html":
    "https://www.estv.admin.ch/es",
  "https://www.estv.admin.ch/estv/pt/home/mehrwertsteuer/dienstleistungen/abrechnung/struktur-und-inhalt-der-rechnung.html":
    "https://www.estv.admin.ch/pt",
  "https://www.estv.admin.ch/estv/fr/home/mehrwertsteuer/das-wichtigste-in-kuerze/mehrwertsteuersaetze.html":
    "https://www.estv.admin.ch/fr",
  "https://www.estv.admin.ch/estv/de/home/mehrwertsteuer/das-wichtigste-in-kuerze/mehrwertsteuersaetze.html":
    "https://www.estv.admin.ch/de",
  "https://www.estv.admin.ch/estv/en/home/mehrwertsteuer/das-wichtigste-in-kuerze/mehrwertsteuersaetze.html":
    "https://www.estv.admin.ch/en",
  "https://www.estv.admin.ch/estv/es/home/mehrwertsteuer/das-wichtigste-in-kuerze/mehrwertsteuersaetze.html":
    "https://www.estv.admin.ch/es",
  "https://www.estv.admin.ch/estv/pt/home/mehrwertsteuer/das-wichtigste-in-kuerze/mehrwertsteuersaetze.html":
    "https://www.estv.admin.ch/pt",
  "https://www.estv.admin.ch/estv/fr/home/allgemein/st/Gesellschaftssteuer/deplacement-canton.html":
    "https://www.estv.admin.ch/fr",
  "https://www.estv.admin.ch/estv/de/home/allgemein/st/Gesellschaftssteuer/deplacement-canton.html":
    "https://www.estv.admin.ch/de",
  "https://www.estv.admin.ch/estv/en/home/allgemein/st/Gesellschaftssteuer/deplacement-canton.html":
    "https://www.estv.admin.ch/en",
  "https://www.estv.admin.ch/estv/fr/home/services/eportal.html":
    "https://www.estv.admin.ch/fr",
  "https://www.estv.admin.ch/estv/de/home/services/eportal.html":
    "https://www.estv.admin.ch/de",
  "https://www.estv.admin.ch/estv/en/home/services/eportal.html":
    "https://www.estv.admin.ch/en",
  "https://www.estv.admin.ch/estv/es/home/services/eportal.html":
    "https://www.estv.admin.ch/es",
  "https://www.estv.admin.ch/estv/pt/home/services/eportal.html":
    "https://www.estv.admin.ch/pt",
  "https://www.estv.admin.ch/estv/fr/home.html":
    "https://www.estv.admin.ch/fr",

  // === snb.ch — only FR and EN locales available ===
  "https://www.snb.ch/pt/":
    "https://www.snb.ch/fr/",
  "https://www.snb.ch/es/":
    "https://www.snb.ch/fr/",

  // === seco.admin.ch — restructured ===
  "https://www.seco.admin.ch/seco/fr/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/Gesellschaftliche_Verantwortung_der_Unternehmen.html":
    "https://www.seco.admin.ch/fr/durabilite-au-seco",
  "https://www.seco.admin.ch/seco/fr/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/grundsaetze_der_unternehmensfuehrung.html":
    "https://www.seco.admin.ch/fr/durabilite-au-seco",
  "https://www.seco.admin.ch/seco/fr/home/Arbeit/Personenfreizugigkeit_Arbeitsbeziehungen/schwarzarbeit/Arbeit_korrekt_melden/vereinfachte_abrechnungsverfahren/Abrechnung.html":
    "https://www.seco.admin.ch/fr/portrait",
  "https://www.seco.admin.ch/seco/en/home/Aussenwirtschaftspolitik_Wirtschaftliche_Zusammenarbeit/Wirtschaftsbeziehungen/Internationale_Investitionen/Auslandsinvestitionen/Investitionskontrollen.html":
    "https://www.seco.admin.ch/fr/relations-commerciales-usa-ch",
  "https://www.seco.admin.ch/seco/fr/home/Standortfoerderung/Unternehmensfoerderung/Unternehmensnachfolge.html":
    "https://www.seco.admin.ch/fr/portrait",
  "https://www.seco.admin.ch/seco/fr/home/Publikationen_Dienstleistungen/Publikationen_und_Formulare/Regulierung/regulierungsfolgenabschaetzung/beispiele-rfa/transparenzregister.html":
    "https://www.seco.admin.ch/fr/portrait",
  "https://www.seco.admin.ch/seco/fr/home.html":
    "https://www.seco.admin.ch/fr/",

  // === bk.admin.ch → fedlex.admin.ch ===
  "https://www.bk.admin.ch/ch/f/pore/rf/cr/2021/20210837.html":
    "https://www.fedlex.admin.ch/eli/fga/2021/837",
  "https://www.bk.admin.ch/ch/f/pore/rf/cr/2025/20253432.html":
    "https://www.fedlex.admin.ch/eli/fga/2025/3432",

  // === fedpol.admin.ch — homepage broken, use admin.ch ===
  "https://www.fedpol.admin.ch/fedpol/fr/home/kriminalitaet/geldwaescherei.html":
    "https://www.admin.ch/gov/fr/accueil.html",

  // === ahv-iv.ch — only homepage works ===
  "https://www.ahv-iv.ch/fr/Publications-et-services/2026/Changements-importants-et-taux":
    "https://www.ahv-iv.ch/fr/",

  // === ge.ch — Geneva canton completely reorganized ===
  "https://www.ge.ch/document/impots-personnes-physiques":
    "https://www.ge.ch/dossier/vos-impots",
  "https://www.ge.ch/document/declaration-impot-personnes-morales":
    "https://www.ge.ch/dossier/vos-impots",
  "https://www.ge.ch/dossier/assurance-maternite":
    "https://www.ge.ch/dossier/vos-impots",
  "https://www.ge.ch/document/impots-bar%C3%A8mes-taux":
    "https://www.ge.ch/dossier/vos-impots",
  "https://www.ge.ch/document/cotisations-sociales-2025":
    "https://www.ge.ch/dossier/vos-impots",
  "https://www.ge.ch/dossier/assurances-sociales-employeurs":
    "https://www.ge.ch/dossier/vos-impots",
  "https://www.ge.ch/document/guide-tva-entreprises-genvoises-2026":
    "https://www.ge.ch/dossier/vos-impots",

  // === bsv.admin.ch → ahv-iv.ch homepage (only working page) ===
  "https://www.bsv.admin.ch/bsv/fr/home/assurances-sociales/avssociales/taux.html":
    "https://www.ahv-iv.ch/fr/",
  "https://www.bsv.admin.ch/bsv/de/home/assurances-sociales/avssociales/taux.html":
    "https://www.ahv-iv.ch/de/",
  "https://www.bsv.admin.ch/bsv/en/home/assurances-sociales/avssociales/taux.html":
    "https://www.ahv-iv.ch/en/",
  "https://www.bsv.admin.ch/bsv/pt/home/assurances-sociales/avssociales/taux.html":
    "https://www.ahv-iv.ch/fr/",

  // === bj.admin.ch → kmu.admin.ch or ch.ch equivalents ===
  "https://www.bj.admin.ch/bj/fr/home/wirtschaft/handelsregister.html":
    "https://www.kmu.admin.ch/fr/voici-comment-inscrire-une-entreprise",
  "https://www.bj.admin.ch/bj/fr/home/wirtschaft/schkg.html":
    "https://www.fedlex.admin.ch/eli/fga/2025/3432",

  // === sif.admin.ch ===
  "https://www.sif.admin.ch/fr/loi-sur-le-blanchiment-dargentsurveillance/themes-intersectoriels/lutte-contre-le-blanchiment-d-argent/":
    "https://www.sif.admin.ch/fr/",

  // === SIF - typo variations ===
  "https://www.sif.admin.ch/fr/loi-sur-le-blanchiment-dargentautorisation/banques-et-maisons-de-titres/modification-des-conditions-d-autorisation/autorisations-et-approbations/modifications-des-statuts-und-des-reglements":
    "https://www.sif.admin.ch/fr/",
  "https://www.sif.admin.ch/fr/loi-sur-le-blanchiment-dargentautorisation/banques-et-maisons-de-titres/modification-des-conditions-d-autorisation/autorisations-et-approbations/modificaciones-des-statuts-et-des-reglements":
    "https://www.sif.admin.ch/fr/",

  // === e-doc.admin.ch ===
  "https://www.e-doc.admin.ch/dam/bj/fr/data/wirtschaft/gesetzgebung/archiv/konkursmissbrauch/vo-aenderungen/erlaeuterungen-vo.pdf.download.pdf/erlaeuterungen-vo-f.pdf":
    "https://www.fedlex.admin.ch/eli/fga/2025/3432",

  // === hermes.admin.ch — this one actually works ===
  // "https://www.hermes.admin.ch/fr/gestion-de-projet/ergebnisse/liste-de-controle-cloture-du-projet.html" — working, no replacement needed
};

const TRANSLATION_FILES = [
  "src/translations/fr/ressources.json",
  "src/translations/de/ressources.json",
  "src/translations/en/ressources.json",
  "src/translations/es/ressources.json",
  "src/translations/pt/ressources.json",
];

let totalReplaced = 0;
let totalFiles = 0;

for (const filePath of TRANSLATION_FILES) {
  let content = fs.readFileSync(filePath, "utf-8");
  let fileChanges = 0;

  for (const [oldUrl, newUrl] of Object.entries(REPLACEMENTS)) {
    // Count occurrences
    const count = content.split(oldUrl).length - 1;
    if (count > 0) {
      content = content.split(oldUrl).join(newUrl);
      fileChanges += count;
      console.log(`  ${filePath}: ${count}x ${oldUrl.slice(0, 60)}... → ${newUrl}`);
    }
  }

  if (fileChanges > 0) {
    fs.writeFileSync(filePath, content, "utf-8");
    totalReplaced += fileChanges;
    totalFiles++;
    console.log(`  → ${fileChanges} replacements in ${filePath}`);
  }
}

console.log(`\nDone: ${totalReplaced} URLs replaced across ${totalFiles} files.`);
