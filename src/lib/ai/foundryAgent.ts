import {
  ClientSecretCredential,
  DefaultAzureCredential,
  type TokenCredential,
} from "@azure/identity";

export type FoundryAgentReference = {
  type: "agent_reference";
  name: string;
  version?: string;
};

type CacheEntry = {
  ref: FoundryAgentReference;
  expiresAt: number;
};

export type FoundryAgentReferenceCacheEntry = CacheEntry;

const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000;

export function isLegacyAssistantId(value: string) {
  return /^asst_[A-Za-z0-9]+$/.test(value.trim());
}

export function parseAgentReference(raw: string): FoundryAgentReference {
  const trimmed = raw.trim();
  const [namePart, versionPart] = trimmed.split(":", 2);
  if (!namePart) {
    throw new Error("Agent reference must include a name");
  }
  return {
    type: "agent_reference",
    name: namePart,
    ...(versionPart ? { version: versionPart } : {}),
  };
}

export function getAzureCredentialFromEnv(): TokenCredential {
  const tenantId = (process.env.AZURE_TENANT_ID || "").trim();
  const clientId = (process.env.AZURE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.AZURE_CLIENT_SECRET || "").trim();
  if (tenantId && clientId && clientSecret) {
    return new ClientSecretCredential(tenantId, clientId, clientSecret);
  }

  const json = (process.env.AZURE_CREDENTIALS || "").trim();
  if (json && json !== "undefined" && json !== "null") {
    try {
      const parsed = JSON.parse(json) as Partial<{
        tenantId: string;
        clientId: string;
        clientSecret: string;
      }>;
      if (parsed.tenantId && parsed.clientId && parsed.clientSecret) {
        return new ClientSecretCredential(
          parsed.tenantId,
          parsed.clientId,
          parsed.clientSecret
        );
      }
    } catch {
      // fall through to DefaultAzureCredential
    }
  }

  return new DefaultAzureCredential();
}

export async function getFoundryAccessToken(
  credential: TokenCredential,
  scope = "https://ai.azure.com/.default"
) {
  const token = await credential.getToken(scope);
  if (!token?.token) {
    throw new Error("Azure token acquisition failed");
  }
  return token.token;
}

export async function resolveFoundryAgentReference({
  endpoint,
  agentName,
  apiVersion,
  token,
  headers,
  fetchFn = fetch,
  cache,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  now = () => Date.now(),
}: {
  endpoint: string;
  agentName: string;
  apiVersion: string;
  token?: string;
  headers?: Record<string, string>;
  fetchFn?: typeof fetch;
  cache?: Map<string, CacheEntry>;
  cacheTtlMs?: number;
  now?: () => number;
}): Promise<FoundryAgentReference> {
  const trimmed = agentName.trim();
  const [namePart, versionPart] = trimmed.split(":", 2);
  if (!namePart) {
    throw new Error("Agent reference must include a name");
  }
  if (versionPart) return parseAgentReference(trimmed);

  const key = `${endpoint}::${apiVersion}::${namePart}`.toLowerCase();
  if (cache) {
    const entry = cache.get(key);
    if (entry && entry.expiresAt > now()) return entry.ref;
  }

  const url = `${endpoint.replace(/\/+$/, "")}/agents?api-version=${encodeURIComponent(
    apiVersion
  )}`;
  const resolvedHeaders =
    headers || (token ? { Authorization: `Bearer ${token}` } : {});
  const res = await fetchFn(url, {
    headers: resolvedHeaders,
  });

  if (!res.ok) {
    throw new Error(`Agent lookup failed (${res.status})`);
  }

  const payload = (await res.json()) as any;
  const data = Array.isArray(payload?.data) ? payload.data : [];
  const match = data.find(
    (agent: any) =>
      (agent?.id && `${agent.id}` === namePart) ||
      (agent?.name &&
        `${agent.name}`.toLowerCase() === namePart.toLowerCase())
  );

  const latest = match?.versions?.latest;
  const ref: FoundryAgentReference = {
    type: "agent_reference",
    name: (latest?.name || match?.name || namePart || "").trim(),
  };
  if (latest?.version) ref.version = `${latest.version}`;

  if (!ref.name) {
    throw new Error("Agent lookup returned empty name");
  }

  if (cache) {
    cache.set(key, { ref, expiresAt: now() + cacheTtlMs });
  }
  return ref;
}

const readTextValue = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const maybeValue = (value as { value?: unknown }).value;
    if (typeof maybeValue === "string") return maybeValue;
  }
  return "";
};

export function extractResponseText(response: unknown): string {
  if (!response || typeof response !== "object") return "";
  const candidate = response as Record<string, any>;
  if (typeof candidate.output_text === "string") return candidate.output_text;
  if (typeof candidate.output === "string") return candidate.output;
  if (Array.isArray(candidate.output)) {
    for (const item of candidate.output) {
      if (item?.type === "output_text") {
        const text = readTextValue(item.text);
        if (text) return text;
      }
      if (item?.type === "text") {
        const text = readTextValue(item.text);
        if (text) return text;
      }
      if (item?.type === "message" && Array.isArray(item.content)) {
        for (const content of item.content) {
          if (content?.type === "output_text") {
            const text = readTextValue(content.text);
            if (text) return text;
          }
          if (content?.type === "text") {
            const text = readTextValue(content.text);
            if (text) return text;
          }
        }
      }
    }
  }
  if (candidate.output?.content) {
    for (const content of candidate.output.content) {
      if (content?.type === "output_text") {
        const text = readTextValue(content.text);
        if (text) return text;
      }
      if (content?.type === "text") {
        const text = readTextValue(content.text);
        if (text) return text;
      }
    }
  }
  if (candidate.choices?.[0]?.message?.content) {
    return candidate.choices[0].message.content;
  }
  return "";
}
