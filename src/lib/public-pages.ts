/**
 * Public pages of ridger.ch in French and English, read from the same
 * translation files the pages render. Shared by /llms.txt, /llms-full.txt
 * (full text for LLMs) and the per-page Open Graph images
 * (/assets/og-pages/<key>.webp).
 *
 * Only pages listed in the sitemap are included (no API, form internals or
 * noindex article copies). DE, ES and PT are left out: they translate the
 * same content and would triple the size.
 */
import fs from "fs";
import path from "path";
import { localizePath } from "./paths";
import { getArticles, getValidLocalesForSlug } from "./articles";
import locationCities from "./locations.json";

export const SITE_URL = "https://ridger.ch";
export type PublicLocale = "fr" | "en";
export const PUBLIC_LOCALES: readonly PublicLocale[] = ["fr", "en"];

export type PublicPage = {
  /** Base path, e.g. "/services/consolidated-reporting" (not localized). */
  path: string;
  locale: PublicLocale;
  url: string;
  title: string;
  /** Short section label shown above the title on the share image. */
  rubric: string;
  updated?: string;
  /** One-sentence summary (meta description), for llms.txt. */
  description?: string;
  /** Markdown body (without the title), built on demand. */
  body: () => string;
};

type Json = Record<string, unknown>;

const jsonCache = new Map<string, Json | null>();
function readNs(locale: PublicLocale, ns: string): Json | null {
  const key = `${locale}/${ns}`;
  if (jsonCache.has(key)) return jsonCache.get(key)!;
  let value: Json | null = null;
  try {
    const file = path.join(process.cwd(), "src", "translations", locale, `${ns}.json`);
    value = JSON.parse(fs.readFileSync(file, "utf8")) as Json;
  } catch {
    value = null;
  }
  jsonCache.set(key, value);
  return value;
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const get = (o: unknown, dotted: string): unknown =>
  dotted.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Json)[k] : undefined), o);

export const pageUrl = (p: string, locale: PublicLocale) => {
  const localized = p === "/" ? "/" : localizePath(p, locale);
  return `${SITE_URL}/${locale}${localized === "/" ? "" : localized}/`;
};

