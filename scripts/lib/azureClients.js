"use strict";

/**
 * Azure OpenAI + Azure AI Foundry agent clients for the Ridger article pipeline.
 *
 * Ported verbatim (logic-wise) from ark-fid.ch/scripts/ai-ressources-update.js so
 * both sites share the same battle-tested retry/backoff behaviour:
 *   - azureOpenAIJson(): chat completions in JSON mode with 408/429/5xx retries
 *     honouring retry-after / x-ms-retry-after-ms headers.
 *   - requestAgentJson(): Foundry agent (e.g. "web-deep-search") via the
 *     Responses API — used for the live-web research step — with fallback to
 *     the AZURE_OPENAI_RESEARCH_* deployment on RBAC errors.
 *
 * Env is read at module load, so require this module after env is set.
 */

const {
  extractOpenAIMetrics,
  formatOpenAIMetricsLog,
} = require("./openaiTelemetry");
const { buildAzureOpenAIChatBody } = require("./azureOpenAIChatOptions");

const AZURE_AGENT_ENDPOINT = process.env.AZURE_AGENT_ENDPOINT;
const AZURE_AGENT_NAME = process.env.AZURE_AGENT_NAME;
const AZURE_AGENT_API_KEY = process.env.AZURE_AGENT_API_KEY;
const AZURE_AGENT_RESEARCH_NAME =
  process.env.AZURE_AGENT_RESEARCH_NAME || AZURE_AGENT_NAME;
const AZURE_AGENT_RESPONSES_API_VERSION =
  process.env.AZURE_AGENT_RESPONSES_API_VERSION || "2025-11-15-preview";
const AZURE_AGENT_FORCE_RESPONSES =
  process.env.AZURE_AGENT_FORCE_RESPONSES === "1";
const AZURE_AGENT_RESPONSES_RETRIES = parseInt(
  process.env.AZURE_AGENT_RESPONSES_RETRIES || "4",
  10,
);
const AZURE_AGENT_RESPONSES_BACKOFF_MS = parseInt(
  process.env.AZURE_AGENT_RESPONSES_BACKOFF_MS || "15000",
  10,
);
const AZURE_AGENT_RESPONSES_BACKOFF_MAX_MS = parseInt(
  process.env.AZURE_AGENT_RESPONSES_BACKOFF_MAX_MS || "120000",
  10,
);
const AZURE_AGENT_RESPONSES_BACKOFF_JITTER_MS = parseInt(
  process.env.AZURE_AGENT_RESPONSES_BACKOFF_JITTER_MS || "2000",
  10,
);
const AZURE_AGENT_RESPONSES_TIMEOUT_MS = parseInt(
  process.env.AZURE_AGENT_RESPONSES_TIMEOUT_MS || "180000",
  10,
);
const AZURE_AGENT_RESPONSES_COOLDOWN_MS = parseInt(
  process.env.AZURE_AGENT_RESPONSES_COOLDOWN_MS || "8000",
  10,
);
const AZURE_AGENT_RESPONSES_MAX_OUTPUT_TOKENS = parseInt(
  process.env.AZURE_AGENT_RESPONSES_MAX_OUTPUT_TOKENS || "0",
  10,
);
const AZURE_AGENT_FALLBACK_TO_OPENAI =
  process.env.AZURE_AGENT_FALLBACK_TO_OPENAI === "1";
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_API_VERSION =
  process.env.AZURE_OPENAI_API_VERSION || "2024-05-01-preview";
const AZURE_OPENAI_DEPLOYMENT =
  process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4.1";
const AZURE_OPENAI_DRAFT_ENDPOINT =
  process.env.AZURE_OPENAI_DRAFT_ENDPOINT || AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_DRAFT_API_VERSION =
  process.env.AZURE_OPENAI_DRAFT_API_VERSION || AZURE_OPENAI_API_VERSION;
const AZURE_OPENAI_DRAFT_DEPLOYMENT =
  process.env.AZURE_OPENAI_DRAFT_DEPLOYMENT || AZURE_OPENAI_DEPLOYMENT;
