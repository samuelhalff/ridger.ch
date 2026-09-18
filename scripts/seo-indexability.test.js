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
      ['"/services/accounting"', '"/services/comptabilite"'],
      ['"/services/taxes"', '"/services/fiscalite"'],
      ['"/services/payroll"', '"/services/paie"'],
      ['"/services/outsourcing"', '"/services/externalisation"'],
      ['"/services/mergers-acquisitions"', '"/services/fusions-acquisitions"'],
      ['"/services/corporate"', '"/services/services-corporatifs"'],
      ['"/services/incorporation"', '"/services/constitution-entreprise"'],
    ];

    for (const [base, localized] of expectedMappings) {
      assert.match(source, new RegExp(`${base.replaceAll("/", "\\/")}\\s*:\\s*${localized.replaceAll("/", "\\/")}`));
    }
  });

  it("uses the shared localizer for Organization Offer and Service URLs", () => {
    const source = read("src/lib/structuredData.ts");
    for (const pathName of ["accounting", "incorporation", "odoo"]) {
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
  it("sends every legacy French service slug directly to a slash canonical", async () => {
    const config = require(path.join(ROOT, "next.config.js"));
    const redirects = await config.redirects();
    const legacy = redirects.filter((rule) =>
      /^\/fr\/services\/(accounting|taxes|payroll|outsourcing|mergers-acquisitions|corporate|incorporation)\/?$/.test(rule.source),
    );

    assert.equal(legacy.length, 14);
    for (const rule of legacy) {
      assert.equal(rule.permanent, true);
      assert.ok(rule.destination.endsWith("/"), `${rule.source} has a noncanonical target`);
      assert.equal(
        redirects.some((candidate) =>
          candidate.source === rule.destination ||
          candidate.source === rule.destination.replace(/\/$/, ""),
        ),
        false,
        `${rule.source} creates a redirect chain through ${rule.destination}`,
      );
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
  it("retains indexable contact and quote-agent pages", () => {
    assert.equal(fs.existsSync(path.join(ROOT, "app/[locale]/contact/page.tsx")), true);
    assert.equal(fs.existsSync(path.join(ROOT, "app/[locale]/agent/page.tsx")), true);
    const middleware = read("middleware.ts");
    const noindexExpression = middleware.match(/const shouldNoIndex\s*=([\s\S]*?);/);
    assert.ok(noindexExpression);
    assert.doesNotMatch(noindexExpression[0], /contact|agent/);
  });
});
