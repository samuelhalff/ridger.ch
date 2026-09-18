#!/usr/bin/env node
/**
 * Optimize large raster images in /public/assets (or custom dir) producing WebP + AVIF.
 * - Scans for .jpg/.jpeg/.png over size threshold (default 100KB)
 * - Skips if optimized variant already smaller & newer
 * - Writes alongside originals: <name>.optimized.webp / <name>.optimized.avif
 * - Generates a summary table of savings
 *
 * Usage (package script): node scripts/compress-images.js [--dir public/assets] [--threshold 100] [--quality 82]
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const sharp = require('sharp');

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return def;
}

const ROOT = process.cwd();
const targetDir = path.resolve(ROOT, getArg('--dir', 'public/assets'));
const thresholdKB = parseInt(getArg('--threshold', '100'), 10); // kilobytes
const quality = parseInt(getArg('--quality', '82'), 10);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function isCandidate(file) {
  return /(\.jpe?g|\.png)$/i.test(file);
}

function human(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(2) + ' MB';
}

async function optimize(file) {
  const st = await stat(file);
  if (st.size < thresholdKB * 1024) return null;

  const dir = path.dirname(file);
  const base = path.basename(file).replace(/\.(jpe?g|png)$/i, '');
  const webpOut = path.join(dir, base + '.optimized.webp');
  const avifOut = path.join(dir, base + '.optimized.avif');

  async function maybeWrite(outPath, pipeline) {
    try {
      let regenerate = true;
      try {
        const outStat = await stat(outPath);
        if (outStat.mtimeMs > st.mtimeMs) regenerate = false;
      } catch { /* missing => regenerate */ }
      if (!regenerate) return { skipped: true, outPath };
      await pipeline.toFile(outPath);
      return { skipped: false, outPath };
    } catch (e) {
      console.error('Error writing', outPath, e.message);
      return { error: e };
    }
  }

  const image = sharp(file);
  const webpRes = await maybeWrite(webpOut, image.clone().webp({ quality, effort: 4 }));
  const avifRes = await maybeWrite(avifOut, image.clone().avif({ quality: Math.round(quality * 0.9), effort: 4 }));

  let webpSize = 0, avifSize = 0;
  try { webpSize = (await stat(webpOut)).size; } catch {}
  try { avifSize = (await stat(avifOut)).size; } catch {}

  return {
    file,
    original: st.size,
    webp: webpSize || null,
    avif: avifSize || null,
    webpSkipped: webpRes.skipped,
    avifSkipped: avifRes.skipped,
  };
}

(async function main() {
  const start = Date.now();
  if (!fs.existsSync(targetDir)) {
    console.error('Directory not found:', targetDir);
    process.exit(1);
  }
  console.log('Scanning directory:', targetDir);
  const all = await walk(targetDir);
  const candidates = all.filter(isCandidate);
  console.log('Found', candidates.length, 'raster images');
  const results = [];
  for (const f of candidates) {
    try {
      const r = await optimize(f);
      if (r) results.push(r);
    } catch (e) {
      console.error('Failed optimizing', f, e.message);
    }
  }

  const optimized = results.filter(r=>r);
  optimized.sort((a,b)=> b.original - a.original);
  console.log('\nSummary (threshold ' + thresholdKB + 'KB)');
  console.log('='.repeat(72));
  console.log('Original Size | WebP Size | AVIF Size | Savings (best) | File');
  console.log('-'.repeat(72));
  let totalOriginal = 0, totalBest = 0;
  for (const r of optimized) {
    totalOriginal += r.original;
    const best = Math.min(r.webp || Infinity, r.avif || Infinity);
    if (Number.isFinite(best)) totalBest += best; else totalBest += r.original;
    const savings = Number.isFinite(best) ? (((r.original - best)/r.original)*100).toFixed(1)+'%' : '0%';
    console.log(
      [human(r.original).padEnd(13), human(r.webp||0).padEnd(10), human(r.avif||0).padEnd(10), savings.padEnd(14), path.relative(targetDir, r.file)].join(' | ')
    );
  }
  console.log('-'.repeat(72));
  console.log('Total original:', human(totalOriginal));
  console.log('Total best    :', human(totalBest));
  if (totalOriginal > 0) console.log('Aggregate saving:', (((totalOriginal-totalBest)/totalOriginal)*100).toFixed(2)+'%');
  console.log('\nTime:', ((Date.now()-start)/1000).toFixed(2),'s');
})();
