#!/usr/bin/env node
'use strict';
/**
 * Check ressources.json file entries for:
 *  - Local file presence (public/assets/downloads/<filename>)
 *  - Optional remote HTTP checks (HEAD/GET): Files source_url and Articles references[].url
 *
 * Usage:
 *   node scripts/check-ressources-links.js [--locale fr] [--all-locales] [--remote] [--json]
 *
 * Exit codes:
 *   0: All good
 *   1: At least one missing local file
 *   2: Remote check enabled and at least one remote 404/failed
 */
const fs = require('fs');
const path = require('path');
const { listLocales } = require('./lib/ressources');

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const value = (f, d) => { const i = args.indexOf(f); return i !== -1 && i+1 < args.length ? args[i+1] : d; };

const ROOT = process.cwd();
const TRANSLATIONS_DIR = path.join(ROOT, 'src', 'translations');
const DOWNLOAD_DIR = path.join(ROOT, 'public', 'assets', 'downloads');

const oneLocale = value('--locale', 'fr');
const allLocales = flag('--all-locales');
const remote = flag('--remote');
const asJson = flag('--json');
const timeoutMs = parseInt(value('--timeout-ms', process.env.LINK_CHECK_TIMEOUT_MS || '10000'), 10);

if (remote && typeof fetch !== 'function') {
  console.error('Remote check requires Node 18+ (global fetch)');
  process.exit(1);
}

function fetchWithTimeout(url, options, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

function looksLikeMissing(html = "") {
  const s = String(html).toLowerCase();
  return (
    s.includes('content not found') ||
    s.includes('page not found') ||
    s.includes('page non trouvée') ||
    s.includes('page introuvable') ||
    s.includes('seite nicht gefunden') ||
    s.includes('contenu introuvable') ||
    s.includes('no content') ||
    s.includes('no content available') ||
    s.includes('aucun contenu') ||
    s.includes('kein inhalt') ||
    s.includes('keine inhalte') ||
    s.includes('sin contenido') ||
    s.includes('no hay contenido') ||
    s.includes('sem conteúdo') ||
    s.includes('no results found') ||
    s.includes('aucun résultat') ||
    s.includes('keine ergebnisse')
  );
}

async function checkLocale(locale) {
  const filePath = path.join(TRANSLATIONS_DIR, locale, 'ressources.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return { locale, error: 'parse_error', details: e.message };
  }
  const files = Array.isArray(data.Files) ? data.Files : [];
  const articles = Array.isArray(data.Articles) ? data.Articles : [];
  const results = [];
  for (const item of files) {
    const filename = item && item.filename;
    if (!filename) continue;
    const localPath = path.join(DOWNLOAD_DIR, filename);
    const exists = fs.existsSync(localPath);
    let remoteStatus = null;
    let remoteOk = null;
    if (remote && item.source_url) {
      try {
        const res = await fetchWithTimeout(item.source_url, { method: 'HEAD', redirect: 'follow' }, timeoutMs);
        remoteStatus = res.status;
        if (res.status === 405 || res.status === 403) { // some servers block HEAD
          const getRes = await fetchWithTimeout(item.source_url, { method: 'GET', redirect: 'follow' }, timeoutMs);
          remoteStatus = getRes.status;
        }
        remoteOk = remoteStatus >= 200 && remoteStatus < 300;
      } catch (e) {
        remoteStatus = 'ERR';
        remoteOk = false;
      }
    }
    results.push({
      filename,
      exists,
      source_url: item.source_url || null,
      remoteStatus,
      remoteOk
    });
  }

  // Check Article reference URLs when --remote
  const refResults = [];
  if (remote) {
    for (const art of articles) {
      const slug = art && art.slug;
      const refs = Array.isArray(art && art.references) ? art.references : [];
      for (const ref of refs) {
        if (!ref || !ref.url) continue;
        let status = null;
        let ok = null;
        try {
          let res = await fetchWithTimeout(ref.url, { method: 'HEAD', redirect: 'follow' }, timeoutMs);
          status = res.status;
          if (status === 405 || status === 403) {
            const getRes = await fetchWithTimeout(ref.url, { method: 'GET', redirect: 'follow' }, timeoutMs);
            status = getRes.status;
          }
          ok = status >= 200 && status < 300;
          // Soft 404 detection by body content
          try {
            const gr = await fetchWithTimeout(ref.url, { method: 'GET', redirect: 'follow' }, timeoutMs);
            const txt = await gr.text();
            if (looksLikeMissing(txt)) ok = false;
          } catch {}
        } catch (e) {
          status = 'ERR';
          ok = false;
        }
        refResults.push({ slug, url: ref.url, status, ok });
      }
    }
  }
  return { locale, results, refResults };
}

async function main() {
  const locales = allLocales
    ? listLocales(TRANSLATIONS_DIR, { requireRessources: true })
    : [oneLocale];
  const out = [];
  for (const loc of locales) {
    out.push(await checkLocale(loc));
  }
  if (asJson) {
    console.log(JSON.stringify(out, null, 2));
  } else {
    for (const loc of out) {
      if (loc.error) {
        console.log(`Locale ${loc.locale}: ERROR ${loc.error} (${loc.details})`);
        continue;
      }
      console.log(`\nLocale ${loc.locale}:`);
      for (const r of loc.results) {
        const status = [r.exists ? 'OK' : 'MISSING'];
        if (remote) status.push(r.remoteOk ? `REMOTE:${r.remoteStatus}` : `REMOTE_FAIL:${r.remoteStatus}`);
        console.log(`  - ${r.filename} => ${status.join(' | ')}`);
      }
      if (remote && Array.isArray(loc.refResults)) {
        for (const rr of loc.refResults) {
          console.log(`  * REF ${rr.slug} -> ${rr.url} : ${rr.ok ? 'OK' : 'REMOTE_FAIL'}${rr.status ? ` (${rr.status})` : ''}`);
        }
      }
    }
  }
  const anyMissing = out.some(l => (l.results||[]).some(r => !r.exists));
  const anyRemoteFail = remote && (
    out.some(l => (l.results||[]).some(r => r.remoteOk === false)) ||
    out.some(l => (l.refResults||[]).some(rr => rr.ok === false))
  );
  if (anyRemoteFail) process.exit(2);
  if (anyMissing) process.exit(1);
}

main();
