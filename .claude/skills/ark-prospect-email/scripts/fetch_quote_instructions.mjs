#!/usr/bin/env node
// Pull the ark-quote-agent instructions out of Azure AI Foundry into
// references/quote-instructions.md.
//
// Env:
//   AZURE_AGENT_ENDPOINT   https://<resource>.services.ai.azure.com/api/projects/<project>
//   AZURE_AGENT_CHAT_NAME  agent name, optionally pinned as name:version (default ark-quote-agent)
//   AZURE_AGENT_RESPONSES_API_VERSION  (default 2025-11-15-preview)
//   plus AZURE_TENANT_ID / AZURE_CLIENT_ID and a certificate or secret — see README.md
//
// Usage: node fetch_quote_instructions.mjs [--print]

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getToken, FOUNDRY_SCOPE } from "./msauth.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = join(HERE, "..", "references", "quote-instructions.md");

const endpoint = (process.env.AZURE_AGENT_ENDPOINT || "").trim().replace(/\/+$/, "");
const agentRef = (process.env.AZURE_AGENT_CHAT_NAME || "ark-quote-agent").trim();
const apiVersion = (process.env.AZURE_AGENT_RESPONSES_API_VERSION || "2025-11-15-preview").trim();

if (!endpoint) {
  console.error("AZURE_AGENT_ENDPOINT is not set.");
  process.exit(1);
}

const [name, pinnedVersion] = agentRef.split(":", 2);

async function get(token, path) {
  const url = `${endpoint}${path}${path.includes("?") ? "&" : "?"}api-version=${encodeURIComponent(apiVersion)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, text, url };
  try {
    return { ok: true, json: JSON.parse(text), url };
  } catch {
    return { ok: false, status: res.status, text, url };
  }
}

// Walk an arbitrary payload looking for the longest `instructions` string.
function findInstructions(node, best = { text: "", path: "" }, path = "") {
  if (!node || typeof node !== "object") return best;
  for (const [key, value] of Object.entries(node)) {
    const here = path ? `${path}.${key}` : key;
    if ((key === "instructions" || key === "system_prompt") && typeof value === "string") {
      if (value.length > best.text.length) best = { text: value, path: here };
    } else if (typeof value === "object") {
      best = findInstructions(value, best, here);
    }
  }
  return best;
}

async function main() {
  const token = await getToken(FOUNDRY_SCOPE);

  // Resolve the version if it wasn't pinned.
  let version = pinnedVersion;
  const list = await get(token, "/agents");
  if (list.ok) {
    const data = Array.isArray(list.json?.data) ? list.json.data : [];
    const match = data.find(
      (agent) =>
        `${agent?.name || ""}`.toLowerCase() === name.toLowerCase() || `${agent?.id || ""}` === name
    );
    if (!version && match?.versions?.latest?.version) version = `${match.versions.latest.version}`;
    if (!match) {
      console.error(
        `Agent "${name}" not found. Available: ${data.map((a) => a?.name).filter(Boolean).join(", ") || "(none)"}`
      );
    }
  } else {
    console.error(`Agent list failed (${list.status}) at ${list.url}\n${list.text.slice(0, 400)}`);
  }

  const candidates = [
    version ? `/agents/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}` : null,
    `/agents/${encodeURIComponent(name)}`,
    `/assistants/${encodeURIComponent(name)}`,
  ].filter(Boolean);

  let found = null;
  for (const path of candidates) {
    const res = await get(token, path);
    if (!res.ok) {
      console.error(`  ${path} -> ${res.status}`);
      continue;
    }
    const hit = findInstructions(res.json);
    if (hit.text) {
      found = { ...hit, route: path, payload: res.json };
      break;
    }
  }

  if (!found) {
    console.error(
      "Could not find an `instructions` field on the agent. Nothing was written.\n" +
        "Check the endpoint, the api-version, and that the app registration has read access\n" +
        "to the Foundry project (Azure AI User / Reader on the project)."
    );
    process.exit(2);
  }

  if (process.argv.includes("--print")) {
    console.log(found.text);
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  const doc = `# Quoting instructions — ark-quote-agent

> Synced from Azure AI Foundry on ${stamp}.
> Agent: \`${name}${version ? `:${version}` : ""}\` — endpoint \`${endpoint}\`
> Source: field \`${found.path}\` on \`${found.route}\`
> Do not edit by hand — re-run \`node scripts/fetch_quote_instructions.mjs\` instead.
>
> These are the agent's own instructions. They describe how the website quote agent
> talks to a prospect. When drafting an email, apply the **scope, fee and
> information-gathering rules** from them; ignore anything about chat formatting,
> lead capture, or tool calls.

---

${found.text.trim()}
`;

  writeFileSync(TARGET, doc, "utf8");
  console.log(`Wrote ${TARGET} (${found.text.length} chars) from ${found.path}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
