import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Agent lead sessions.
 *
 * Two kinds of session token, both stateless where no server-side store
 * exists:
 *   - leadToken: authorizes chat access for a "synthetic" session (used when
 *     SharePoint is unavailable and for internal testers). HMAC over the
 *     leadId, so the client cannot forge a session by choosing a leadId that
 *     starts with "synthetic-"/"odoo-". SharePoint-backed sessions keep their
 *     existing random token verified against a stored hash — untouched here.
 *   - odooLeadToken: authorizes posting a chatter note to a specific Odoo
 *     lead. HMAC over (leadId, odooLeadId) so a client cannot post notes to
 *     arbitrary lead IDs it was never issued.
 *
 * Both HMACs are domain-separated and versioned so one can never be replayed
 * as the other.
 */

const MIN_SECRET_BYTES = 32;
const HMAC_HEX_LEN = 64; // sha256 hex

export const buildSyntheticLeadId = () =>
  `synthetic-${randomBytes(16).toString("hex")}`;

// Recognized only for ROUTING (deciding which verification path to take).
// The prefix is never itself treated as authorization — a signature check
// always follows. "odoo-" is legacy; new synthetic ids use "synthetic-".
export const isSyntheticLeadId = (leadId?: string) =>
  Boolean(leadId && /^(synthetic|odoo)-/.test(leadId));

export const isUsableLeadTokenSecret = (secret: string) =>
  Buffer.byteLength(secret, "utf8") >= MIN_SECRET_BYTES;

const isPositiveSafeInt = (n: number) =>
  Number.isSafeInteger(n) && n > 0;

const hmacHex = (secret: string, message: string) =>
  createHmac("sha256", secret).update(message, "utf8").digest("hex");

const safeEqualHex = (a: string, b: string) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== HMAC_HEX_LEN || b.length !== HMAC_HEX_LEN) return false;
  if (!/^[0-9a-f]{64}$/.test(a) || !/^[0-9a-f]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
};

// Versioned, purpose-separated canonical messages (JSON arrays — no delimiter
// injection between fields).
const syntheticMessage = (leadId: string) =>
  JSON.stringify(["ridger-agent", 1, "synthetic-chat", leadId]);

const odooMessage = (leadId: string, odooLeadId: number) =>
  JSON.stringify(["ridger-agent", 1, "odoo-note", leadId, String(odooLeadId)]);

export const signSyntheticLeadToken = (secret: string, leadId: string) =>
  hmacHex(secret, syntheticMessage(leadId));

export const verifySyntheticLeadToken = (
  secret: string,
  leadId: string,
  providedToken?: string,
) => {
  if (!isUsableLeadTokenSecret(secret) || !leadId || !providedToken) return false;
  return safeEqualHex(providedToken, signSyntheticLeadToken(secret, leadId));
};

export const signOdooLeadToken = (
  secret: string,
  leadId: string,
  odooLeadId: number,
) => hmacHex(secret, odooMessage(leadId, odooLeadId));

export const verifyOdooLeadToken = (
  secret: string,
  leadId: string,
  odooLeadId: number,
  providedToken?: string,
) => {
  if (!isUsableLeadTokenSecret(secret) || !leadId || !providedToken) return false;
  if (!isPositiveSafeInt(odooLeadId)) return false;
  return safeEqualHex(providedToken, signOdooLeadToken(secret, leadId, odooLeadId));
};

/**
 * Build a signed synthetic session. Needs the secret; callers that lack a
 * usable secret must reject the request before reaching here.
 */
export const buildSyntheticLeadSession = (secret: string) => {
  const leadId = buildSyntheticLeadId();
  return { leadId, leadToken: signSyntheticLeadToken(secret, leadId) };
};