const AZURE_OPENAI_DRAFT_MAX_TOKENS = parseInt(
  process.env.AZURE_OPENAI_DRAFT_MAX_TOKENS || "4096",
  10,
);
const AZURE_OPENAI_RESEARCH_ENDPOINT = process.env.AZURE_OPENAI_RESEARCH_ENDPOINT;
const AZURE_OPENAI_RESEARCH_API_VERSION =
  process.env.AZURE_OPENAI_RESEARCH_API_VERSION || AZURE_OPENAI_API_VERSION;
const AZURE_OPENAI_RESEARCH_DEPLOYMENT =
  process.env.AZURE_OPENAI_RESEARCH_DEPLOYMENT;
const AZURE_OPENAI_RESEARCH_API_KEY =
  process.env.AZURE_OPENAI_RESEARCH_API_KEY || AZURE_OPENAI_API_KEY;


function extractJsonFromText(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty Azure Agent response");
  }
  const fixBadJsonEscapes = (input) =>
    // Fix invalid escape sequences like "\_" or "\'" that frequently appear in
    // markdown-ish content inside JSON strings.
    input.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
  const fixControlCharsInStrings = (input) => {
    // JSON does not allow raw control characters inside strings (notably newlines).
    // Some models emit JSON-like text with raw newlines within quoted strings.
    let out = "";
    let inString = false;
    let escaped = false;
    for (let i = 0; i < input.length; i++) {
      const ch = input[i];
      if (!inString) {
        if (ch === '"') inString = true;
        out += ch;
        continue;
      }

      if (escaped) {
        escaped = false;
        out += ch;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        out += ch;
        continue;
      }
      if (ch === '"') {
        inString = false;
        out += ch;
        continue;
      }

      const code = ch.charCodeAt(0);
      if (code === 0x0a) {
        out += "\\n";
        continue;
      }
      if (code === 0x0d) {
        out += "\\r";
        continue;
      }
      if (code === 0x09) {
        out += "\\t";
        continue;
      }
      if (code < 0x20) {
        out += `\\u${code.toString(16).padStart(4, "0")}`;
        continue;
      }
      out += ch;
    }
    return out;
  };
  const fixLenientJson = (input) =>
    fixControlCharsInStrings(fixBadJsonEscapes(input));
  try {
    return JSON.parse(raw);
  } catch (error) {
    try {
      return JSON.parse(fixLenientJson(raw));
    } catch {}
    // Look for fenced code block
    const fence = raw.match(/```(?:json)?\n([\s\S]*?)```/i);
    if (fence) {
      const inner = fence[1].trim();
      try {
        return JSON.parse(inner);
      } catch {
        return JSON.parse(fixLenientJson(inner));
      }
    }
    // Fallback to first JSON object
    const firstBrace = raw.indexOf("{");
    if (firstBrace !== -1) {
      let depth = 0;
      for (let i = firstBrace; i < raw.length; i++) {
        const ch = raw[i];
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) {
            const candidate = raw.slice(firstBrace, i + 1);
            try {
              return JSON.parse(candidate);
            } catch {
              return JSON.parse(fixLenientJson(candidate));
            }
          }
        }
      }
    }
    throw error;
  }
}

/**
 * Legacy Azure agents use OpenAI-style IDs that start with "asst".
 */
function isLegacyAgentId(agentIdentifier) {
  return (
    typeof agentIdentifier === "string" && agentIdentifier.startsWith("asst")
  );
}

/**
 * Build a Responses API agent_reference payload from "name" or "name:version".
 * @param {string} agentName
 * @returns {{name: string, type: string, version?: string}}
 */
function buildAgentReference(agentName) {
  if (typeof agentName !== "string" || !agentName.trim()) {
    throw new Error("AZURE_AGENT_NAME must be a non-empty string");
  }
  const trimmedName = agentName.trim();
  const [name, version] = trimmedName.split(":", 2);
  if (!name) {
    throw new Error("AZURE_AGENT_NAME must include a name");
  }
  const agent = { name, type: "agent_reference" };
  if (version) {
    agent.version = version;
  }
  return agent;
}

