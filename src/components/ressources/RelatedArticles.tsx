import Link from "next/link";
import { getTranslationsRecord, type Locale } from "@/src/lib/i18n";

interface ArticleMeta {
  slug: string;
  title: string;
  description?: string;
  date?: string;
}

interface RessourcesJson {
  Articles: ArticleMeta[];
  RelatedArticles: string;
  ReadMore: string;
}

interface RelatedArticlesProps {
  currentSlug: string;
  locale: string;
  limit?: number;
}

// Simple similarity heuristic: same starting word cluster or shared keyword matches in title
function score(a: ArticleMeta, b: ArticleMeta): number {
  const at = a.title.toLowerCase();
  const bt = b.title.toLowerCase();
  let s = 0;
  // Shared first word
  const aw = at.split(/[^a-z0-9]+/)[0];
  const bw = bt.split(/[^a-z0-9]+/)[0];
  if (aw && bw && aw === bw) s += 3;
  // Keyword overlaps
  const stop = new Set([
    "the",
    "for",
    "and",
    "of",
    "in",
    "to",
    "a",
    "en",
    "et",
    "les",
    "des",
    "pour",
    "sur",
    "de",
  ]);
  const aset = new Set(
    at.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !stop.has(w))
  );
  const bset = new Set(
    bt.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !stop.has(w))
  );
  let overlap = 0;
  aset.forEach((w) => {
    if (bset.has(w)) overlap++;
  });
  s += Math.min(overlap, 5);
  return s;
}

export default function RelatedArticles({
  currentSlug,
  locale,
  limit = 3,
}: RelatedArticlesProps) {
  const raw = getTranslationsRecord((locale as Locale) || "fr", "ressources");
  const translations: RessourcesJson = {
    Articles: Array.isArray(raw["Articles"])
      ? (raw["Articles"] as ArticleMeta[])
      : [],
    RelatedArticles:
      typeof raw["RelatedArticles"] === "string"
        ? (raw["RelatedArticles"] as string)
        : "Related articles",
    ReadMore:
      typeof raw["ReadMore"] === "string"
        ? (raw["ReadMore"] as string)
        : "Read more",
  };
  const all: ArticleMeta[] = translations.Articles;
  const current = all.find((a) => a.slug === currentSlug);
  if (!current) return null;
  const scored = all
    .filter((a) => a.slug !== currentSlug)
    .map((a) => ({ a, s: score(current, a) }));
  scored.sort(
    (x, y) => y.s - x.s || (y.a.date || "").localeCompare(x.a.date || "")
  );
  const related = scored
    .filter((r) => r.s > 0)
    .map((r) => r.a)
    .concat(scored.filter((r) => r.s === 0).map((r) => r.a))
    .slice(0, limit);
  if (related.length === 0) return null;
  return (
    <section className="mt-16" aria-labelledby="related-articles-heading">
      <h2 id="related-articles-heading" className="text-2xl font-semibold mb-6">
        {translations.RelatedArticles || "Related articles"}
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((r) => (
          <article
            key={r.slug}
            className="rounded-lg bg-surface-warm/55 p-4 shadow-sm transition-colors hover:bg-card"
          >
            <h3 className="font-medium text-lg mb-2">
              <Link
                href={`/${locale}/ressources/articles/${r.slug}/`}
                className="hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded-sm"
              >
                {r.title}
              </Link>
            </h3>
            {r.description && (
              <p className="text-sm text-muted-foreground line-clamp-4">
                {r.description}
              </p>
            )}
            <div className="mt-3">
              <Link
                href={`/${locale}/ressources/articles/${r.slug}/`}
                className="text-primary text-sm font-medium hover:underline"
                aria-label={`${translations.ReadMore || "Read more"}: ${
                  r.title
                }`}
              >
                {(translations.ReadMore || "Read more") + `: ${r.title}`}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
