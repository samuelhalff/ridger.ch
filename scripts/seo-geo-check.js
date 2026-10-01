const fs = require("fs");
const path = require("path");

const root = process.cwd();

// Everything below is derived from the repo, so the check follows Ridger's
// real routes instead of a hard-coded list (the previous version still
// expected Ark Fiduciaire pages such as /services/accounting).
const locales = fs
  .readdirSync(path.join(root, "src/translations"))
  .filter((name) => fs.statSync(path.join(root, "src/translations", name)).isDirectory())
  .sort();

// One directory per service page under app/[locale]/services.
const serviceSlugs = fs
  .readdirSync(path.join(root, "app/[locale]/services"))
  .filter((name) => fs.statSync(path.join(root, "app/[locale]/services", name)).isDirectory())
  .sort();

// Location landing pages: /family-office/<city>.
const cities = JSON.parse(fs.readFileSync(path.join(root, "src/lib/locations.json"), "utf8"));

const staticRoutes = [
  "/",
  "/ai-profile",
  "/approach",
  "/platform",
  "/services",
  "/ressources",
  "/contact",
  "/advisers",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
];
const serviceRoutes = serviceSlugs.map((slug) => `/services/${slug}`);
const cityRoutes = cities.map((city) => `/family-office/${city}`);
const requiredRoutes = [...staticRoutes, ...serviceRoutes, ...cityRoutes];

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
  [...staticRoutes, ...serviceRoutes].forEach((route) => {
    if (!sitemap.includes(`"${route}"`)) {
      addFailure(`sitemap source is missing "${route}"`);
    }
  });
  // Location pages are generated, not listed: the source must import the
  // city list and map it to /family-office/<city>.
  if (!/from\s+["'][^"']*locations\.json["']/.test(sitemap) || !sitemap.includes("`/family-office/${")) {
    addFailure("sitemap source must build /family-office/<city> routes from src/lib/locations.json");
  }
  if ((sitemap.match(/\blocationPaths\b/g) || []).length < 2) {
    addFailure("sitemap source builds locationPaths but never uses them");
  }
}

function checkLlms() {
  // llms.txt is served by a route handler, not a static file.
  const rel = "app/llms.txt/route.ts";
  if (!exists(rel)) {
    addFailure(`${rel} is missing`);
    return;
  }
  const llms = read(rel);
  ["/fr/ai-profile/", ...serviceRoutes.map((route) => `/en${route}/`)].forEach((needle) => {
    if (!llms.includes(needle)) addFailure(`llms.txt is missing ${needle}`);
  });
  if (!/does not manage assets/i.test(llms)) {
    addFailure("llms.txt must state that Ridger does not manage assets");
  }
}

function checkAiProfileRoutes() {
  if (!exists("app/[locale]/ai-profile/page.tsx")) {
    addFailure("localized AI profile route is missing");
  }
  for (const locale of locales) {
    if (!exists(`src/translations/${locale}/ai-profile.json`)) {
      addFailure(`${locale} AI profile content is missing`);
    }
  }
}

function checkMetadata() {
  for (const locale of locales) {
    const metadata = JSON.parse(read(`src/translations/${locale}/metadata.json`));
    const pages = metadata.pages || {};
    const titles = new Map();
    for (const route of requiredRoutes) {
      const page = pages[route];
      if (!page || !page.title) addFailure(`${locale} metadata title missing for ${route}`);
      else if (!/Ridger/.test(page.title)) addFailure(`${locale} metadata title for ${route} must name Ridger`);
      if (!page || !page.description) addFailure(`${locale} metadata description missing for ${route}`);
    }
    for (const [route, page] of Object.entries(pages)) {
      // A metadata entry for a service or city page that does not exist is a
      // leftover from another site.
      if (/^\/services\/./.test(route) && !serviceRoutes.includes(route)) {
        addFailure(`${locale} metadata has ${route} but app/[locale]/services has no such page`);
      }
      if (/^\/family-office\/./.test(route) && !cityRoutes.includes(route)) {
        addFailure(`${locale} metadata has ${route} but src/lib/locations.json has no such city`);
      }
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
    for (const slug of serviceSlugs) {
      const rel = `src/translations/${locale}/${slug}.json`;
      if (!exists(rel)) {
        addFailure(`${rel} is missing (service page without content)`);
        continue;
      }
      const json = JSON.parse(read(rel));
      const counts = new Map();
      for (const paragraph of normalizedParagraphs(json)) {
        counts.set(paragraph, (counts.get(paragraph) || 0) + 1);
      }
      const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        addFailure(`${locale}/${slug}.json contains ${duplicates.length} repeated long paragraph(s)`);
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
