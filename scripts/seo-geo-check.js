const fs = require("fs");
const path = require("path");

const root = process.cwd();
const locales = ["fr", "en"];
const serviceNamespaces = [
  "accounting",
  "taxes",
  "payroll",
  "domiciliation",
  "incorporation",
  "odoo",
  "outsourcing",
  "corporate",
  "family-office",
  "mna",
];

const requiredMetadataTitles = {
  fr: {
    "/": "Fiduciaire à Genève : PME, fiscalité, Odoo | Ridger",
    "/services": "Services fiduciaires à Genève | Ridger",
    "/services/accounting": "Comptabilité à Genève pour PME suisses | Ridger",
    "/services/taxes": "Fiscalité PME et entrepreneurs à Genève | Ridger",
    "/services/payroll": "Externalisation des salaires en Suisse | Ridger",
    "/services/domiciliation": "Domiciliation d’entreprise à Genève | Ridger",
    "/services/incorporation": "Création de SA ou Sàrl à Genève | Ridger",
    "/services/odoo": "Fiduciaire Odoo à Genève | Ridger",
    "/services/family-office": "Family office administratif en Suisse | Ridger",
  },
  en: {
    "/": "Accounting Firm in Geneva: SME, Tax, Odoo | Ridger",
    "/services": "Accounting, Tax & Payroll in Geneva | Ridger",
    "/services/accounting": "Accounting in Switzerland for Geneva SMEs | Ridger",
    "/services/taxes": "Tax Advice in Geneva for Companies | Ridger",
    "/services/payroll": "Swiss Payroll Outsourcing & ANOBAG | Ridger",
    "/services/domiciliation": "Business Domiciliation in Geneva | Ridger",
    "/services/incorporation": "Company Incorporation in Geneva, SA or Sàrl | Ridger",
    "/services/odoo": "Odoo Accounting Firm in Geneva | Ridger",
    "/services/family-office": "Administrative Family Office in Switzerland | Ridger",
  },
};

const failures = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

function addFailure(message) {
  failures.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function walkStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => walkStrings(item, out));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => walkStrings(item, out));
  }
  return out;
}

function normalizedParagraphs(json) {
  return walkStrings(json)
    .map((text) =>
      text
        .replace(/\s+/g, " ")
        .replace(/[“”]/g, '"')
        .trim()
        .toLowerCase(),
    )
    .filter((text) => text.length >= 120);
}

function checkRobots() {
  if (!exists("public/robots.txt")) {
    addFailure("public/robots.txt is missing");
    return;
  }
  const robots = read("public/robots.txt");
  if (!/^Sitemap:\s*https:\/\/ridger\.ch\/sitemap\.xml\s*$/m.test(robots)) {
    addFailure("robots.txt must reference https://ridger.ch/sitemap.xml");
  }
  if (/^Disallow:\s*\/\s*$/m.test(robots)) {
    addFailure("production robots.txt must not contain Disallow: /");
  }
  if (/^Disallow:\s*\/assets\/\s*$/m.test(robots)) {
    addFailure("robots.txt must not block public assets used by marketing pages");
  }
}

function checkSitemapSource() {
  const sitemap = read("app/sitemap.xml/route.ts");
  [
    '"/ai-profile"',
    '"/services/accounting"',
    '"/services/odoo"',
    '"/services/family-office"',
  ].forEach((needle) => {
    if (!sitemap.includes(needle)) {
      addFailure(`sitemap source is missing ${needle}`);
    }
  });
}

function checkLlms() {
  if (!exists("public/llms.txt")) {
    addFailure("public/llms.txt is missing");
    return;
  }
  const llms = read("public/llms.txt");
  ["/fr/ai-profile/", "/en/ai-profile/", "/fr/services/comptabilite/", "/en/services/odoo/"].forEach(
    (needle) => {
      if (!llms.includes(needle)) addFailure(`llms.txt is missing ${needle}`);
    },
  );
  if (/discretionary asset management/i.test(llms) === false) {
    addFailure("llms.txt must clarify discretionary asset management limitation");
  }
}

