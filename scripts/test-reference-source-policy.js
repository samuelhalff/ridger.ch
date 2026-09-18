#!/usr/bin/env node
"use strict";

const assert = require("assert/strict");
const { spawnSync } = require("child_process");
const {
  ALLOWED_REFERENCE_DOMAINS,
  isBlockedDomain,
  isTrustedDomain,
} = require("./lib/referenceValidator");

const allowedExamples = [
  "https://www.admin.ch/gov/fr/accueil.html",
  "https://www.estv.admin.ch/estv/fr/home.html",
  "https://www.ge.ch/",
  "https://www.odoo.com/documentation",
  "https://www.ocas.ch/",
  "https://www.rab-asr.ch/",
  "https://www.so-fit.ch/",
  "https://www.swissmem.ch/fr/",
  "https://entscheidsuche.ch/view/CH_BGer_009_9C-606-2025_2026-02-24",
  "https://www.swissdec.ch/fr/",
  "https://houle.ai/",
];

const firmDomains = [
  "cobalt-it.ch",
  "ficops.ch",
  "fidflow.ch",
  "hoop.swiss",
  "niris.ch",
  "open-net.ch",
];

for (const url of allowedExamples) {
  assert.equal(isBlockedDomain(url), false, `${url} should be allowed`);
}

assert.equal(
  isTrustedDomain("https://www.estv.admin.ch/estv/fr/home.html"),
  true,
  "official federal source should be trusted",
);
assert.equal(
  isTrustedDomain("https://www.odoo.com/documentation"),
  true,
  "Odoo official documentation should be trusted",
);

for (const domain of firmDomains) {
  assert.equal(
    isBlockedDomain(`https://${domain}/`),
    true,
    `${domain} should be blocked as a firm/competitor source`,
  );
  assert.equal(
    ALLOWED_REFERENCE_DOMAINS.includes(domain),
    false,
    `${domain} should not be in the curated source allowlist`,
  );
}

const runtimeAllowOverride = spawnSync(
  process.execPath,
  [
    "-e",
    "const { isBlockedDomain } = require('./scripts/lib/referenceValidator'); process.exit(isBlockedDomain('https://ficops.ch/') ? 0 : 1);",
  ],
  {
    cwd: process.cwd(),
    env: { ...process.env, REFERENCE_ALLOWED_DOMAINS: "ficops.ch" },
    stdio: "inherit",
  },
);
assert.equal(
  runtimeAllowOverride.status,
  0,
  "built-in firm blocklist should win over REFERENCE_ALLOWED_DOMAINS",
);

console.log("Reference source policy tests passed");
