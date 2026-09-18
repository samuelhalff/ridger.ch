#!/usr/bin/env node
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("canonical service URLs", () => {
  it("defines every localized French service slug in the shared path map", () => {
    const source = read("src/lib/paths.ts");
    const expectedMappings = [
      ['"/services/consolidated-reporting"', '"/services/reporting-consolide"'],
      ['"/services/investment-oversight"', '"/services/surveillance-investissements"'],
      ['"/services/family-office-coordination"', '"/services/coordination-family-office"'],
      ['"/services/governance-succession"', '"/services/gouvernance-succession"'],
      ['"/services/tax-administration"', '"/services/fiscalite-administration"'],
      ['"/services/digital-vault"', '"/services/coffre-fort-numerique"'],
      ['"/services/real-estate-transactions"', '"/services/immobilier-transactions"'],
    ];

    for (const [base, localized] of expectedMappings) {
      assert.match(source, new RegExp(`${base.replaceAll("/", "\\/")}\\s*:\\s*${localized.replaceAll("/", "\\/")}`));
    }
  });

  it("uses the shared localizer for Organization Offer and Service URLs", () => {
    const source = read("src/lib/structuredData.ts");
    for (const pathName of ["consolidated-reporting", "family-office-coordination"]) {
      assert.match(
        source,
        new RegExp(`localizePath\\(\"/services/${pathName}\", locale as Locale\\)`),
      );
    }
    assert.doesNotMatch(source, /url:\s*`[^`]*\/services\/(accounting|incorporation)\//);
  });

  it("builds direct canonical URLs in primary service-link consumers", () => {
    const layout = read("app/[locale]/layout.tsx");
    const footer = read("app/[locale]/shared/footer.tsx");
    const homeServices = read("app/[locale]/home/components/services.tsx");
    const desktopMenu = read("src/components/navigation/ServicesDropdown.tsx");
    const mobileMenu = read("src/components/navigation/ServicesMobile.tsx");

    assert.match(layout, /href:\s*buildInternalUrl\(service\.href, activeLocale\)/);
    assert.match(footer, /href=\{buildInternalUrl\(href, currentLocale\)\}/);
    assert.match(homeServices, /buildInternalUrl\(service\.href, currentLocale\)/);
    assert.match(desktopMenu, /href=\{item\.href\}/);
    assert.match(mobileMenu, /buildInternalUrl\(normalizeHref\(service\.href\), currentLocale\)/);
    assert.doesNotMatch(desktopMenu, /href=\{`\$\{localePrefix\}\$\{item\.href\}`\}/);
  });
});

describe("redirect canonicalization", () => {
  it("rewrites every localized French service slug to its canonical English route", async () => {
    const config = require(path.join(ROOT, "next.config.js"));
    const rewrites = await config.rewrites();
    const localizedFrSlugs = [
      "reporting-consolide",
      "surveillance-investissements",
      "coordination-family-office",
      "gouvernance-succession",
      "fiscalite-administration",
      "coffre-fort-numerique",
      "immobilier-transactions",
    ];
    for (const slug of localizedFrSlugs) {
      const withSlash = rewrites.find(
        (rule) => rule.source === `/fr/services/${slug}/`,
      );
      assert.ok(withSlash, `missing rewrite for /fr/services/${slug}/`);
      assert.match(withSlash.destination, /^\/fr\/services\/[a-z-]+\/$/);
    }
  });

  it("keeps slashless locale paths redirected instead of serving duplicates", () => {
    const middleware = read("middleware.ts");
    assert.match(middleware, /const needsTrailingSlash\s*=/);
    assert.match(middleware, /NextResponse\.redirect\(redirectUrl, 308\)/);
  });
});

describe("sitemap eligibility", () => {
  it("uses localized paths and genuine article locale variants", () => {
    const source = read("app/sitemap.xml/route.ts");
    assert.match(source, /getValidLocalesForSlug/);
    assert.match(source, /getPlaceholderLocales/);
    assert.match(source, /localizePath/);
    assert.match(source, /pathLocales\.map/);
    assert.doesNotMatch(source, /opengraph-image|twitter-image|["']\/api\//);
  });

  it("does not block query URLs before crawlers can observe noindex", () => {
    const robots = read("public/robots.txt");
    assert.doesNotMatch(robots, /^Disallow:\s*\/\*\?/m);
    assert.match(robots, /Disallow:\s*\/api\//);
    assert.match(robots, /Disallow:\s*\/\*\/opengraph-image/);
  });
});

describe("lead routes", () => {
  it("retains indexable contact page", () => {
    assert.equal(fs.existsSync(path.join(ROOT, "app/[locale]/contact/page.tsx")), true);
    const middleware = read("middleware.ts");
    const noindexExpression = middleware.match(/const shouldNoIndex\s*=([\s\S]*?);/);
    assert.ok(noindexExpression);
    assert.doesNotMatch(noindexExpression[0], /contact/);
  });
});
