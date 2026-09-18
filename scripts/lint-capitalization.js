#!/usr/bin/env node
/*
  Lint translation capitalization (safe heuristics)
  - Warn when a string value likely meant for UI starts with a lowercase letter.
  - Skip URLs, emails, placeholders, acronyms, locale labels, and arrays.
  - Optional --fix will capitalize the first letter safely.
  - Optional --strict exits with code 1 on warnings; default is exit 0.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, 'src', 'translations');

const args = new Set(process.argv.slice(2));
const FIX = args.has('--fix');
const STRICT = args.has('--strict');

/** Heuristics for skipping keys */
const SKIP_KEY_REGEX = /(^Lang$)|(^Themes$)|(^CompanyFooter$)|(^ImageAltPrefix$)|(^Slug$)|(^URL$)|(^Href$)|(^aria-)|(^label$)|(^Minutes$)|(^LastUpdated$)|(^Links$)|(^Links\.)|(^swissdec$)|(^chch)/i;
const SKIP_FILE_REGEX = /metadata\.json$/i;

/** Heuristics for skipping values */
function shouldSkipValue(str) {
  if (!str) return true;
  const s = String(str);
  if (s.length < 2) return true;
  if (/^\s/.test(s)) return true; // leading spaces, leave as-is
  if (/^https?:\/\//i.test(s)) return true;
  if (/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(s)) return true; // email
  if (/[{}<>]/.test(s)) return true; // likely placeholder
  if (/^#[0-9A-Fa-f]{3,6}$/.test(s)) return true; // hex color
  if (/^[A-Z0-9 _-]+$/.test(s)) return true; // all-caps or codes
  if (/^swissdec$/i.test(s)) return true; // brand spelled lowercase intentionally
  return false;
}

function capitalizeFirstLetterSafe(str) {
  if (!str) return str;
  return str.replace(/^[a-zàâäçéèêëîïôöùûüÿñ]/, (c) => c.toUpperCase());
}

function* walkTranslations(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walkTranslations(p);
    } else if (e.isFile() && e.name.endsWith('.json')) {
      yield p;
    }
  }
}

function visit(obj, onString, pathStack = []) {
  if (Array.isArray(obj)) {
    // Skip arrays (often content lists where case may vary intentionally)
    return;
    // If needed, iterate array items here
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const newStack = pathStack.concat(k);
      if (v == null) continue;
      if (typeof v === 'string') {
        onString(newStack, k, v);
      } else if (typeof v === 'object') {
        visit(v, onString, newStack);
      }
    }
  }
}

let warnings = 0;
let fixed = 0;

for (const localeDir of fs.readdirSync(TRANSLATIONS_DIR)) {
  const localePath = path.join(TRANSLATIONS_DIR, localeDir);
  if (!fs.statSync(localePath).isDirectory()) continue;

  for (const filePath of walkTranslations(localePath)) {
    if (SKIP_FILE_REGEX.test(filePath)) continue;
    let json;
    try {
      json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`Capitalization lint: Failed to parse ${filePath}: ${e.message}`);
      continue;
    }

    let mutated = false;
    visit(json, (stack, key, value) => {
      if (SKIP_KEY_REGEX.test(key)) return;
      if (shouldSkipValue(value)) return;
      const first = value.charAt(0);
      const isLower = first.toLocaleLowerCase() === first && /[a-zàâäçéèêëîïôöùûüÿñ]/.test(first);
      if (isLower) {
        warnings++;
        const displayPath = `${filePath.replace(ROOT + path.sep, '')}:${stack.join('.')}`;
        if (FIX) {
          const newVal = capitalizeFirstLetterSafe(value);
          if (newVal !== value) {
            // Mutate
            let cursor = json;
            for (let i = 0; i < stack.length - 1; i++) cursor = cursor[stack[i]];
            cursor[stack[stack.length - 1]] = newVal;
            mutated = true;
            fixed++;
            console.log(`fix: ${displayPath}`);
          }
        } else {
          console.warn(`warn: ${displayPath} -> starts with lowercase`);
        }
      }
    });

    if (mutated) {
      try {
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf8');
      } catch (e) {
        console.error(`Capitalization lint: Failed to write ${filePath}: ${e.message}`);
      }
    }
  }
}

const summary = `Capitalization lint: ${warnings} issue(s)` + (FIX ? `, ${fixed} fixed` : '');
console.log(summary);
if (STRICT && warnings > 0 && !FIX) process.exit(1);
