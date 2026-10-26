import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import {
  EEA_UK_REGIONS,
  buildConsentBootstrap,
  pickStoredConsent,
  normaliseStoredConsent,
  gaClientIdFromCookies,
} from "./consent-mode.ts";

type Run = { calls: unknown[][]; scripts: { src: string; nonce?: string }[] };

function runBootstrap(opts: {
  stored?: string;
  cookie?: string;
  nonce?: string;
  cookiesEnabled?: boolean;
}): Run {
  const dataLayer: unknown[] = [];
  const scripts: { src: string; nonce?: string }[] = [];
  const head = {
    appendChild: (el: { src: string; nonce?: string }) => scripts.push(el),
  };
  const sandbox = {
    window: {} as Record<string, unknown>,
    document: {
      cookie: opts.cookie || "",
      head,
      documentElement: head,
      currentScript: opts.nonce ? { nonce: opts.nonce } : null,
      createElement: () => ({ src: "", async: false }),
    },
    navigator: { cookieEnabled: opts.cookiesEnabled !== false },
    Date,
    encodeURIComponent,
  };
  sandbox.window.dataLayer = dataLayer;
  sandbox.window.localStorage = {
    getItem: () => (opts.stored === undefined ? null : opts.stored),
  };
  vm.runInNewContext(buildConsentBootstrap("G-TEST1234"), sandbox);
  // Normalise objects created inside the vm realm.
  return {
    calls: JSON.parse(
      JSON.stringify(dataLayer.map((entry) => Array.from(entry as ArrayLike<unknown>))),
    ),
    scripts,
  };
}

test("bootstrap sets regional defaults before js/config", () => {
  const { calls, scripts } = runBootstrap({});
  const commands = calls.map((c) => `${c[0]}:${c[1]}`);
  assert.deepEqual(commands.slice(0, 3), [
    "consent:default",
    "consent:default",
    "consent:default",
  ]);
  const [eea, ch, rest] = calls.slice(0, 3).map((c) => c[2] as Record<string, unknown>);
  assert.deepEqual(eea.region, [...EEA_UK_REGIONS]);
  assert.equal(eea.analytics_storage, "denied");
  assert.equal(eea.ad_storage, "denied");
  assert.equal(eea.ad_user_data, "denied");
  assert.equal(eea.ad_personalization, "denied");
  assert.deepEqual(ch.region, ["CH"]);
  assert.equal(ch.analytics_storage, "granted");
  assert.equal(ch.ad_storage, "denied");
  assert.equal(ch.ad_user_data, "denied");
  assert.equal(ch.ad_personalization, "denied");
  assert.equal(rest.region, undefined);
  assert.equal(rest.analytics_storage, "granted");
  assert.equal(rest.ad_user_data, "granted");
  // undecided: no update
  assert.equal(commands.includes("consent:update"), false);
  const jsIndex = calls.findIndex((c) => c[0] === "js");
  const configIndex = commands.indexOf("config:G-TEST1234");
  assert.ok(jsIndex > 2 && configIndex > jsIndex);
  assert.equal(scripts.length, 1);
  assert.equal(
    scripts[0].src,
    "https://www.googletagmanager.com/gtag/js?id=G-TEST1234",
  );
});

test("bootstrap applies a stored acceptance as an update without region", () => {
  const { calls } = runBootstrap({ cookie: "cookieConsent=accepted" });
  const update = calls.find((c) => c[0] === "consent" && c[1] === "update");
  assert.ok(update);
  const state = update[2] as Record<string, unknown>;
  assert.equal(state.region, undefined);
  assert.equal(state.analytics_storage, "granted");
  assert.equal(state.ad_storage, "granted");
  assert.equal(state.ad_user_data, "granted");
  assert.equal(state.ad_personalization, "granted");
  const updateIndex = calls.indexOf(update);
  const configIndex = calls.findIndex((c) => c[0] === "config");
  assert.ok(updateIndex < configIndex);
});

for (const legacy of ["minimal", "declined"]) {
  test(`bootstrap treats legacy "${legacy}" as refused (all denied)`, () => {
    const { calls } = runBootstrap({ cookie: `cookieConsent=${legacy}` });
    const update = calls.find((c) => c[0] === "consent" && c[1] === "update");
    assert.ok(update);
    const state = update[2] as Record<string, unknown>;
    for (const key of ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"]) {
      assert.equal(state[key], "denied");
    }
  });
}

test("bootstrap reads the consent cookie and forwards the nonce", () => {
  const { calls, scripts } = runBootstrap({
    cookie: "foo=1; cookieConsent=accepted",
    nonce: "abc123",
  });
  const update = calls.find((c) => c[0] === "consent" && c[1] === "update");
  assert.equal((update?.[2] as Record<string, unknown>).analytics_storage, "granted");
  assert.equal(scripts[0].nonce, "abc123");
});

test("bootstrap rejects unsafe measurement ids", () => {
  assert.throws(() => buildConsentBootstrap("G-1');alert(1);//"));
});

test("normaliseStoredConsent maps old and new values", () => {
  assert.equal(normaliseStoredConsent("accepted"), "accepted");
  assert.equal(normaliseStoredConsent("minimal"), "refused");
  assert.equal(normaliseStoredConsent("declined"), "refused");
  assert.equal(normaliseStoredConsent("other"), null);
  assert.equal(normaliseStoredConsent(null), null);
});

test("GA client id is read unless the visitor refused", () => {
  const cookies = "foo=1; _ga=GA1.1.1194917214.1689149133; _ga_ABC=GS1.1.x";
  assert.equal(gaClientIdFromCookies(cookies, "accepted"), "1194917214.1689149133");
  // Undecided: present only where the regional default granted storage.
  assert.equal(gaClientIdFromCookies(cookies, null), "1194917214.1689149133");
  assert.equal(gaClientIdFromCookies(cookies, "refused"), undefined);
  assert.equal(gaClientIdFromCookies("foo=1", null), undefined);
  assert.equal(gaClientIdFromCookies("_ga=GA1.1.abc.def", null), undefined);
  assert.equal(gaClientIdFromCookies("_ga_ABC=GS1.1.1.2", null), undefined);
});

test("cookie is authoritative; localStorage only counts without cookies", () => {
  // Invalid local value never hides a valid cookie (e.g. a refusal).
  assert.equal(pickStoredConsent("garbage", "minimal", true), "minimal");
  assert.equal(pickStoredConsent("accepted", "declined", true), "declined");
  // Cookie expired (12 months) while localStorage remains: undecided again.
  assert.equal(pickStoredConsent("accepted", null, true), null);
  // Cookies blocked: the localStorage entry is the only store.
  assert.equal(pickStoredConsent("declined", null, false), "declined");
  assert.equal(pickStoredConsent("garbage", null, false), null);
});

test("bootstrap follows the same storage rule", () => {
  const refused = runBootstrap({ stored: "garbage", cookie: "cookieConsent=minimal" });
  const update = refused.calls.find((c) => c[0] === "consent" && c[1] === "update");
  assert.equal((update?.[2] as Record<string, unknown>).analytics_storage, "denied");
  const expired = runBootstrap({ stored: "accepted" });
  assert.equal(expired.calls.some((c) => c[0] === "consent" && c[1] === "update"), false);
  const noCookies = runBootstrap({ stored: "accepted", cookiesEnabled: false });
  const local = noCookies.calls.find((c) => c[0] === "consent" && c[1] === "update");
  assert.equal((local?.[2] as Record<string, unknown>).analytics_storage, "granted");
});
