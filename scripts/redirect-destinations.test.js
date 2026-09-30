#!/usr/bin/env node
// Asserts that every redirect/rewrite destination and every generated internal
// URL (sitemap paths, localized service slugs, middleware legacy redirects)
// resolves to a real App Router page. Catches the "redirect to a page that
// does not exist" class of bugs (e.g. legacy /services/odoo/ targets).
//
// Run: node --import ./scripts/lib/register-ts.mjs --test scripts/redirect-destinations.test.js
const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const APP_LOCALE_DIR = path.join(ROOT, "app", "[locale]");
const LOCALES = ["fr", "en", "de", "es", "pt"];

// Values allowed for each dynamic segment, keyed by "<parent>/[param]".
function dynamicValues() {
  const fr = JSON.parse(
    fs.readFileSync(path.join(ROOT, "src/translations/fr/ressources.json"), "utf8"),
  );
  return {
    "articles/[slug]": new Set((fr.Articles || []).map((a) => a.slug)),
    "family-office/[city]": new Set(
      JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/locations.json"), "utf8")),
    ),
  };
}

// Collect route patterns (arrays of segments) for every page.tsx / route.ts
// under app/[locale].
function collectRoutes(dir = APP_LOCALE_DIR, segments = []) {
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isFile() && /^(page\.tsx|route\.ts)$/.test(entry.name)) {
      routes.push(segments);
    } else if (entry.isDirectory() && !entry.name.startsWith("_")) {
      const isGroup = /^\(.*\)$/.test(entry.name);
      routes.push(
        ...collectRoutes(
          path.join(dir, entry.name),
          isGroup ? segments : [...segments, entry.name],
        ),
      );
    }
  }
  return routes;
}

let routes;
let dyn;
let rewrites;
let redirects;

function matchesRoute(segments) {
  return routes.some(
    (pattern) =>
      pattern.length === segments.length &&
      pattern.every((p, i) => {
        if (!/^\[.+\]$/.test(p)) return p === segments[i];
        const key = `${pattern[i - 1]}/${p}`;
        const allowed = dyn[key];
        return allowed ? allowed.has(segments[i]) : true;
      }),
  );
}

// Resolve a public URL path to a page, following at most one rewrite
// (as Next.js does for afterFiles rewrites).
function resolves(urlPath) {
  const clean = urlPath.split(/[?#]/)[0];
  const rewrite = rewrites.find((r) => r.source === clean);
  const target = rewrite ? rewrite.destination : clean;
  const parts = target.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  const [locale, ...rest] = parts;
  if (!LOCALES.includes(locale)) return false;
  return matchesRoute(rest);
}

before(async () => {
  routes = collectRoutes();
  dyn = dynamicValues();
  const config = require(path.join(ROOT, "next.config.js"));
  rewrites = await config.rewrites();
  redirects = await config.redirects();
});

describe("redirect destinations", () => {
  it("every next.config.js redirect points to a live page", () => {
    const dead = [];
    for (const rule of redirects) {
      assert.ok(!rule.destination.includes(":"), `unexpanded param in ${rule.destination}`);
      if (!resolves(rule.destination)) dead.push(`${rule.source} -> ${rule.destination}`);
    }
    assert.deepEqual(dead, [], `dead redirect destinations:\n${dead.join("\n")}`);
  });

  it("every rewrite points to a live page", () => {
    const dead = rewrites
      .filter((r) => !matchesRoute(r.destination.replace(/^\/+|\/+$/g, "").split("/").slice(1)))
      .map((r) => `${r.source} -> ${r.destination}`);
    assert.deepEqual(dead, [], `dead rewrite destinations:\n${dead.join("\n")}`);
  });

  it("middleware redirect targets are live pages in every locale", async () => {
    const source = fs.readFileSync(path.join(ROOT, "middleware.ts"), "utf8");
    // No hard-coded service paths: the old /services/family-office/ target 404ed.
    const literalTargets = [
      ...source.matchAll(/redirectWithHeaders\(\s*`\$\{localePrefix\}([^`]*)`/g),
    ].map((m) => m[1]);
    const builtTargets = [
      ...source.matchAll(/buildInternalUrl\(\s*"([^"]+)"/g),
    ].map((m) => m[1]);
    assert.ok(builtTargets.length > 0, "expected buildInternalUrl targets in middleware");
    const { buildInternalUrl } = await import("../src/lib/paths.ts");
    const dead = [];
    for (const locale of LOCALES) {
      for (const t of literalTargets) {
        const url = `/${locale}${t}`;
        if (!resolves(url)) dead.push(url);
      }
      for (const base of builtTargets) {
        const url = buildInternalUrl(base, locale);
        if (!resolves(url)) dead.push(url);
      }
    }
    assert.deepEqual(dead, [], `dead middleware targets:\n${dead.join("\n")}`);
  });
});

describe("generated internal URLs", () => {
  it("every sitemap path resolves in every locale (localized slugs included)", async () => {
    const { buildInternalUrl } = await import("../src/lib/paths.ts");
    const sitemap = fs.readFileSync(path.join(ROOT, "app/sitemap.xml/route.ts"), "utf8");
    const listed = [
      ...sitemap.matchAll(/^\s*"(\/[a-z0-9/-]*)",\s*$/gm),
    ].map((m) => m[1]);
    assert.ok(listed.length >= 10, "could not parse sitemap static/service paths");
    const cities = [...dyn["family-office/[city]"]].map((c) => `/family-office/${c}`);
    const dead = [];
    for (const base of [...listed, ...cities]) {
      for (const locale of LOCALES) {
        const url = buildInternalUrl(base, locale);
        if (!resolves(url)) dead.push(`${base} (${locale}) -> ${url}`);
      }
    }
    assert.deepEqual(dead, [], `unresolvable URLs:\n${dead.join("\n")}`);
  });

  it("every service route directory has a localized slug that resolves in every locale", async () => {
    const { buildInternalUrl, switchLocalePath } = await import("../src/lib/paths.ts");
    const serviceDirs = fs
      .readdirSync(path.join(APP_LOCALE_DIR, "services"), { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => `/services/${e.name}`);
    const dead = [];
    for (const base of serviceDirs) {
      for (const locale of LOCALES) {
        const url = buildInternalUrl(base, locale);
        if (!resolves(url)) dead.push(url);
        // The language switcher must land on the same page in every other locale.
        for (const target of LOCALES) {
          const switched = switchLocalePath(url, target);
          if (switched !== buildInternalUrl(base, target)) {
            dead.push(`switch ${url} -> ${target}: ${switched}`);
          }
        }
      }
    }
    assert.deepEqual(dead, [], dead.join("\n"));
  });
});
