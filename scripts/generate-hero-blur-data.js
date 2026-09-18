#!/usr/bin/env node
/**
 * Generate dominant-color based ultra-low-res blur placeholders for service hero images.
 *
 * Keys include the exact asset path (e.g. /assets/hero/services/foo.jpg) and a
 * .webp compatibility alias for each base name so existing lookups continue to work
 * regardless of source extension.
 *
 * Example output:
 * {
 *   "/assets/hero/services/accounting-hero.jpg": "data:image...",
 *   "/assets/hero/services/accounting-hero.webp": "data:image..."
 * }
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const HERO_DIR = path.resolve(process.cwd(), 'public/assets/hero/services');
const OUT_FILE = path.resolve(process.cwd(), 'src/lib/heroBlurData.json');
const ACCEPT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

async function tinyBase64(p) {
  const img = sharp(p);
  // Resize to very small square while preserving aspect ratio inside 16x16 box
  const buf = await img.resize(16, 16, { fit: 'inside' }).webp({ quality: 50 }).toBuffer();
  return 'data:image/webp;base64,' + buf.toString('base64');
}

async function dominantColorPlaceholder(p) {
  const { dominant } = await sharp(p).stats();
  if (!dominant) return null;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><rect width='32' height='32' fill='rgb(${dominant.r},${dominant.g},${dominant.b})'/></svg>`;
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

async function compositePlaceholder(p) {
  try {
    const tiny = await tinyBase64(p);
    const dom = await dominantColorPlaceholder(p);
    // Prefer tiny blurred bitmap (better perceived detail). Keep dominant color fallback if needed.
    return tiny || dom;
  } catch (e) {
    return null;
  }
}

async function run() {
  const entries = await fs.promises.readdir(HERO_DIR);
  const mapping = {};
  for (const f of entries) {
    const full = path.join(HERO_DIR, f);
    const ext = path.extname(f).toLowerCase();
    if (!ACCEPT.has(ext)) continue;
    const base = path.basename(f, ext);
    const exactKey = `/assets/hero/services/${base}${ext}`;
    const webpAliasKey = `/assets/hero/services/${base}.webp`;
    const placeholder = await compositePlaceholder(full);
    if (!placeholder) continue;
    if (!mapping[exactKey]) mapping[exactKey] = placeholder;
    if (!mapping[webpAliasKey]) mapping[webpAliasKey] = placeholder;
  }
  await fs.promises.writeFile(OUT_FILE, JSON.stringify(mapping, null, 2));
  console.log('Wrote blur data for', Object.keys(mapping).length, 'hero images to', path.relative(process.cwd(), OUT_FILE));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

