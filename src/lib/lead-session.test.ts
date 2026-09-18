import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSyntheticLeadSession,
  isSyntheticLeadId,
  isUsableLeadTokenSecret,
  signOdooLeadToken,
  signSyntheticLeadToken,
  verifyOdooLeadToken,
  verifySyntheticLeadToken,
} from "./lead-session.ts";

const SECRET = "a".repeat(48); // >= 32 bytes
const OTHER_SECRET = "b".repeat(48);

test("isSyntheticLeadId matches synthetic/odoo prefixes only (routing, not auth)", () => {
  assert.equal(isSyntheticLeadId("synthetic-deadbeef"), true);
  assert.equal(isSyntheticLeadId("odoo-42"), true);
  assert.equal(isSyntheticLeadId("123"), false);
  assert.equal(isSyntheticLeadId(undefined), false);
});

test("isUsableLeadTokenSecret enforces a 32-byte minimum", () => {
  assert.equal(isUsableLeadTokenSecret("short"), false);
  assert.equal(isUsableLeadTokenSecret("a".repeat(31)), false);
  assert.equal(isUsableLeadTokenSecret("a".repeat(32)), true);
});

test("a freshly built synthetic session verifies with the same secret", () => {
  const { leadId, leadToken } = buildSyntheticLeadSession(SECRET);
  assert.ok(leadId.startsWith("synthetic-"));
  assert.equal(verifySyntheticLeadToken(SECRET, leadId, leadToken), true);
});

test("synthetic token forgery is rejected (client-chosen leadId, no signature)", () => {
  // The Finding-1 exploit: attacker sends leadId "synthetic-1" + any token.
  assert.equal(verifySyntheticLeadToken(SECRET, "synthetic-1", "deadbeef"), false);
  assert.equal(verifySyntheticLeadToken(SECRET, "odoo-1", "0".repeat(64)), false);
  // A valid token for one leadId does not authorize a different leadId.
  const { leadId, leadToken } = buildSyntheticLeadSession(SECRET);
  assert.equal(verifySyntheticLeadToken(SECRET, leadId + "x", leadToken), false);
});

test("synthetic token from a different secret is rejected", () => {
  const { leadId, leadToken } = buildSyntheticLeadSession(OTHER_SECRET);
  assert.equal(verifySyntheticLeadToken(SECRET, leadId, leadToken), false);
});

test("verification fails closed when the secret is too weak", () => {
  const weak = "short";
  const token = signSyntheticLeadToken(weak, "synthetic-x");
  assert.equal(verifySyntheticLeadToken(weak, "synthetic-x", token), false);
});

test("odoo lead token binds leadId AND odooLeadId", () => {
  const leadId = "synthetic-abc";
  const token = signOdooLeadToken(SECRET, leadId, 42);
  assert.equal(verifyOdooLeadToken(SECRET, leadId, 42, token), true);
  // wrong odooLeadId (the note-injection exploit: iterate odooLeadId)
  assert.equal(verifyOdooLeadToken(SECRET, leadId, 43, token), false);
  // wrong leadId
  assert.equal(verifyOdooLeadToken(SECRET, "synthetic-def", 42, token), false);
  // missing token
  assert.equal(verifyOdooLeadToken(SECRET, leadId, 42, undefined), false);
});

test("odoo token rejects non-positive / non-safe integer ids", () => {
  const leadId = "synthetic-abc";
  assert.equal(verifyOdooLeadToken(SECRET, leadId, 0, signOdooLeadToken(SECRET, leadId, 0)), false);
  assert.equal(verifyOdooLeadToken(SECRET, leadId, -1, signOdooLeadToken(SECRET, leadId, -1)), false);
});

test("synthetic and odoo tokens are not interchangeable (domain separation)", () => {
  const leadId = "synthetic-abc";
  const odooTok = signOdooLeadToken(SECRET, leadId, 7);
  assert.equal(verifySyntheticLeadToken(SECRET, leadId, odooTok), false);
});
