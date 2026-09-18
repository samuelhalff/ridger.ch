#!/usr/bin/env node
/**
 * SEO Validation Script (Non-blocking)
 * Validates sitemap format and URL consistency
 * Always exits with code 0 to not block CI
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

// Main
console.log('\n🔍 SEO Configuration Validation\n');
console.log('='.repeat(50));

checkTrailingSlashConfig();
checkSitemapRoute();

console.log('='.repeat(50));
console.log(`\nSummary: ${errors} errors, ${warnings} warnings\n`);

// Always exit 0 to not block CI
process.exit(0);
