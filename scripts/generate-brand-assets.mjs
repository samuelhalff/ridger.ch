/**
 * generate-brand-assets.mjs
 * Generates:
 *   - public/favicon.png  (180x180 — used as apple-touch-icon and favicon.png)
 *   - public/favicon.ico  (32x32 ico via png rename trick)
 *   - public/assets/og/og-{fr,en,de,es,pt}.webp  (1200x630)
 *
 * Run: node scripts/generate-brand-assets.mjs
 */

import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Colour constants ──────────────────────────────────────────────────────────
const PINE   = { r: 30,  g: 58,  b: 50  }; // #1e3a32
const PAPER  = { r: 250, g: 247, b: 242 }; // #faf7f2
const BRONZE = { r: 154, g: 123, b: 79  }; // #9a7b4f

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

// ── Favicon (180×180) ─────────────────────────────────────────────────────────
async function generateFavicon() {
  const size = 180;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="28" fill="#1e3a32"/>
  <!-- Thin bronze rule accent top-left -->
  <rect x="24" y="30" width="132" height="3" fill="#9a7b4f" opacity="0.7"/>
  <!-- R monogram -->
  <text
    x="50%"
    y="58%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Georgia, serif"
    font-size="108"
    font-weight="400"
    fill="#faf7f2"
    letter-spacing="-2"
  >R</text>
  <!-- Thin bronze rule bottom -->
  <rect x="24" y="147" width="132" height="3" fill="#9a7b4f" opacity="0.7"/>
</svg>`;

  const pngPath = join(ROOT, "public", "favicon.png");
  await sharp(Buffer.from(svg))
    .png()
    .resize(180, 180)
    .toFile(pngPath);
  console.log("✓ favicon.png (180×180)");

  // 32×32 version for favicon.ico (browsers accept a PNG renamed .ico)
  const icoPath = join(ROOT, "public", "favicon.ico");
  await sharp(Buffer.from(svg))
    .png()
    .resize(32, 32)
    .toFile(icoPath);
  console.log("✓ favicon.ico (32×32 PNG)");
}

// ── OG images (1200×630) ─────────────────────────────────────────────────────
const OG_LOCALES = {
  fr: "Family office nouvelle génération — Genève",
  en: "A new-generation family office — Geneva",
  de: "Family Office der neuen Generation — Genf",
  es: "Family office de nueva generación — Ginebra",
  pt: "Family office de nova geração — Genebra",
};

async function generateOgImage(locale, subtitle) {
  const W = 1200;
  const H = 630;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Background: deep pine -->
  <rect width="${W}" height="${H}" fill="#1e3a32"/>

  <!-- Subtle texture layer: faint diagonal lines -->
  <line x1="0" y1="0" x2="${W}" y2="${H}" stroke="#faf7f2" stroke-width="0.5" opacity="0.04"/>
  <line x1="${W}" y1="0" x2="0" y2="${H}" stroke="#faf7f2" stroke-width="0.5" opacity="0.04"/>

  <!-- Bronze hairline rules -->
  <rect x="80" y="210" width="1040" height="1.5" fill="#9a7b4f" opacity="0.6"/>
  <rect x="80" y="420" width="1040" height="1.5" fill="#9a7b4f" opacity="0.6"/>

  <!-- Bronze accent block -->
  <rect x="80" y="195" width="48" height="16" fill="#9a7b4f" rx="1"/>

  <!-- RIDGER wordmark -->
  <text
    x="80"
    y="375"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="112"
    font-weight="400"
    letter-spacing="28"
    fill="#faf7f2"
    text-rendering="geometricPrecision"
  >RIDGER</text>

  <!-- Subtitle in mono style -->
  <text
    x="82"
    y="464"
    font-family="'Courier New', Courier, monospace"
    font-size="24"
    font-weight="400"
    letter-spacing="1.5"
    fill="#faf7f2"
    opacity="0.72"
    text-rendering="geometricPrecision"
  >${subtitle}</text>

  <!-- ridger.ch label bottom right -->
  <text
    x="${W - 80}"
    y="${H - 48}"
    font-family="'Courier New', Courier, monospace"
    font-size="20"
    font-weight="400"
    letter-spacing="2"
    fill="#9a7b4f"
    text-anchor="end"
    opacity="0.8"
  >ridger.ch</text>
</svg>`;

  const outPath = join(ROOT, "public", "assets", "og", `og-${locale}.webp`);
  await sharp(Buffer.from(svg))
    .resize(W, H)
    .webp({ quality: 88 })
    .toFile(outPath);
  console.log(`✓ og-${locale}.webp`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await generateFavicon();
  for (const [locale, subtitle] of Object.entries(OG_LOCALES)) {
    await generateOgImage(locale, subtitle);
  }
  console.log("\nAll brand assets generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
