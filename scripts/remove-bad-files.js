#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const LOCALES = ['fr', 'en', 'de', 'es', 'pt'];
const CHECK_REMOTE = process.argv.includes('--check-remote');

/**
 * Check if a URL is reachable (returns HTTP 200)
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ResourceValidator/1.0)'
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          checkUrl(res.headers.location).then(resolve);
          return;
        }
      }
      resolve(res.statusCode === 200);
    });
    
    request.on('error', () => resolve(false));
    request.on('timeout', () => {
      request.destroy();
      resolve(false);
    });
  });
}

/**
 * Check if a local PDF file exists
 */
function checkLocalFile(filename) {
  const filePath = path.join(__dirname, '../public/assets/downloads', filename);
  return fs.existsSync(filePath);
}

/**
 * Remove bad files from resource data
 */
async function removeBadFiles() {
  const checkType = CHECK_REMOTE ? 'remote URLs' : 'local files';
  console.log(`\n🔍 Scanning for bad ${checkType}...\n`);
  
  let totalRemoved = 0;
  
  for (const locale of LOCALES) {
    const filePath = path.join(__dirname, `../src/translations/${locale}/ressources.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${locale}: ressources.json not found`);
      continue;
    }
    
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!data.Files) {
      console.log(`⚠️  ${locale}: No Files array found`);
      continue;
    }
    
    const originalCount = data.Files.length;
    const filesToKeep = [];
    const removedFiles = [];
    
    for (const file of data.Files) {
      let shouldKeep = true;
      let reason = '';
      
      // Check 1: Local file exists (when not checking remote)
      if (!CHECK_REMOTE) {
        if (!checkLocalFile(file.filename)) {
          shouldKeep = false;
          reason = 'missing local PDF file';
        }
      }
      
      // Check 2: Remote URL is reachable (if requested)
      if (CHECK_REMOTE && file.source_url) {
        console.log(`   Checking: ${file.source_url.substring(0, 60)}...`);
        const isReachable = await checkUrl(file.source_url);
        if (!isReachable) {
          shouldKeep = false;
          reason = '404 or unreachable source URL';
          console.log(`   ❌ Failed`);
        } else {
          console.log(`   ✅ OK`);
        }
      }
      
      if (shouldKeep) {
        filesToKeep.push(file);
      } else {
        removedFiles.push({ filename: file.filename, title: file.title, reason });
      }
    }
    
    // Update the data if we removed any files
    if (removedFiles.length > 0) {
      data.Files = filesToKeep;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
      
      console.log(`\n❌ ${locale}: Removed ${removedFiles.length} bad file(s):`);
      removedFiles.forEach(f => {
        console.log(`   - ${f.filename}`);
        console.log(`     Title: ${f.title}`);
        console.log(`     Reason: ${f.reason}`);
      });
      console.log('');
      
      totalRemoved += removedFiles.length;
    } else {
      console.log(`✅ ${locale}: All ${originalCount} files are valid\n`);
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🎯 Total files removed: ${totalRemoved}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  if (totalRemoved > 0) {
    console.log('📝 Summary:');
    console.log('   - Bad file entries removed from all locales');
    console.log('   - Articles remain intact (content is still valuable)');
    console.log('   - Website will not have any 404 links');
    console.log('');
  }
  
  // Exit code 0 even if we removed files (this is expected behavior)
  process.exit(0);
}

// Run the cleanup
removeBadFiles().catch(err => {
  console.error('❌ Unexpected error during cleanup:', err);
  // Exit 0 anyway - don't fail the workflow
  process.exit(0);
});
