#!/usr/bin/env node
/**
 * Verify that all service hero images referenced in code have blur placeholders.
 */
const fs = require('fs');
const path = require('path');

const CODE_FILES = [
  path.resolve(process.cwd(), 'app/[locale]/home/components/services-items.tsx'),
  ...['accounting','corporate','domiciliation','incorporation','odoo','outsourcing','payroll','taxes'].map(
    (s) => path.resolve(process.cwd(), `app/[locale]/services/${s}/components/hero.tsx`)
  ),
];

const blurJsonPath = path.resolve(process.cwd(), 'src/lib/heroBlurData.json');
const blurMap = JSON.parse(fs.readFileSync(blurJsonPath, 'utf8'));

function collectImagesFromFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  // crude match for \/assets\/hero\/services\/...\.(webp|avif|jpg|png)
  const re = /\/assets\/hero\/services\/[\w-]+\.(?:webp|avif|jpg|jpeg|png)/g;
  const matches = content.match(re) || [];
  return Array.from(new Set(matches));
}

const images = new Set();
for (const f of CODE_FILES) {
  for (const img of collectImagesFromFile(f)) images.add(img);
}

let missing = [];
for (const img of images) {
  if (!blurMap[img]) missing.push(img);
}

if (missing.length) {
  console.error("Missing blur placeholders for:");
  for (const m of missing) console.error(" -", m);
  process.exit(2);
}
console.log("All referenced service hero images have blur placeholders.");
