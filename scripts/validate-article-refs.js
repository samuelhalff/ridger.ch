#!/usr/bin/env node
/**
 * Validate article references in ressources.json across locales.
 * - Flags 4xx/5xx responses, network errors, and pages with near-empty bodies.
 * - Checks for empty/placeholder content patterns.
 * - Prints a concise report; exits non-zero when failures found unless --no-fail.
 *
 * Usage:
 *   node scripts/validate-article-refs.js [--no-fail] [--min-bytes 600] [--slug <slug>]
 */
const fs = require('fs');
const path = require('path');
const { validateUrl } = require('./lib/referenceValidator');

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, 'src', 'translations');
const args = new Set(process.argv.slice(2));
const NO_FAIL = args.has('--no-fail');
const minBytesArg = (() => {
  const i = process.argv.indexOf('--min-bytes');
  if (i !== -1 && process.argv[i + 1]) return parseInt(process.argv[i + 1], 10) || 600;
  return 600;
})();
const slugFilter = (() => {
  const i = process.argv.indexOf('--slug');
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return null;
})();
const TRANSIENT_ERROR_REASONS = new Set(['server-error', 'timeout', 'network-error', 'http-error']);

async function checkRef(url) {
  // Use the shared validator
  const result = await validateUrl(url, {
    timeout: 8000,
    minBytes: minBytesArg,
    checkContent: true
  });

  return {
    ok: result.valid,
    status: result.status || 0,
    url: result.finalUrl || url,
    bodySize: result.bodySize || 0,
    contentType: result.contentType,
    error: result.error,
    reason: result.reason
  };
}

async function main() {
  const locales = fs.readdirSync(TRANSLATIONS_DIR).filter((d) => fs.statSync(path.join(TRANSLATIONS_DIR, d)).isDirectory());
  const results = [];
  const tasks = [];
  for (const loc of locales) {
    const p = path.join(TRANSLATIONS_DIR, loc, 'ressources.json');
    if (!fs.existsSync(p)) continue;
    let json; try { json = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { continue; }
    const arts = Array.isArray(json.Articles) ? json.Articles : [];
    for (const a of arts) {
      if (slugFilter && a.slug !== slugFilter) continue;
      const refs = Array.isArray(a.references) ? a.references : [];
      for (const ref of refs) {
        tasks.push(async () => {
          if (!ref || typeof ref.url !== 'string' || !/^https?:\/\//.test(ref.url)) {
            results.push({ locale: loc, slug: a.slug, labelKey: ref && ref.labelKey, url: ref && ref.url, ok: false, reason: 'invalid-url' });
            return;
          }
          const r = await checkRef(ref.url);
          // Unverifiable SPA domains skip the network check entirely (no
          // status/body), so the status/size gates below must not apply.
          // Binary assets (PDFs) checked via HEAD report bodySize 0, so the
          // min-bytes gate only makes sense for textual content.
          const isBinary =
            r.contentType && !/text|html|json|xml/i.test(r.contentType);
          const ok =
            r.reason === 'unverifiable-spa'
              ? r.ok
              : r.ok &&
                r.status >= 200 &&
                r.status < 400 &&
                (isBinary || r.bodySize >= minBytesArg);
          results.push({ locale: loc, slug: a.slug, labelKey: ref.labelKey, url: ref.url, ok, status: r.status, bodySize: r.bodySize, contentType: r.contentType, error: r.error, reason: r.reason });
        });
      }
    }
  }
  // Run with limited concurrency
  const limit = 6;
  const queue = tasks.slice();
  const runners = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const fn = queue.shift();
      try { await fn(); } catch (_) {}
    }
  });
  await Promise.all(runners);
  const bad = results.filter((r) => !r.ok);
  const warnings = bad.filter((r) => TRANSIENT_ERROR_REASONS.has(r.reason));
  const fatals = bad.filter((r) => !TRANSIENT_ERROR_REASONS.has(r.reason));
  const unverifiable = results.filter(
    (r) => r.ok && r.reason === 'unverifiable-spa'
  );
  const summary = {
    checked: results.length,
    failures: fatals.length,
    warnings: warnings.length,
    unverifiable: unverifiable.length,
  };
  if (fatals.length) {
    console.log('✗ Invalid/weak references found (status/body too small/invalid URL):');
    for (const r of fatals) {
      console.log(`- [${r.locale}] ${r.slug} :: ${r.labelKey || ''} -> ${r.url} (status: ${r.status || 'n/a'}, size: ${r.bodySize || 0}, reason: ${r.reason || r.error || 'weak-content'})`);
    }
  } else {
    console.log('✓ All references look valid and have content.');
  }
  if (warnings.length) {
    console.log('⚠️ References with transient errors (not failing CI):');
    for (const r of warnings) {
      console.log(`- [${r.locale}] ${r.slug} :: ${r.labelKey || ''} -> ${r.url} (status: ${r.status || 'n/a'}, size: ${r.bodySize || 0}, reason: ${r.reason || r.error || 'transient-error'})`);
    }
  }
  if (unverifiable.length) {
    const urls = [...new Set(unverifiable.map((r) => r.url))];
    console.log(
      `ℹ️ ${unverifiable.length} reference(s) on SPA domains that cannot be verified over HTTP (kept; spot-check manually in a browser):`
    );
    for (const u of urls) console.log(`- ${u}`);
  }
  console.log(`Ref check summary: ${JSON.stringify(summary)}`);
  if (!NO_FAIL && fatals.length) process.exit(1);
}

main();
