import assert from "node:assert/strict";
import test from "node:test";

import { attributionSchema, flattenAttribution } from "./attribution-schema.ts";

test("invalid attribution is dropped instead of failing the lead", () => {
  assert.equal(attributionSchema.parse({ pages: ["not-a-path"] }), undefined);
  assert.equal(attributionSchema.parse("nope"), undefined);
});

test("flattenAttribution produces readable fields without markup", () => {
  const parsed = attributionSchema.parse({
    landingPage: "/fr/",
    referrer: "https://www.google.com",
    utm: { source: "google", medium: "cpc<x>" },
    gclid: "abc",
    pages: ["/fr/", "/fr/contact/"],
  });
  assert.deepEqual(flattenAttribution(parsed), {
    landingPage: "/fr/",
    firstReferrer: "https://www.google.com",
    utm: "source=google medium=cpcx",
    gclid: "abc",
    pagesViewed: "/fr/ > /fr/contact/",
  });
  assert.deepEqual(flattenAttribution(undefined), {});
});
