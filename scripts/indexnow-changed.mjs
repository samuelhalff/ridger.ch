#!/usr/bin/env node
/**
 * Sends to IndexNow (api.indexnow.org, which shares with Bing, Yandex and the
 * other participants) only the URLs whose <lastmod> changed or that are new,
 * by comparing the sitemap saved before the deploy with the live one.
 *
 *   node scripts/indexnow-changed.mjs --before old-sitemap.xml [--after https://ridger.ch/sitemap.xml] [--dry-run]
 *
 * Exit code 1 when IndexNow answers with an error (4xx/5xx).
 */
import fs from "node:fs";

const HOST = "ridger.ch";
const KEY = "0b2df53c19495486d5f3e5b686bbc8ea";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const beforeFile = arg("--before");
const afterUrl = arg("--after") || `https://${HOST}/sitemap.xml`;
const dryRun = args.includes("--dry-run");

/** Map loc -> lastmod ("" when absent). */
export function parseSitemap(xml) {
  const out = new Map();
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    if (!loc) continue;
    out.set(loc, m[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1] ?? "");
  }
  return out;
}

export function changedUrls(before, after) {
  return [...after].filter(([loc, lastmod]) => before.get(loc) !== lastmod).map(([loc]) => loc);
}

async function main() {
  const beforeXml = beforeFile && fs.existsSync(beforeFile) ? fs.readFileSync(beforeFile, "utf8") : "";
  const res = await fetch(afterUrl, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`sitemap ${afterUrl}: HTTP ${res.status}`);
  const after = parseSitemap(await res.text());
  const before = parseSitemap(beforeXml);
  if (!before.size) {
    console.log("[indexnow] no previous sitemap: nothing compared, nothing sent");
    return;
  }
  const urls = changedUrls(before, after).filter((u) => new URL(u).hostname === HOST).slice(0, 10000);
  console.log(`[indexnow] ${urls.length} changed URL(s) out of ${after.size}`);
  urls.slice(0, 20).forEach((u) => console.log(`  ${u}`));
  if (!urls.length || dryRun) return;
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls }),
    signal: AbortSignal.timeout(20000),
  });
  console.log(`[indexnow] api.indexnow.org answered ${r.status}`);
  if (r.status !== 200 && r.status !== 202) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(`[indexnow] ${e.message}`);
    process.exit(1);
  });
}
