#!/usr/bin/env node
/**
 * Checks the rendered HTML as a crawler receives it (Googlebot user agent):
 * <title>, meta description, canonical and hreflang (with x-default) inside
 * <head>; every JSON-LD block parses; robots.txt does not block /_next/;
 * sitemap without priority/changefreq and x-default identical to the HTML;
 * FAQPage JSON-LD on the FAQ pages; og:image in <head>.
 *
 *   node scripts/check-rendered-seo.mjs [https://ridger.ch]
 *
 * Exit code 1 on any failure.
 */
const BASE = (process.argv[2] || "https://ridger.ch").replace(/\/+$/, "");
const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const PAGES = ["/fr/", "/en/", "/fr/services/reporting-consolide/", "/en/services/consolidated-reporting/", "/fr/approche/", "/fr/contact/", "/fr/family-office/geneva/"];
// Pages that must carry a visible FAQ and its FAQPage JSON-LD.
const FAQ_PAGES = new Set(["/fr/", "/fr/services/reporting-consolide/", "/en/services/consolidated-reporting/", "/fr/approche/", "/fr/contact/", "/fr/family-office/geneva/"]);

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`FAIL ${msg}`);
};

async function get(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { "User-Agent": UA }, redirect: "manual", signal: AbortSignal.timeout(20000) });
  return { status: res.status, text: await res.text() };
}

async function main() {
  // One article from the sitemap, so the article template is covered too.
  const sitemap = await get("/sitemap.xml");
  if (sitemap.status !== 200) fail(`sitemap.xml: HTTP ${sitemap.status}`);
  if (/<priority>|<changefreq>/.test(sitemap.text)) fail("sitemap.xml still has priority/changefreq");
  const article = sitemap.text.match(/<loc>https?:\/\/[^<]*?(\/fr\/ressources\/articles\/[^<]+)<\/loc>/)?.[1];
  const pages = article ? [...PAGES, article] : PAGES;

  for (const path of pages) {
    const { status, text } = await get(path);
    if (status !== 200) {
      fail(`${path}: HTTP ${status}`);
      continue;
    }
    const end = text.indexOf("</head>");
    const head = end > 0 ? text.slice(0, end) : "";
    if (!head) fail(`${path}: no </head>`);
    if (!/<title>[^<]{5,}<\/title>/.test(head)) fail(`${path}: <title> not in <head>`);
    if (!/<meta name="description" content="[^"]{20,}"/.test(head)) fail(`${path}: meta description not in <head>`);
    const canonical = head.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!canonical) fail(`${path}: canonical not in <head>`);
    else if (!canonical.endsWith(path)) fail(`${path}: canonical is ${canonical}`);
    for (const lang of ["fr-CH", "x-default"]) {
      if (!new RegExp(`<link rel="alternate" hrefLang="${lang}"`, "i").test(head)) fail(`${path}: hreflang ${lang} not in <head>`);
    }
    const xDefault = head.match(/hrefLang="x-default" href="([^"]+)"/i)?.[1];
    if (xDefault && !/\/fr\//.test(xDefault)) fail(`${path}: x-default is not the French URL (${xDefault})`);
    let faqLd = false;
    for (const m of text.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      try {
        if (/"FAQPage"/.test(JSON.stringify(JSON.parse(m[1])))) faqLd = true;
      } catch {
        fail(`${path}: JSON-LD does not parse`);
      }
    }
    if (FAQ_PAGES.has(path) && !faqLd) fail(`${path}: no FAQPage JSON-LD`);
    const og = head.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
    if (!og) fail(`${path}: og:image not in <head>`);
    if (failures === 0) console.log(`ok   ${path}`);
  }

  // x-default of the home page: same URL in the HTML and in the sitemap.
  const home = await get("/fr/");
  const htmlX = home.text.match(/hrefLang="x-default" href="([^"]+)"/i)?.[1];
  const homeEntry = sitemap.text.match(/<url>\s*<loc>[^<]*\/fr\/<\/loc>[\s\S]*?<\/url>/)?.[0] ?? "";
  const mapX = homeEntry.match(/hreflang="x-default" href="([^"]+)"/)?.[1];
  if (htmlX && mapX && htmlX !== mapX) fail(`x-default differs: HTML ${htmlX}, sitemap ${mapX}`);

  const robots = await get("/robots.txt");
  if (/^Disallow:\s*\/_next\//m.test(robots.text)) fail("robots.txt blocks /_next/");
  if (!/User-agent:\s*ClaudeBot/i.test(robots.text)) fail("robots.txt has no AI crawler group");

  console.log(failures ? `${failures} failure(s)` : "rendered SEO checks passed");
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
