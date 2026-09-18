#!/usr/bin/env node
/**
 * Ping search engines with updated sitemap URL(s).
 * By default pings /sitemap.xml at SITE_URL (env or fallback).
 * Usage: node scripts/ping-sitemaps.js [--url https://ridger.ch] [--path /sitemap.xml]
 */
const https = require('https');

const args = process.argv.slice(2);
function getArg(name, def) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return def;
}

const site = getArg('--url', process.env.SITE_URL || 'https://ridger.ch').replace(/\/$/, '');
const sitemapPath = getArg('--path', '/sitemap.xml');
const sitemapUrl = site + sitemapPath;

const endpoints = [
  `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
  `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
];

function ping(url) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({ url, status: res.statusCode, body: Buffer.concat(chunks).toString().slice(0,200) });
        });
      })
      .on('error', (err) => resolve({ url, error: err.message }));
  });
}

(async function main() {
  console.log('Pinging sitemap URL:', sitemapUrl);
  const results = await Promise.all(endpoints.map(ping));
  for (const r of results) {
    if (r.error) console.log('FAIL ', r.url, '-', r.error);
    else console.log('OK   ', r.url, 'status', r.status);
  }
  console.log('Done.');
})();
