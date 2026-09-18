import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { headers } from "next/headers";
import { locales } from "./i18n-locales";
import type { Locale } from "./i18n-locales";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export { locales };
export type { Locale };

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export async function getCurrentLocale(): Promise<Locale> {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || "fr";
  return isValidLocale(locale) ? locale : "fr";
}

function resolveTranslationsDir() {
  const candidates = [
    // Standalone/serverless deployment with outputFileTracingIncludes
    path.join(process.cwd(), 'src', 'translations'),
    // Fallback if the folder was hoisted to the root
    path.join(process.cwd(), 'translations'),
    // Local dev and non-standalone builds
    path.join(__dirname, '..', 'translations'),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return candidates[0];
}

function loadNamespace(locale: string, namespace: string): Record<string, unknown> | null {
  const cache = getTranslationsCache();
  const cacheKey = `${locale}:${namespace}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null;

  const translationsDir = resolveTranslationsDir();
  const filePath = path.join(translationsDir, locale, `${namespace}.json`);
  if (!fs.existsSync(filePath)) {
    cache.set(cacheKey, null);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);
    cache.set(cacheKey, data);
    return data;
  } catch {
    cache.set(cacheKey, null);
    return null;
  }
}

export function getTranslationsRecord(
  locale: Locale,
  namespace: string
): Record<string, unknown> {
  const primary = loadNamespace(locale, namespace);
  const fallback = primary ? null : loadNamespace("en", namespace);

  if (!primary && !fallback) maybeWarnMissing(namespace, locale);

  return (primary ?? fallback ?? {}) as Record<string, unknown>;
}

export async function getTranslations(locale: Locale, namespace: string) {
  const data = getTranslationsRecord(locale, namespace);

  // Return a function that can access nested properties
  return (key: string) => {
    const keys = key.split(".");
    let value: any = data;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    return value ?? key;
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Alias for getTranslations for better naming in pages
export const loadTranslations = getTranslations;

// ---- internals ----
const _cache: Map<string, Record<string, unknown> | null> = new Map();
function getTranslationsCache() {
  return _cache;
}

const _warned = new Set<string>();
function maybeWarnMissing(namespace: string, locale: string) {
  if (process.env.NODE_ENV === "production") return; // stay quiet in prod
  const key = `${locale}:${namespace}`;
  if (_warned.has(key)) return;
  _warned.add(key);

  // Dev-only single warning to avoid noisy logs, with suggestions
  const toKebab = (s: string) =>
    s
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/_/g, "-")
      .toLowerCase();

  const listNamespaces = (loc: string): string[] => {
    try {
      const translationsDir = path.join(__dirname, "..", "translations");
      const dir = path.join(translationsDir, loc);
      if (!fs.existsSync(dir)) return [];
      return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""));
    } catch {
      return [];
    }
  };

  const levenshtein = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  };

  const local = listNamespaces(locale);
  const en = listNamespaces("en");
  const all = Array.from(new Set([...local, ...en])).filter(Boolean);
  const target = namespace.toLowerCase();
  const scored = all
    .map((name) => ({ name, d: levenshtein(target, name.toLowerCase()) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.name)
    .filter((x) => x.length > 0);

  const kebabHint = toKebab(namespace);

  let message = `[i18n] Missing translations for "${namespace}" (locale: ${locale}) and fallback "en". Using keys as labels.`;
  if (scored.length) {
    message += `\n[i18n] Did you mean one of: ${scored.join(", ")}?`;
  }
  if (kebabHint !== namespace) {
    message += `\n[i18n] Hint: namespaces use kebab-case file names. Try: "${kebabHint}"`;
  }
  console.warn(message);
}
