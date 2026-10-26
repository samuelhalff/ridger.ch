import assert from "node:assert/strict";
import test from "node:test";

import {
  ATTRIBUTION_MAX_PAGES,
  addAttributionPage,
  cleanPathname,
  createAttribution,
  parseStoredAttribution,
  referrerOrigin,
} from "./attribution.ts";

test("createAttribution keeps pathname, allowlisted params and referrer origin only", () => {
  const a = createAttribution(
    "https://ridger.ch/fr/services/?utm_source=google&utm_medium=cpc&utm_campaign=<b>brand</b>&gclid=abc.123&email=x@y.ch#top",
    "https://www.google.com/search?q=fiduciaire+geneve",
  );
  assert.equal(a.landingPage, "/fr/services/");
  assert.equal(a.referrer, "https://www.google.com");
  assert.equal(a.utm.source, "google");
  assert.equal(a.utm.medium, "cpc");
  assert.equal(a.utm.campaign, "bbrand/b");
  assert.equal(a.gclid, "abc.123");
  assert.deepEqual(a.pages, ["/fr/services/"]);
  assert.equal(JSON.stringify(a).includes("email"), false);
  assert.equal(JSON.stringify(a).includes("q="), false);
});

test("same-site and non-http referrers are dropped", () => {
  assert.equal(referrerOrigin("https://www.ridger.ch/fr/", "ridger.ch"), "");
  assert.equal(referrerOrigin("android-app://com.google", "ridger.ch"), "");
  assert.equal(referrerOrigin("not a url", "ridger.ch"), "");
  assert.equal(referrerOrigin("https://linkedin.com/feed/x", "ridger.ch"), "https://linkedin.com");
});

test("page trail is deduplicated, query-free and capped", () => {
  let a = createAttribution("https://ridger.ch/fr/", "");
  a = addAttributionPage(a, "/fr/");
  a = addAttributionPage(a, "/fr/contact/?x=1#y");
  a = addAttributionPage(a, "/fr/contact/");
  assert.deepEqual(a.pages, ["/fr/", "/fr/contact/"]);
  for (let i = 0; i < 40; i += 1) a = addAttributionPage(a, `/fr/p${i}`);
  assert.equal(a.pages.length, ATTRIBUTION_MAX_PAGES);
});

test("cleanPathname rejects non-paths and strips query/hash", () => {
  assert.equal(cleanPathname("https://evil.example/x"), "");
  assert.equal(cleanPathname("/a?b=c#d"), "/a");
  assert.equal(cleanPathname("/" + "x".repeat(500)).length, 200);
});

test("parseStoredAttribution re-validates stored data", () => {
  const parsed = parseStoredAttribution(
    JSON.stringify({
      landingPage: "/fr/?utm_source=x",
      referrer: "https://google.com",
      utm: { source: "a\nb" },
      gclid: "g",
      pages: ["/a", "/a", "bad", "/b?c"],
    }),
  );
  assert.ok(parsed);
  assert.equal(parsed.landingPage, "/fr/");
  assert.equal(parsed.utm.source, "ab");
  assert.deepEqual(parsed.pages, ["/a", "/b"]);
  assert.equal(parseStoredAttribution("{broken"), null);
  assert.equal(parseStoredAttribution(null), null);
});
