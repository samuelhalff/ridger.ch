// Microsoft Entra ID app-only token acquisition, zero dependencies.
//
// Certificate auth (preferred) — sign a client assertion JWT with the app's private key:
//   AZURE_TENANT_ID, AZURE_CLIENT_ID,
//   AZURE_CLIENT_CERTIFICATE_PATH  (PEM containing the private key, and ideally the cert)
//   AZURE_CLIENT_CERTIFICATE_PASSWORD  (optional, if the key is encrypted)
//   AZURE_CLIENT_CERTIFICATE_THUMBPRINT (optional; derived from the PEM cert when absent)
//
// Secret auth (fallback):
//   AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
//   or AZURE_CREDENTIALS='{"tenantId":"...","clientId":"...","clientSecret":"..."}'

import { createHash, createSign, randomUUID, createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function envCredentials() {
  const direct = {
    tenantId: (process.env.AZURE_TENANT_ID || "").trim(),
    clientId: (process.env.AZURE_CLIENT_ID || "").trim(),
    clientSecret: (process.env.AZURE_CLIENT_SECRET || "").trim(),
  };
  if (direct.tenantId && direct.clientId) return direct;

  const json = (process.env.AZURE_CREDENTIALS || "").trim();
  if (json && json !== "undefined" && json !== "null") {
    try {
      const parsed = JSON.parse(json);
      if (parsed.tenantId && parsed.clientId) {
        return {
          tenantId: parsed.tenantId,
          clientId: parsed.clientId,
          clientSecret: parsed.clientSecret || "",
        };
      }
    } catch {
      // ignore, reported below
    }
  }
  return direct;
}

function certThumbprint(pem) {
  const explicit = (process.env.AZURE_CLIENT_CERTIFICATE_THUMBPRINT || "").replace(/[:\s]/g, "");
  if (explicit) return Buffer.from(explicit, "hex");

  const match = pem.match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/);
  if (!match) {
    throw new Error(
      "Certificate PEM has no CERTIFICATE block and AZURE_CLIENT_CERTIFICATE_THUMBPRINT is not set."
    );
  }
  const der = Buffer.from(match[1].replace(/\s+/g, ""), "base64");
  return createHash("sha1").update(der).digest();
}

function clientAssertion({ tenantId, clientId }) {
  const path = (process.env.AZURE_CLIENT_CERTIFICATE_PATH || "").trim();
  if (!path) return null;

  const pem = readFileSync(path, "utf8");
  const passphrase = process.env.AZURE_CLIENT_CERTIFICATE_PASSWORD || undefined;
  const key = createPrivateKey(passphrase ? { key: pem, passphrase } : pem);

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", x5t: b64url(certThumbprint(pem)) };
  const payload = {
    aud: `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    iss: clientId,
    sub: clientId,
    jti: randomUUID(),
    nbf: now - 60,
    exp: now + 600,
  };
  const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256").update(signingInput).sign(key);
  return `${signingInput}.${b64url(signature)}`;
}

/** Acquire an app-only access token for the given scope. */
export async function getToken(scope) {
  const { tenantId, clientId, clientSecret } = envCredentials();
  if (!tenantId || !clientId) {
    throw new Error(
      "Missing AZURE_TENANT_ID / AZURE_CLIENT_ID (or AZURE_CREDENTIALS). See scripts/README.md."
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "client_credentials",
    scope,
  });

  const assertion = clientAssertion({ tenantId, clientId });
  if (assertion) {
    body.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    body.set("client_assertion", assertion);
  } else if (clientSecret) {
    body.set("client_secret", clientSecret);
  } else {
    throw new Error(
      "No credential: set AZURE_CLIENT_CERTIFICATE_PATH (certificate) or AZURE_CLIENT_SECRET."
    );
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(
      `Token request failed (${res.status}): ${json.error_description || JSON.stringify(json)}`
    );
  }
  return json.access_token;
}

export const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
export const FOUNDRY_SCOPE = "https://ai.azure.com/.default";