async function listAgentsViaRest(credential) {
  if (typeof fetch !== "function") {
    return [];
  }

  const token = await credential.getToken("https://ai.azure.com/.default");
  if (!token?.token) {
    throw new Error("Failed to obtain Azure token for ai.azure.com scope");
  }

  const baseUrl = AZURE_AGENT_ENDPOINT.replace(/\/+$/, "");
  const url = `${baseUrl}/agents?api-version=${AZURE_AGENT_RESPONSES_API_VERSION}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Foundry agents REST list failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data.map((agent) => ({
    id: agent.id,
    name: (agent.name || agent.id || "").trim(),
    version: agent.versions?.latest?.version,
  }));
}

async function listAgentVersionsViaRest(credential, agentId) {
  if (typeof fetch !== "function") {
    return [];
  }

  const token = await credential.getToken("https://ai.azure.com/.default");
  if (!token?.token) {
    throw new Error("Failed to obtain Azure token for ai.azure.com scope");
  }

  const baseUrl = AZURE_AGENT_ENDPOINT.replace(/\/+$/, "");
  const encoded = encodeURIComponent(agentId);
  const url = `${baseUrl}/agents/${encoded}/versions?api-version=${AZURE_AGENT_RESPONSES_API_VERSION}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token.token}` },
  });

  if (!response.ok) {
    throw new Error(
      `Foundry agent versions REST list failed: ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return data.map((version) => ({
    id: version.id,
    name: (version.name || "").trim(),
    version: version.version,
  }));
}

const agentReferenceCache = new Map();

