#!/usr/bin/env node
/*
  Lints translation JSON to ensure key parity across locales for selected namespaces.
  - Reports missing keys per locale
  - Exits non-zero if any missing keys are found
*/
const fs = require('fs');
const path = require('path');

const LOCALES = ['en', 'fr', 'de', 'es', 'pt'];
const NAMESPACES = [
  'navbar',
  'servicesItems',
  'team',
  'contact',
];

function flatten(obj, prefix = '') {
  return Object.keys(obj || {}).reduce((acc, key) => {
    const val = obj[key];
    const p = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(acc, flatten(val, p));
    } else {
      acc[p] = val;
    }
    return acc;
  }, {});
}

function readNs(locale, ns) {
  const file = path.join(process.cwd(), 'src', 'translations', locale, `${ns}.json`);
  try {
    const txt = fs.readFileSync(file, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return null;
  }
}

let missing = [];
let emptyStrings = [];

for (const ns of NAMESPACES) {
  // union of keys across all locales for this namespace
  const union = new Set();
  const perLocale = {};
  for (const loc of LOCALES) {
    const data = readNs(loc, ns) || {};
    const flat = flatten(data);
    perLocale[loc] = flat;
    Object.keys(flat).forEach((k) => union.add(k));
  }
  for (const loc of LOCALES) {
    for (const key of union) {
      if (!(key in perLocale[loc])) {
        missing.push({ locale: loc, ns, key });
      } else {
        const v = perLocale[loc][key];
        if (typeof v === 'string' && v.trim().length === 0) {
          emptyStrings.push({ locale: loc, ns, key });
        }
      }
    }
  }
}

if (missing.length || emptyStrings.length) {
  if (missing.length) {
    console.error(`\nTranslation keys missing (${missing.length}):`);
    for (const m of missing) {
      console.error(` - [${m.locale}] ${m.ns}: ${m.key}`);
    }
  }
  if (emptyStrings.length) {
    console.error(`\nTranslation keys with empty string values (${emptyStrings.length}):`);
    for (const m of emptyStrings) {
      console.error(` - [${m.locale}] ${m.ns}: ${m.key}`);
    }
  }
  console.error(`\nTranslation keys missing (${missing.length}):`);
  process.exit(1);
} else {
  console.log('All translation namespaces have full key parity across locales.');
}
