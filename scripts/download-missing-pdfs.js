'use strict';

// Download missing PDFs listed in ressources.json (default: fr) into public/assets/downloads
// Usage:
//   node scripts/download-missing-pdfs.js [--locale fr] [--dry-run] [--force]
//
// Notes:
// - Only entries with .pdf filename are considered.
// - If source_url is not a direct PDF (content-type not PDF), the script will skip and warn.
// - Requires Node 18+ (global fetch). If unavailable, upgrade Node.

const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');

const streamPipeline = promisify(pipeline);

const args = process.argv.slice(2);
function getArgValue(flag, fallback) {
  const i = args.indexOf(flag);
  if (i !== -1 && i + 1 < args.length) return args[i + 1];
  return fallback;
}

const locale = getArgValue('--locale', 'fr');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (typeof fetch !== 'function') {
  console.error('This script requires Node 18+ (global fetch). Please upgrade your Node runtime.');
  process.exit(1);
}

const ROOT = process.cwd();
const DOWNLOAD_DIR = path.join(ROOT, 'public', 'assets', 'downloads');
const RES_PATH = path.join(ROOT, 'src', 'translations', locale, 'ressources.json');

async function ensureDir(dir) {
  await fs.promises.mkdir(dir, { recursive: true });
}

function isPdfLikeResponse(res) {
  const ct = res.headers.get('content-type') || '';
  const cd = res.headers.get('content-disposition') || '';
  const url = res.url || '';
  const ctPdf = /application\/(pdf|octet-stream)/i.test(ct) && !/html/i.test(ct);
  const urlPdf = /\.pdf(\?|#|$)/i.test(url);
  const cdPdf = /filename\*=?.*\.pdf/i.test(cd) || /filename=.*\.pdf/i.test(cd);
  return ctPdf || urlPdf || cdPdf;
}

async function downloadToFile(url, destPath) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      // A simple UA helps with a few strict servers
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
      'Accept': 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  if (!isPdfLikeResponse(res)) {
    throw new Error('Response is not a PDF (content-type/URL suggests HTML or other).');
  }
  await ensureDir(path.dirname(destPath));
  const fileStream = fs.createWriteStream(destPath);
  // Node fetch body is a web ReadableStream; convert via stream.pipeline
  await streamPipeline(require('stream').Readable.fromWeb(res.body), fileStream);
}

async function main() {
  console.log(`Scanning ${RES_PATH} for PDF entries...`);
  let json;
  try {
    const raw = await fs.promises.readFile(RES_PATH, 'utf8');
    json = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to read ${RES_PATH}:`, e.message);
    process.exit(1);
  }

  const files = Array.isArray(json.Files) ? json.Files : [];
  const pdfs = files.filter((f) => {
    const name = (f && f.filename) || '';
    return typeof name === 'string' && name.toLowerCase().endsWith('.pdf');
  });

  if (pdfs.length === 0) {
    console.log('No PDF entries found. Nothing to do.');
    return;
  }

  await ensureDir(DOWNLOAD_DIR);

  let missing = 0;
  let downloaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const item of pdfs) {
    const filename = item.filename;
    const sourceUrl = item.source_url;
    const dest = path.join(DOWNLOAD_DIR, filename);

    const exists = fs.existsSync(dest);
    if (exists && !force) {
      console.log(`✔ Exists: ${filename}`);
      skipped++;
      continue;
    }

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      console.warn(`⚠ Missing source_url for ${filename} — cannot download automatically.`);
      errors++;
      continue;
    }

    if (!exists) missing++;

    if (dryRun) {
      console.log(`[dry-run] Would download -> ${filename} from ${sourceUrl}`);
      continue;
    }
    try {
      console.log(`↓ Downloading ${filename} from ${sourceUrl} ...`);
      await downloadToFile(sourceUrl, dest);
      console.log(`✓ Saved to ${path.relative(ROOT, dest)}`);
      downloaded++;
    } catch (e) {
      console.error(`✗ Failed ${filename}: ${e.message}`);
      errors++;
    }
  }

  console.log('\nSummary:');
  console.log(`  PDFs listed: ${pdfs.length}`);
  console.log(`  Existing (skipped): ${skipped}`);
  console.log(`  Missing (at start): ${missing}`);
  if (!dryRun) console.log(`  Downloaded: ${downloaded}`);
  if (errors) console.log(`  Warnings/Errors: ${errors}`);
  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exit(1);
});
