#!/usr/bin/env node
/**
 * SEO validation (blocking): configuration checks that must hold before a
 * merge. Exit code 1 on any error. The rendered HTML is checked after each
 * deploy by scripts/check-rendered-seo.mjs.
 */

const fs = require('fs');
const path = require('path');

let warnings = 0;
let errors = 0;

function warn(msg) {
  console.warn('⚠️  WARNING:', msg);
  warnings++;
}

function error(msg) {
  console.error('❌ ERROR:', msg);
  errors++;
}

function success(msg) {
  console.log('✅', msg);
}

// Check next.config.js for trailingSlash setting
function checkTrailingSlashConfig() {
  try {
    const configPath = path.join(process.cwd(), 'next.config.js');
    const content = fs.readFileSync(configPath, 'utf8');
    if (content.includes('trailingSlash: true')) {
      success('next.config.js has trailingSlash: true');
      return true;
    } else {
      warn('next.config.js does not have trailingSlash: true');
      return false;
    }
  } catch (e) {
    error('Could not read next.config.js: ' + e.message);
    return false;
  }
}

// Check sitemap route file for trailing slash in URLs
function checkSitemapRoute() {
  try {
    const sitemapPath = path.join(process.cwd(), 'app', 'sitemap.xml', 'route.ts');
    const content = fs.readFileSync(sitemapPath, 'utf8');
    
    // The sitemap generates URLs like: const loc = `${BASE}/${locale}${localized}`
    // where localized is the result of localizePath which normalizes paths by removing trailing slashes.
    // With trailingSlash: true in next.config.js, Next.js should add trailing slashes during routing,
    // but for optimal SEO, URLs should explicitly include trailing slashes in the sitemap XML.
    
    // Look for URL generation patterns - checking if the file contains loc assignment
    const hasLocAssignment = content.includes('const loc = ') || content.includes('let loc = ');
    // Check if trailing slashes are explicitly added (e.g., ${localized}/ or + '/')
    const hasTrailingSlash = /\$\{localized\}\//.test(content) || content.includes("+ '/'") || content.includes('+ "/"');
    
    if (hasLocAssignment) {
      if (hasTrailingSlash) {
        success('Sitemap route explicitly adds trailing slashes to URLs');
      } else {
        warn('Sitemap route does not explicitly add trailing slashes. Next.js may add them via trailingSlash config, but explicit trailing slashes are recommended for SEO.');
      }
    } else {
      success('Sitemap route structure checked');
    }
    
    return true;
  } catch (e) {
    error('Could not read sitemap route: ' + e.message);
    return false;
  }
}

function checkCrawlerConfig() {
  const read = (f) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');
  const config = read('next.config.js');
  if (/htmlLimitedBots:\s*\/\.\*\//.test(config)) success('Metadata rendered in <head> for every client (htmlLimitedBots)');
  else error('next.config.js: htmlLimitedBots must be /.*/ so crawlers get metadata in <head>');
  const assetsBlock = config.match(/source:\s*"\/assets\/:path\*"[\s\S]*?\]\s*,\s*\}/);
  if (assetsBlock && /noindex/.test(assetsBlock[0])) error('next.config.js: /assets must stay indexable (logo, share images)');
  else success('/assets served without noindex');
  const robots = read('public/robots.txt');
  if (/^Disallow:\s*\/_next\//m.test(robots)) error('robots.txt blocks /_next/ (Googlebot needs CSS and JS to render)');
  else success('robots.txt does not block /_next/');
  if (!/User-agent:\s*ClaudeBot/.test(robots) || !/User-agent:\s*PerplexityBot/.test(robots)) error('robots.txt: AI crawler group missing');
  else success('robots.txt names the AI crawlers');
  const sitemap = read('app/sitemap.xml/route.ts');
  if (/<changefreq>|<priority>/.test(sitemap)) error('sitemap: remove changefreq/priority');
  else success('sitemap: loc + lastmod + alternates only');
  const key = fs.readdirSync(path.join(process.cwd(), 'public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  const lib = read('src/lib/indexnow.ts');
  if (!key || !lib.includes(key.replace('.txt', ''))) error('IndexNow: public/<key>.txt and src/lib/indexnow.ts must use the same key');
  else if (!read('.gitignore').includes(`!public/${key}`)) error(`.gitignore: public/${key} is ignored (*.txt), the key file would not be deployed`);
  else success('IndexNow key file present, tracked and used');
}

// Main
console.log('\n🔍 SEO Configuration Validation\n');
console.log('='.repeat(50));

checkTrailingSlashConfig();
checkSitemapRoute();
checkCrawlerConfig();

console.log('='.repeat(50));
console.log(`\nSummary: ${errors} errors, ${warnings} warnings\n`);

process.exit(errors > 0 ? 1 : 0);