function checkAiProfileRoutes() {
  if (!exists("app/[locale]/ai-profile/page.tsx")) {
    addFailure("localized AI profile route is missing");
  }
  if (!exists("src/translations/fr/ai-profile.json")) {
    addFailure("French AI profile content is missing");
  }
  if (!exists("src/translations/en/ai-profile.json")) {
    addFailure("English AI profile content is missing");
  }
}

function checkMetadata() {
  for (const locale of locales) {
    const metadata = JSON.parse(read(`src/translations/${locale}/metadata.json`));
    const titles = new Map();
    for (const [route, expectedTitle] of Object.entries(requiredMetadataTitles[locale])) {
      const actualTitle = metadata.pages?.[route]?.title;
      if (actualTitle !== expectedTitle) {
        addFailure(`${locale} metadata title for ${route} is "${actualTitle}", expected "${expectedTitle}"`);
      }
    }
    for (const [route, page] of Object.entries(metadata.pages || {})) {
      if (!page.title) addWarning(`${locale} metadata title missing for ${route}`);
      if (!page.description) addWarning(`${locale} metadata description missing for ${route}`);
      if (page.title) {
        const seen = titles.get(page.title);
        if (seen) addWarning(`${locale} duplicate metadata title "${page.title}" for ${seen} and ${route}`);
        titles.set(page.title, route);
      }
      if (page.description && page.description.length > 170) {
        addWarning(`${locale} metadata description over 170 chars for ${route}`);
      }
    }
  }
}

function checkDuplicateServiceParagraphs() {
  for (const locale of locales) {
    for (const ns of serviceNamespaces) {
      const json = JSON.parse(read(`src/translations/${locale}/${ns}.json`));
      const counts = new Map();
      for (const paragraph of normalizedParagraphs(json)) {
        counts.set(paragraph, (counts.get(paragraph) || 0) + 1);
      }
      const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        addFailure(`${locale}/${ns}.json contains ${duplicates.length} repeated long paragraph(s)`);
      }
    }
  }
}

function checkStructuredDataSource() {
  const metadataSource = read("src/lib/metadata.ts");
  if (/aggregateRating/.test(metadataSource)) {
    addFailure("src/lib/metadata.ts must not emit unverifiable aggregateRating schema");
  }
  for (const rel of listSourceFiles(["app", "src"])) {
    const source = read(rel);
    if (/aggregateRating/.test(source)) {
      addFailure(`${rel} must not emit aggregateRating schema without verified public ratings`);
    }
    if (/reviewCount/.test(source)) {
      addFailure(`${rel} must not emit reviewCount schema without verified public ratings`);
    }
  }
  const structuredSource = read("src/lib/structuredData.ts");
  ["buildOrganizationGraph", "buildPersonSchema", "buildArticleSchema"].forEach((name) => {
    if (!structuredSource.includes(name)) {
      addFailure(`structured data helper ${name} is missing`);
    }
  });
}

function listSourceFiles(dirs) {
  const files = [];
  const exts = new Set([".ts", ".tsx"]);
  for (const dir of dirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const current = stack.pop();
      const stat = fs.statSync(current);
      if (stat.isDirectory()) {
        for (const child of fs.readdirSync(current)) {
          if (child === "node_modules" || child === ".next") continue;
          stack.push(path.join(current, child));
        }
      } else if (exts.has(path.extname(current))) {
        files.push(path.relative(root, current));
      }
    }
  }
  return files;
}

checkRobots();
checkSitemapSource();
checkLlms();
checkAiProfileRoutes();
checkMetadata();
checkDuplicateServiceParagraphs();
checkStructuredDataSource();

for (const warning of warnings) {
  console.warn(`SEO warning: ${warning}`);
}

if (failures.length > 0) {
  console.error("SEO/GEO check failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("SEO/GEO check passed");
