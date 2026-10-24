#!/usr/bin/env node
// Ridger guardrails: no Ark-inherited content served or linked, pillar and
// typical-situation copy present in all locales, no quote wording on
// rendered lead paths.
//
// Run: node --import ./scripts/lib/register-ts.mjs --test scripts/ridger-hygiene.test.js
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const LOCALES = ["fr", "en", "de", "es", "pt"];
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const json = (rel) => JSON.parse(read(rel));

const ARK_NAMESPACES = [
  "testimonials", "accounting", "payroll", "incorporation", "taxes",
  "outsourcing", "domiciliation", "corporate", "immigration", "odoo", "mna",
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/node_modules|\.next|\.git|\.claude/.test(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

describe("/api/translations allowlist", () => {
  it("does not expose Ark-inherited namespaces", async () => {
    const { namespaces, namespaceSet } = await import(
      path.join(ROOT, "src/lib/i18n-namespaces.ts")
    );
    for (const ns of ARK_NAMESPACES) {
      assert.equal(namespaceSet.has(ns), false, `${ns} must not be allowlisted`);
    }
    assert.equal(namespaces.length, namespaceSet.size);
  });

  it("only allowlists namespaces that exist in every locale", async () => {
    const { namespaces } = await import(
      path.join(ROOT, "src/lib/i18n-namespaces.ts")
    );
    for (const locale of LOCALES) {
      for (const ns of namespaces) {
        assert.ok(
          fs.existsSync(path.join(ROOT, "src/translations", locale, `${ns}.json`)),
          `${locale}/${ns}.json missing`,
        );
      }
    }
  });

  it("keeps Ark namespace files out of the repo", () => {
    for (const locale of LOCALES) {
      for (const ns of ARK_NAMESPACES) {
        assert.equal(
          fs.existsSync(path.join(ROOT, "src/translations", locale, `${ns}.json`)),
          false,
          `${locale}/${ns}.json should not exist`,
        );
      }
    }
  });

  it("gates the route on the allowlist", () => {
    const route = read("app/api/translations/[lng]/[ns]/route.ts");
    assert.match(route, /namespaceSet\.has\(value\)/);
    assert.match(route, /!isNamespace\(ns\)/);
  });

  it("no code loads an Ark namespace", () => {
    const re = new RegExp(
      `(?:getTranslations|loadTranslations|getTranslationsRecord|useTranslation)\\([^)]*["'\`](${ARK_NAMESPACES.join("|")})["'\`]`,
    );
    for (const dir of ["app", "src"]) {
      for (const file of walk(path.join(ROOT, dir))) {
        assert.doesNotMatch(read(path.relative(ROOT, file)), re, file);
      }
    }
  });
});

describe("no link to Ark's Google Business Profile", () => {
  it("never references Ark's Maps CID or place id in code", () => {
    const needles = ["14946625157719331801", "0x478c65f758b086cb", "Ark+Fiduciaire"];
    for (const dir of ["app", "src"]) {
      for (const file of walk(path.join(ROOT, dir))) {
        const src = read(path.relative(ROOT, file));
        for (const n of needles) assert.ok(!src.includes(n), `${file} contains ${n}`);
      }
    }
  });
});

describe("service pillar articles", () => {
  const map = {};
  const src = read("src/lib/servicePillarArticle.ts");
  for (const m of src.matchAll(/"(\/services\/[a-z-]+)":\s*"([a-z0-9-]+)"/g)) {
    map[m[1]] = m[2];
  }

  it("covers the 11 services", () => {
    assert.equal(Object.keys(map).length, 11);
  });

  it("points to an article present in every locale", () => {
    for (const locale of LOCALES) {
      const slugs = new Set(
        json(`src/translations/${locale}/ressources.json`).Articles.map((a) => a.slug),
      );
      for (const [service, slug] of Object.entries(map)) {
        assert.ok(slugs.has(slug), `${locale}: ${service} -> ${slug} missing`);
      }
    }
  });
});

describe("typical situations", () => {
  const services = [
    "family-office-coordination",
    "consolidated-reporting",
    "household-staff",
    "relocation-residence",
    "tax-administration",
  ];

  it("has two cases per service in every locale and shared labels", () => {
    for (const locale of LOCALES) {
      const shared = json(`src/translations/${locale}/services.json`);
      for (const k of ["Title", "Disclaimer", "SituationLabel", "WhatWeDoLabel"]) {
        assert.ok(shared.TypicalSituations?.[k], `${locale} services ${k}`);
      }
      assert.ok(shared.ServiceRelated?.PillarLabel, `${locale} PillarLabel`);
      for (const ns of services) {
        const cases = json(`src/translations/${locale}/${ns}.json`).TypicalSituations?.Cases;
        assert.equal(cases?.length, 2, `${locale}/${ns}`);
        for (const c of cases) {
          assert.ok(c.Situation && c.WhatWeDo, `${locale}/${ns} case incomplete`);
        }
      }
    }
  });

  it("carries no figures, percentages, amounts, timeframes or outcome promises", () => {
    const bad = new RegExp(
      [
        "\\d|%|CHF|garanti|guarantee|garantiert|garantiz|garant",
        // fr
        "en quelques (semaines|jours|mois)|jusqu'au bout|d[ée]j[àa] en place|sous \\w+ (semaines|jours)",
        // en
        "within (days|weeks|months)|in (a few|just a few) (days|weeks|months)|through to the end|to the end|already in place",
        // de
        "innerhalb (weniger|von) (wochen|tage|monate)|bis zum abschluss|bereits vor|bereits bereit",
        // es
        "en pocas semanas|hasta el final|ya en su lugar|ya est[aá]n",
        // pt
        "em poucas semanas|at[ée] ao fim|j[áa] em funcionamento|j[áa] est[ãa]o",
      ].join("|"),
      "i",
    );
    for (const locale of LOCALES) {
      for (const ns of services) {
        for (const c of json(`src/translations/${locale}/${ns}.json`).TypicalSituations.Cases) {
          assert.doesNotMatch(c.Situation, bad, `${locale}/${ns}`);
          assert.doesNotMatch(c.WhatWeDo, bad, `${locale}/${ns}`);
        }
      }
    }
  });
});

describe("lead paths", () => {
  it("renders no quote or free-consultation wording in app/src code", () => {
    const re = /instant quote|get a quote|free consultation|devis instantan/i;
    for (const dir of ["app", "src"]) {
      for (const file of walk(path.join(ROOT, dir))) {
        assert.doesNotMatch(read(path.relative(ROOT, file)), re, file);
      }
    }
  });

  it("article end block offers the contact form and WhatsApp only", () => {
    const section = read("app/[locale]/ressources/articles/components/ContactSection.tsx");
    assert.match(section, /WHATSAPP_URL/);
    assert.match(section, /channel: "whatsapp"/);
    for (const locale of LOCALES) {
      const c = json(`src/translations/${locale}/ressources.json`).Contact;
      assert.ok(c.WhatsAppButtonText, `${locale} WhatsAppButtonText`);
      assert.equal(c.SecondaryButtonText, undefined, `${locale} stale SecondaryButtonText`);
    }
  });
});