/** Root-relative links in Markdown become absolute: the file is read off-site. */
export const absoluteLinks = (md: string) => md.replace(/\]\(\//g, `](${SITE_URL}/`);

const clean = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

/* UI strings that are not page content (buttons, badges, form fields, alt texts, links). */
const SKIP_EXACT = new Set(["meta", "alt", "form", "errors", "error", "success", "sending", "lastupdated", "eyebrow", "scrollhint", "readmore", "showmore", "showless", "logo", "icon", "url", "name", "hublabel"]);
const SKIP_PART = ["cta", "button", "badge", "imagealt", "placeholder", "label", "href", "calltoaction"];
const skipKey = (k: string) => {
  const l = k.toLowerCase();
  return SKIP_EXACT.has(l) || SKIP_PART.some((p) => l.includes(p)) || l.startsWith("map");
};
const isTitleKey = (k: string) => /^(title|question\d*)$/i.test(k);
const isSubHeadingKey = (k: string) => /.title$/i.test(k) && !/^subtitle$/i.test(k);
const heading = (depth: number, text: string) => `${"#".repeat(Math.min(Math.max(depth, 2), 4))} ${text}`;

/** Translation JSON to Markdown: titles become headings, string arrays bullets, the rest paragraphs. */
function jsonToMarkdown(node: unknown, depth: number, out: string[]) {
  if (typeof node === "string") {
    const t = clean(node);
    if (t) out.push(t, "");
    return;
  }
  if (Array.isArray(node)) {
    if (node.every((x) => typeof x === "string")) {
      const items = node.map((x) => clean(x as string)).filter(Boolean);
      if (!items.length) return;
      // Long items are paragraphs on the page, short ones a list.
      const long = items.reduce((n, x) => n + x.length, 0) / items.length > 160;
      if (long) out.push(...items.flatMap((x) => [x, ""]));
      else out.push(...items.map((x) => `- ${x}`), "");
      return;
    }
    for (const x of node) jsonToMarkdown(x, depth, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const entries = Object.entries(node as Json).filter(([k]) => !skipKey(k));
  const titleEntry = entries.find(([k, v]) => isTitleKey(k) && typeof v === "string");
  if (titleEntry) out.push(heading(depth, clean(titleEntry[1] as string)), "");
  for (const [k, v] of entries) {
    if (titleEntry && k === titleEntry[0]) continue;
    if (typeof v === "string" && /^question\d*$/i.test(k)) {
      out.push(heading(depth + 1, clean(v)), "");
      continue;
    }
    if (typeof v === "string" && isSubHeadingKey(k)) {
      out.push(heading(depth + 1, clean(v)), "");
      continue;
    }
    jsonToMarkdown(v, depth + 1, out);
  }
}

type Section = { ns: string; pick?: string; only?: string[] };

function nsMarkdown(locale: PublicLocale, { ns, pick, only }: Section) {
  let data: unknown = readNs(locale, ns);
  if (pick) data = get(data, pick);
  if (only && data && typeof data === "object") {
    data = Object.fromEntries(only.filter((k) => k in (data as Json)).map((k) => [k, (data as Json)[k]]));
  }
  const out: string[] = [];
  jsonToMarkdown(data, 1, out);
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Meta description of a static page (lead paragraph). */
function metaDescription(locale: PublicLocale, p: string): string {
  const pages = (readNs(locale, "metadata")?.pages ?? {}) as Record<string, { description?: string }>;
  return clean(str(pages[p]?.description));
}

/** Page title from metadata.json without the trailing brand. */
function metaTitle(locale: PublicLocale, p: string): string {
  const pages = (readNs(locale, "metadata")?.pages ?? {}) as Record<string, { title?: string }>;
  return str(pages[p]?.title).replace(/\s+[|–-]\s+Ridger\s*$/i, "").trim() || "Ridger";
}

const nav = (locale: PublicLocale, key: string) => str(readNs(locale, "navbar")?.[key]);
const faqRange = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).flatMap((n) => [`Question${n}`, `Answer${n}`]);

type Spec = { path: string; rubric: (l: PublicLocale) => string; sections: Section[] };

export const SERVICE_NAMESPACES: [string, string][] = [
  ["/services/consolidated-reporting", "consolidated-reporting"],
  ["/services/investment-oversight", "investment-oversight"],
  ["/services/family-office-coordination", "family-office-coordination"],
  ["/services/governance-succession", "governance-succession"],
  ["/services/tax-administration", "tax-administration"],
  ["/services/digital-vault", "digital-vault"],
  ["/services/real-estate-transactions", "real-estate-transactions"],
  ["/services/property-management", "property-management"],
  ["/services/household-staff", "household-staff"],
  ["/services/relocation-residence", "relocation-residence"],
  ["/services/domiciliation-mail", "domiciliation-mail"],
];

const SPECS: Spec[] = [
  {
    path: "/",
    rubric: (l) => str(get(readNs(l, "home"), "Hero.Badge")),
    sections: [
      { ns: "home", only: ["Hero", "Services", "Trust", "How", "About"] },
      { ns: "faq", only: ["Title", ...faqRange(1, 5)] },
    ],
  },
  { path: "/ai-profile", rubric: () => "Ridger", sections: [{ ns: "ai-profile" }] },
  { path: "/approach", rubric: (l) => nav(l, "Approach"), sections: [{ ns: "approach" }] },
  { path: "/services", rubric: (l) => nav(l, "Services"), sections: [{ ns: "servicesItems" }, { ns: "faq", only: faqRange(6, 12) }] },
  ...SERVICE_NAMESPACES.map(([p, ns]): Spec => ({ path: p, rubric: (l) => nav(l, "Services"), sections: [{ ns }] })),
  ...locationCities.map(
    (city): Spec => ({
      path: `/family-office/${city}`,
      rubric: (l) => str(get(readNs(l, "locations"), "Common.HubLabel")),
      sections: [{ ns: "locations", pick: `Cities.${city}` }],
    }),
  ),
  { path: "/platform", rubric: (l) => nav(l, "Platform"), sections: [{ ns: "platform", only: ["hero", "Faq"] }] },
  { path: "/advisers", rubric: (l) => (l === "fr" ? "Conseillers" : "Advisers"), sections: [{ ns: "advisers" }] },
  { path: "/contact", rubric: (l) => nav(l, "Contact"), sections: [{ ns: "contact", only: ["Title", "Subtitle", "Faq"] }] },
  { path: "/ressources", rubric: (l) => nav(l, "Ressources"), sections: [] },
  { path: "/legal/terms", rubric: () => "", sections: [{ ns: "legal", pick: "Terms" }] },
  { path: "/legal/privacy", rubric: () => "", sections: [{ ns: "legal", pick: "Privacy" }] },
  { path: "/legal/cookies", rubric: () => "", sections: [{ ns: "legal", pick: "Cookies" }] },
];

function articlePages(locale: PublicLocale): PublicPage[] {
  return getArticles(locale)
    .filter((a) => getValidLocalesForSlug(a.slug).includes(locale))
    .map((a): PublicPage => {
      const p = `/ressources/articles/${a.slug}`;
      return {
        path: p,
        locale,
        url: pageUrl(p, locale),
        title: a.title,
        rubric: nav(locale, "Ressources"),
        updated: a.updated ?? a.date,
        description: a.description ? clean(a.description) : undefined,
        body: () => [a.description ? clean(a.description) : "", "", absoluteLinks(a.content ?? "").trim()].join("\n").trim(),
      };
    });
}

const pagesCache = new Map<PublicLocale, PublicPage[]>();

/** Every public page of a locale: static pages, services, locations, then articles. */
export function publicPages(locale: PublicLocale): PublicPage[] {
  const cached = pagesCache.get(locale);
  if (cached) return cached;
  const statics = SPECS.map(
    (s): PublicPage => ({
      path: s.path,
      locale,
      url: pageUrl(s.path, locale),
      title: metaTitle(locale, s.path),
      description: metaDescription(locale, s.path),
      rubric: s.rubric(locale),
      body: () =>
        [metaDescription(locale, s.path), ...s.sections.map((x) => nsMarkdown(locale, x))].filter(Boolean).join("\n\n"),
    }),
  );
  const pages = [...statics, ...articlePages(locale)];
  pagesCache.set(locale, pages);
  return pages;
}

/* ---- Open Graph images ---- */

/** "/" -> "fr", "/services/digital-vault" -> "fr--services--digital-vault". */
export const ogKey = (locale: PublicLocale, p: string) => (p === "/" ? locale : `${locale}${p.replace(/\/+$/, "").replace(/\//g, "--")}`);

const shortHash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

let ogIndex: Map<string, PublicPage> | null = null;
export function ogPages(): Map<string, PublicPage> {
  if (ogIndex) return ogIndex;
  ogIndex = new Map(PUBLIC_LOCALES.flatMap((l) => publicPages(l).map((p) => [ogKey(l, p.path), p] as const)));
  return ogIndex;
}

/**
 * Share image of a page, or null when it has none (DE/ES/PT, pages outside
 * the sitemap): callers then keep the per-language image. The query string
 * changes with the title, so caches drop an outdated image.
 */
export function ogImageFor(locale: string, p: string): string | null {
  if (locale !== "fr" && locale !== "en") return null;
  const normalized = p === "/" ? "/" : p.replace(/\/+$/, "");
  const key = ogKey(locale, normalized);
  const page = ogPages().get(key);
  return page ? `/assets/og-pages/${key}.webp?v=${shortHash(page.title + page.rubric)}` : null;
}