async function resolveAgentReference(agentName, credential) {
  if (agentReferenceCache.has(agentName)) {
    return agentReferenceCache.get(agentName);
  }

  if (typeof agentName !== "string" || !agentName.trim()) {
    throw new Error("AZURE_AGENT_NAME must be a non-empty string");
  }

  const trimmed = agentName.trim();
  const [namePart, versionPart] = trimmed.split(":", 2);
  const directRef = buildAgentReference(trimmed);

  const { AIProjectClient } = require("@azure/ai-projects");
  const client = new AIProjectClient(AZURE_AGENT_ENDPOINT, credential);

  // Prefer Foundry agent metadata via REST. Some SDK list endpoints return only
  // legacy assistants (asst_*) even when Foundry agents exist.
  if (namePart) {
    try {
      const token = await credential.getToken("https://ai.azure.com/.default");
      const url = `${AZURE_AGENT_ENDPOINT.replace(/\/+$/, "")}/agents?api-version=${encodeURIComponent(
        AZURE_AGENT_RESPONSES_API_VERSION,
      )}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token.token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const data = Array.isArray(json?.data) ? json.data : [];
        const match = data.find(
          (a) =>
            (a?.id && `${a.id}` === namePart) ||
            (a?.name && `${a.name}`.toLowerCase() === namePart.toLowerCase()),
        );
        const latest = match?.versions?.latest;
        if (match && latest) {
          const ref = {
            name: latest?.name || match?.name || namePart,
            type: "agent_reference",
          };
          const v = versionPart || latest?.version;
          if (v) ref.version = `${v}`;
          agentReferenceCache.set(agentName, ref);
          return ref;
        }
      }
    } catch {
      // ignore and continue to list-based resolution
    }
  }
  const listFn =
    typeof client.agents.list === "function"
      ? client.agents.list.bind(client.agents)
      : typeof client.agents.listAgents === "function"
        ? client.agents.listAgents.bind(client.agents)
        : null;
  const candidates = [];
  const nameMatches = [];
  let idMatch = null;
  try {
    if (listFn) {
      for await (const agent of listFn()) {
        const agentName = (agent.name || "").trim();
        const agentVersion = agent.version;
        candidates.push({ id: agent.id, name: agentName, version: agentVersion });

        if (agent.id === trimmed || agent.id === namePart) {
          idMatch = agent;
        }

        if (
          agentName &&
          (agentName === namePart ||
            agentName.toLowerCase() === namePart.toLowerCase())
        ) {
          nameMatches.push(agent);
        }
      }
    }
  } catch (error) {
    console.warn(
      `[agent] Could not list agents (${error?.message || error}).`,
    );
  }

  let chosen = null;
  if (versionPart) {
    chosen = nameMatches.find(
      (agent) => `${agent.version || ""}` === `${versionPart}`,
    );
    if (!chosen && nameMatches.length) {
      const versions = nameMatches
        .map((agent) => agent.version)
        .filter(Boolean)
        .map((v) => `${v}`);
      const err = new Error(
        `Agent "${namePart}" found, but version "${versionPart}" does not match available versions: ${
          versions.length ? versions.join(", ") : "(unknown)"
        }`,
      );
      err.code = "AGENT_VERSION_NOT_FOUND";
      throw err;
    }
  }

  if (!chosen && idMatch) {
    chosen = idMatch;
  }

  if (!chosen && nameMatches.length) {
    chosen = nameMatches[0];
    if (nameMatches.length > 1) {
      console.warn(
        `[agent] Multiple agent versions found for "${namePart}". Using version "${chosen.version || "unknown"}". Set AZURE_AGENT_NAME=${namePart}:<version> to pin.`,
      );
    }
  }

  let restCandidates = null;
  if (!chosen) {
    try {
      restCandidates = await listAgentsViaRest(credential);
      const restIdMatch = restCandidates.find(
        (agent) => agent.id === trimmed || agent.id === namePart,
      );
      const restNameMatches = restCandidates.filter(
        (agent) =>
          agent.name &&
          (agent.name === namePart ||
            agent.name.toLowerCase() === namePart.toLowerCase()),
      );

      if (versionPart) {
        const restTarget = restNameMatches[0] || restIdMatch;
        if (restTarget) {
          const versions = await listAgentVersionsViaRest(
            credential,
            restTarget.id || restTarget.name,
          );
          const versionMatch = versions.find(
            (agent) => `${agent.version || ""}` === `${versionPart}`,
          );
          if (versionMatch) {
            chosen = {
              id: restTarget.id,
              name: restTarget.name,
              version: versionMatch.version,
            };
          }
        }
      }

      if (!chosen && restIdMatch) {
        chosen = restIdMatch;
      }

      if (!chosen && restNameMatches.length) {
        chosen = restNameMatches[0];
      }
    } catch (error) {
      console.warn(
        `[agent] REST agent listing failed (${error?.message || error}).`,
      );
    }
  }

  if (!chosen) {
    const availableCandidates =
      restCandidates && restCandidates.length
        ? restCandidates
        : candidates;
    const available =
      availableCandidates
        .map(
          (c) =>
            `${c.name || "(unnamed)"}${c.version ? `:${c.version}` : ""} (${c.id})`,
        )
        .join(", ") || "(none)";
    const err = new Error(
      `Agent "${trimmed}" not found in project. Available agents: ${available}`,
    );
    err.code = "AGENT_NOT_FOUND";
    throw err;
  }

  const ref = { name: chosen.name, type: "agent_reference" };
  if (versionPart) {
    ref.version = versionPart;
  } else if (chosen.version) {
    ref.version = chosen.version;
  }

  agentReferenceCache.set(agentName, ref);
  return ref;
}

function extractResponseText(response) {
  if (!response || typeof response !== "object") return "";
  if (response.output_text) return response.output_text;
  let outputText = "";
  if (response.output) {
    if (typeof response.output === "string") {
      outputText = response.output;
    } else if (Array.isArray(response.output)) {
      for (const item of response.output) {
        if (item.type === "text" && item.text) {
          outputText =
            typeof item.text === "string" ? item.text : item.text.value || "";
        } else if (item.type === "message" && item.content) {
          for (const c of item.content) {
            if (c.type === "text" && c.text) {
              outputText =
                typeof c.text === "string" ? c.text : c.text.value || "";
            } else if (c.type === "output_text" && c.text) {
              outputText = c.text;
            }
          }
        }
      }
    } else if (response.output.content) {
      for (const c of response.output.content) {
        if (c.type === "text" && c.text) {
          outputText = typeof c.text === "string" ? c.text : c.text.value || "";
        } else if (c.type === "output_text" && c.text) {
          outputText = c.text;
        }
      }
    }
  }
  if (!outputText && response.choices?.[0]?.message?.content) {
    outputText = response.choices[0].message.content;
  }
  return outputText;
}

function sleep(ms) {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getHeaderValue(headers, name) {
  if (!headers) return null;
  const lower = name.toLowerCase();
  if (typeof headers.get === "function") {
    return headers.get(name) || headers.get(lower) || null;
  }
  if (typeof headers === "object") {
    return headers[name] || headers[lower] || null;
  }
  return null;
}

function getRetryAfterMsFromError(error) {
  const headersCandidates = [
    error?.headers,
    error?.response?.headers,
    error?.res?.headers,
  ];
  for (const headers of headersCandidates) {
    const msRaw = getHeaderValue(headers, "x-ms-retry-after-ms");
    const ms = msRaw ? parseInt(`${msRaw}`, 10) : NaN;
    if (Number.isFinite(ms)) return Math.max(0, ms);

    const secRaw = getHeaderValue(headers, "retry-after");
    const sec = secRaw ? parseInt(`${secRaw}`, 10) : NaN;
    if (Number.isFinite(sec)) return Math.max(0, sec) * 1000;
  }
  return null;
}

function isRetryableAzureOpenAIFetchError(error) {
  const codes = [
    error?.code,
    error?.cause?.code,
    error?.errno,
    error?.cause?.errno,
  ].filter(Boolean);
  const retryableCodes = new Set([
    "UND_ERR_HEADERS_TIMEOUT",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "EAI_AGAIN",
  ]);
  if (codes.some((code) => retryableCodes.has(code))) return true;

  const message = String(error?.message || "").toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("headers timeout") ||
    message.includes("socket hang up") ||
    message.includes("connection reset")
  );
}

function computeAzureOpenAIRetryDelayMs(attempt, serverDelayMs = null) {
  const expBackoffMs = Math.min(30000, 2000 * Math.pow(2, attempt - 1));
  const jitterMs = Math.floor(Math.random() * 400);
  return Math.max(serverDelayMs || 0, expBackoffMs + jitterMs);
}

function ensureHttpsUrl(input) {
  const raw = String(input || "").trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `https://${raw}`;
}

function buildAzureOpenAIChatUrlFor({ endpoint, deployment, apiVersion }) {
  if (!endpoint) throw new Error("Missing Azure OpenAI endpoint");
  let url = ensureHttpsUrl(String(endpoint).trim());
  if (!url) throw new Error("Missing Azure OpenAI endpoint");
  if (!deployment) throw new Error("Missing Azure OpenAI deployment");
  if (!apiVersion) throw new Error("Missing Azure OpenAI apiVersion");

  const u = new URL(url);

  // Normalize to the chat completions route (some teams store a full URL in the secret,
  // others store just the origin).
  const hasDeploymentPath = /\/openai\/deployments\//.test(u.pathname);
  const hasChatCompletions = /\/chat\/completions$/.test(u.pathname);

  if (hasDeploymentPath) {
    // Replace deployment in-path for drafting vs translations.
    u.pathname = u.pathname.replace(
      /(\/openai\/deployments\/)([^\/]+)/,
      `$1${deployment}`,
    );
    if (!hasChatCompletions) {
      u.pathname = `${u.pathname.replace(/\/+$/, "")}/chat/completions`;
    }
  } else {
    u.pathname = `/openai/deployments/${deployment}/chat/completions`;
  }

  if (!u.searchParams.has("api-version")) {
    u.searchParams.set("api-version", apiVersion);
  }

  return u.toString();
}


async function azureOpenAIJson(prompt, options = {}) {
  const {
    endpoint = AZURE_OPENAI_ENDPOINT,
    deployment = AZURE_OPENAI_DEPLOYMENT,
    apiVersion = AZURE_OPENAI_API_VERSION,
    apiKey = AZURE_OPENAI_API_KEY,
    temperature = 0.2,
    topP = 0.9,
    maxTokens = null,
    debugLabel = null,
    onMetrics = null,
    system = "You are a professional assistant. Output ONLY a JSON object.",
  } = options;

  if (!apiKey) {
    throw new Error("Missing AZURE_OPENAI_API_KEY");
  }
  const url = buildAzureOpenAIChatUrlFor({
    endpoint,
    deployment,
    apiVersion,
  });
  const body = buildAzureOpenAIChatBody({
    deployment,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature,
    topP,
    maxTokens,
    responseFormat: { type: "json_object" },
  });

  const maxRetries = parseInt(process.env.AZURE_OPENAI_RETRIES || "6", 10);
  let attempt = 0;
  while (true) {
    attempt += 1;
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      const cause = error?.cause;
      const details = [];
      if (cause?.code) details.push(`code=${cause.code}`);
      if (cause?.errno) details.push(`errno=${cause.errno}`);
      if (cause?.syscall) details.push(`syscall=${cause.syscall}`);
      if (cause?.address) details.push(`address=${cause.address}`);
      if (cause?.port) details.push(`port=${cause.port}`);
      const detailSuffix = details.length ? ` (${details.join(", ")})` : "";
      if (isRetryableAzureOpenAIFetchError(error) && attempt <= maxRetries) {
        const retryAfterMs = getRetryAfterMsFromError(error);
        const delay = computeAzureOpenAIRetryDelayMs(attempt, retryAfterMs);
        console.warn(
          `[WARN] Azure OpenAI fetch error (attempt ${attempt}/${maxRetries}) retrying in ${delay}ms: ${error?.message || "unknown error"}${detailSuffix}`,
        );
        await sleep(delay);
        continue;
      }
      throw new Error(
        `Azure OpenAI fetch failed: ${error?.message || "unknown error"}${detailSuffix}`,
      );
    }
    const text = await res.text().catch(() => "");
    if (res.ok) {
      const parsed = JSON.parse(text);
      const metrics = extractOpenAIMetrics(parsed, {
        requestedMaxTokens: maxTokens,
      });
      if (debugLabel) {
        console.log(formatOpenAIMetricsLog(debugLabel, metrics));
      }
      if (typeof onMetrics === "function") {
        onMetrics(metrics);
      }
      const content = parsed?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Azure OpenAI returned no content.");
      return extractJsonFromText(content);
    }
    const retryable = [408, 429, 500, 502, 503, 504];
    if (retryable.includes(res.status) && attempt <= maxRetries) {
      const retryAfterHeader = res.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader
        ? parseInt(retryAfterHeader, 10)
        : NaN;
      const retryAfterMsHeader = res.headers.get("x-ms-retry-after-ms");
      const retryAfterMs = retryAfterMsHeader
        ? parseInt(retryAfterMsHeader, 10)
        : NaN;

      const serverDelayMs = Number.isFinite(retryAfterMs)
        ? Math.max(0, retryAfterMs)
        : Number.isFinite(retryAfterSeconds)
          ? Math.max(0, retryAfterSeconds) * 1000
          : null;
      const delay = computeAzureOpenAIRetryDelayMs(attempt, serverDelayMs);
      console.warn(
        `[WARN] Azure OpenAI HTTP ${res.status} (attempt ${attempt}/${maxRetries}) retrying in ${delay}ms`,
      );
      await sleep(delay);
      continue;
    }
    throw new Error(`Azure OpenAI HTTP ${res.status}: ${text.slice(0, 400)}`);
  }
}

async function azureOpenAITranslateJson(prompt) {
  return await azureOpenAIJson(prompt, {
    system: "You are a professional translator. Output ONLY a JSON object.",
    temperature: 0.2,
    topP: 0.9,
  });
}

/**
 * Call an Azure AI Foundry agent through the Responses API and parse its JSON output.
 */
async function azureAgentResponsesApi(
  prompt,
  { agentName = AZURE_AGENT_NAME } = {},
) {
  if (!AZURE_AGENT_ENDPOINT) throw new Error("Missing AZURE_AGENT_ENDPOINT");
  if (!agentName) throw new Error("Missing AZURE_AGENT_NAME");

  const { DefaultAzureCredential } = require("@azure/identity");
  const { AzureOpenAI } = require("openai");
  const apiKey = (AZURE_AGENT_API_KEY || "").trim();
  const useApiKey = !!apiKey;
  const credential = useApiKey ? null : new DefaultAzureCredential();
  const debugAgent = !!process.env.DEBUG_AGENT;

  const azureADTokenProvider = useApiKey
    ? null
    : async () => {
        const token = await credential.getToken("https://ai.azure.com/.default");
        if (!token?.token) {
          throw new Error("Failed to obtain Azure token for ai.azure.com scope");
        }
        return token.token;
      };

  const baseURL = `${AZURE_AGENT_ENDPOINT.replace(/\/+$/, "")}/openai`;
  const openAIClient = new AzureOpenAI({
    apiVersion: AZURE_AGENT_RESPONSES_API_VERSION,
    baseURL,
    ...(useApiKey
      ? { apiKey }
      : { azureADTokenProvider, apiKey: null }),
  });
  const agentRef = useApiKey
    ? buildAgentReference(agentName)
    : await resolveAgentReference(agentName, credential);

  if (debugAgent) {
    console.log(
      `[agent] Responses API (SDK) using agent=${agentRef.name}${
        agentRef.version ? `:${agentRef.version}` : ""
      }`,
    );
  }

  let response;
  let useMaxOutputTokens = AZURE_AGENT_RESPONSES_MAX_OUTPUT_TOKENS > 0;
  for (let attempt = 0; attempt <= AZURE_AGENT_RESPONSES_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      AZURE_AGENT_RESPONSES_TIMEOUT_MS,
    );
    try {
      const conversation = await openAIClient.conversations.create(
        {
          items: [{ type: "message", role: "user", content: prompt }],
        },
        { signal: controller.signal },
      );

      response = await openAIClient.responses.create(
        {
          conversation: conversation.id,
          agent: agentRef,
          ...(useMaxOutputTokens
            ? { max_output_tokens: AZURE_AGENT_RESPONSES_MAX_OUTPUT_TOKENS }
            : {}),
        },
        { signal: controller.signal },
      );

      if (
        response.status === "incomplete" &&
        response.incomplete_details?.reason === "max_output_tokens"
      ) {
        if (useMaxOutputTokens && attempt < AZURE_AGENT_RESPONSES_RETRIES) {
          useMaxOutputTokens = false;
          if (debugAgent) {
            console.log(
              "[agent] Responses API hit max_output_tokens. Retrying once without a cap...",
            );
          }
          await sleep(AZURE_AGENT_RESPONSES_BACKOFF_MS);
          response = null;
          continue;
        }
        throw new Error(
          "Responses API returned incomplete output because max_output_tokens was reached. Increase AZURE_AGENT_RESPONSES_MAX_OUTPUT_TOKENS.",
        );
      }
      break;
    } catch (error) {
      if (controller.signal.aborted) {
        if (attempt < AZURE_AGENT_RESPONSES_RETRIES) {
          if (debugAgent) {
            console.log(
              `[agent] Responses API timeout after ${AZURE_AGENT_RESPONSES_TIMEOUT_MS}ms. Retrying...`,
            );
          }
          continue;
        }
        throw new Error(
          `Responses API timeout after ${AZURE_AGENT_RESPONSES_TIMEOUT_MS}ms`,
        );
      }

      const status = error?.status || error?.statusCode;
      if (status === 404) {
        const err = new Error(
          `Azure Agent not found (404). Check AZURE_AGENT_ENDPOINT and AZURE_AGENT_NAME. Resolved agent reference: ${agentRef.name}${agentRef.version ? `:${agentRef.version}` : ""}`,
        );
        err.code = "AGENT_NOT_FOUND_404";
        throw err;
      }
      if (
        (status === 408 ||
          status === 429 ||
          status === 500 ||
          status === 502 ||
          status === 503 ||
          status === 504) &&
        attempt < AZURE_AGENT_RESPONSES_RETRIES
      ) {
        const baseBackoff = AZURE_AGENT_RESPONSES_BACKOFF_MS * (attempt + 1);
        const jitter =
          AZURE_AGENT_RESPONSES_BACKOFF_JITTER_MS > 0
            ? Math.floor(
                Math.random() * AZURE_AGENT_RESPONSES_BACKOFF_JITTER_MS,
              )
            : 0;
        const proposed = baseBackoff + jitter;
        const backoffMs =
          AZURE_AGENT_RESPONSES_BACKOFF_MAX_MS > 0
            ? Math.min(proposed, AZURE_AGENT_RESPONSES_BACKOFF_MAX_MS)
            : proposed;
        const retryAfterMs = getRetryAfterMsFromError(error);
        const effectiveBackoffMs = Math.max(backoffMs, retryAfterMs || 0);
        if (debugAgent) {
          console.log(
            `[agent] Responses API ${status} received. Retrying in ${effectiveBackoffMs}ms...`,
          );
        }
        await sleep(effectiveBackoffMs);
        continue;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!response) {
    throw new Error("Responses API request failed without a response");
  }

  const outputText = extractResponseText(response);
  if (!outputText) {
    if (debugAgent) {
      console.log(
        "[agent] Responses API raw response:",
        JSON.stringify(response, null, 2),
      );
    }
    throw new Error("Responses API returned no output text");
  }

  return extractJsonFromText(outputText);
}

async function requestAgentJson(prompt, { agentName = AZURE_AGENT_NAME } = {}) {
  if (!agentName) throw new Error("Missing AZURE_AGENT_NAME");

  // Legacy assistant IDs (asst_*) are not allowed.
  if (isLegacyAgentId(agentName)) {
    throw new Error(
      `Legacy agent IDs are not allowed. Update AZURE_AGENT_NAME to a Foundry agent name like "web-deep-search:5".`,
    );
  }

  const isPermissionError = (error) => {
    const status = error?.status || error?.statusCode;
    if (status === 401 || status === 403) return true;
    const message = `${error?.message || ""}`.toLowerCase();
    return (
      message.includes("rbac") ||
      message.includes("access denied") ||
      message.includes("not have permissions") ||
      message.includes("permissions")
    );
  };

  const tryAgent = async () => {
    const result = await azureAgentResponsesApi(prompt, { agentName });
    if (AZURE_AGENT_RESPONSES_COOLDOWN_MS > 0) {
      await sleep(AZURE_AGENT_RESPONSES_COOLDOWN_MS);
    }
    return result;
  };

  try {
    if (AZURE_AGENT_FORCE_RESPONSES) {
      return await tryAgent();
    }
    // New Foundry agents use the Responses API by default.
    return await tryAgent();
  } catch (error) {
    if (AZURE_AGENT_FALLBACK_TO_OPENAI && isPermissionError(error)) {
      if (
        !AZURE_OPENAI_RESEARCH_ENDPOINT ||
        !AZURE_OPENAI_RESEARCH_DEPLOYMENT ||
        !AZURE_OPENAI_RESEARCH_API_KEY
      ) {
        throw error;
      }
      console.warn(
        `[agent] Permission denied (${error?.status || "unknown"}). Falling back to Azure OpenAI.`,
      );
      return await azureOpenAIJson(prompt, {
        endpoint: AZURE_OPENAI_RESEARCH_ENDPOINT,
        deployment: AZURE_OPENAI_RESEARCH_DEPLOYMENT,
        apiVersion: AZURE_OPENAI_RESEARCH_API_VERSION,
        apiKey: AZURE_OPENAI_RESEARCH_API_KEY,
        maxTokens: Math.min(2048, AZURE_OPENAI_DRAFT_MAX_TOKENS),
        system:
          "You are an expert research assistant. Output ONLY a JSON object.",
      });
    }
    throw error;
  }
}

function ensureAzureEnv() {
  const missing = [];
  if (!AZURE_AGENT_ENDPOINT) missing.push("AZURE_AGENT_ENDPOINT");
  if (!AZURE_AGENT_NAME) missing.push("AZURE_AGENT_NAME");
  if (missing.length) {
    throw new Error(
      `Missing required Azure env vars: ${missing.join(", ")}. See README.`,
    );
  }
}

function ensureOpenAIEnv() {
  const missing = [];
  if (!AZURE_OPENAI_ENDPOINT) missing.push("AZURE_OPENAI_ENDPOINT");
  if (!AZURE_OPENAI_API_KEY) missing.push("AZURE_OPENAI_API_KEY");
  if (missing.length) {
    throw new Error(
      `Missing required Azure OpenAI env vars: ${missing.join(", ")}. See README.`,
    );
  }
}


module.exports = {
  AZURE_OPENAI_ENDPOINT,
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_API_VERSION,
  AZURE_OPENAI_DEPLOYMENT,
  AZURE_OPENAI_DRAFT_ENDPOINT,
  AZURE_OPENAI_DRAFT_API_VERSION,
  AZURE_OPENAI_DRAFT_DEPLOYMENT,
  AZURE_OPENAI_DRAFT_MAX_TOKENS,
  AZURE_OPENAI_RESEARCH_ENDPOINT,
  AZURE_OPENAI_RESEARCH_API_VERSION,
  AZURE_OPENAI_RESEARCH_DEPLOYMENT,
  AZURE_OPENAI_RESEARCH_API_KEY,
  AZURE_AGENT_ENDPOINT,
  AZURE_AGENT_NAME,
  AZURE_AGENT_RESEARCH_NAME,
  azureOpenAIJson,
  azureOpenAITranslateJson,
  requestAgentJson,
  extractJsonFromText,
  computeAzureOpenAIRetryDelayMs,
  getRetryAfterMsFromError,
  isRetryableAzureOpenAIFetchError,
  buildAzureOpenAIChatUrlFor,
  ensureOpenAIEnv,
  sleep,
};
