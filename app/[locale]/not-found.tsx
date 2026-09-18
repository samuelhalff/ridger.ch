import Link from "next/link";
import { headers } from "next/headers";
import ServicesElements from "@/app/[locale]/navigation";
import { getTranslations, getCurrentLocale, type Locale } from "@/src/lib/i18n";

// We import ressources per-locale dynamically using a small map because Next.js cannot import using a runtime variable path at build time.
import frJSON from "@/src/translations/fr/ressources.json";
import enJSON from "@/src/translations/en/ressources.json";
import deJSON from "@/src/translations/de/ressources.json";
import esJSON from "@/src/translations/es/ressources.json";
import ptJSON from "@/src/translations/pt/ressources.json";

type Article = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
};
type LocaleRes = { Articles?: Article[] };

const byLocale: Record<Locale, LocaleRes> = {
  fr: frJSON as LocaleRes,
  en: enJSON as LocaleRes,
  de: deJSON as LocaleRes,
  es: esJSON as LocaleRes,
  pt: ptJSON as LocaleRes,
};

export default async function NotFoundPage() {
  const locale = await getCurrentLocale();
  const nonce = (await headers()).get("x-nonce") || undefined;
  const res = byLocale[locale] || (frJSON as unknown as LocaleRes);
  const suggestions = [...(res.Articles || [])]
    .sort((a, b) => {
      return (b.date || "").localeCompare(a.date || "");
    })
    .slice(0, 4);

  // Services list with SSR translations
  const tItems = await getTranslations(locale, "servicesItems");
  const services = ServicesElements.slice(0, 6).map((s) => ({
    href: `/${locale}${s.href}`,
    title: tItems(s.titleKey),
    description: tItems(s.descriptionKey),
    icon: s.icon,
  }));

  const localePrefix = `/${locale}`;

  return (
    <main
      id="main-content"
      className="max-w-[var(--breakpoint-xl)] mx-auto px-6 py-16"
    >
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link
              href={`${localePrefix}/`}
              prefetch={false}
              className="hover:underline"
            >
              {locale === "fr"
                ? "Accueil"
                : locale === "de"
                ? "Startseite"
                : locale === "es"
                ? "Inicio"
                : locale === "pt"
                ? "Início"
                : "Home"}
            </Link>
          </li>
          <li aria-hidden>›</li>
          <li aria-current="page">404</li>
        </ol>
      </nav>
      <div className="text-center mb-10">
        <p className="text-8xl font-black tracking-tight text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-semibold">
          {locale === "fr"
            ? "Page introuvable"
            : locale === "de"
            ? "Seite nicht gefunden"
            : locale === "es"
            ? "Página no encontrada"
            : locale === "pt"
            ? "Página não encontrada"
            : "Page not found"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {locale === "fr"
            ? "La page demandée n'existe pas ou a été déplacée. Voici des articles susceptibles de vous intéresser :"
            : locale === "en"
            ? "The page you were looking for doesn't exist. You may find these articles helpful:"
            : locale === "de"
            ? "Die gesuchte Seite existiert nicht. Diese Artikel könnten für Sie interessant sein:"
            : locale === "es"
            ? "La página que buscabas no existe. Estos artículos pueden interesarte:"
            : "A página que você procura não existe. Estes artigos podem ser úteis:"}
        </p>
      </div>

      {suggestions.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((a) => (
            <Link
              key={a.slug}
              href={`${localePrefix}/ressources/articles/${a.slug}/`}
              className="group rounded-lg bg-card p-4 shadow-sm transition-colors hover:bg-surface-warm"
              prefetch={false}
            >
              <h3 className="font-semibold group-hover:underline">{a.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {a.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm text-brand-hover dark:text-brand mt-3">
                {locale === "fr"
                  ? "Lire l'article"
                  : locale === "de"
                  ? "Artikel lesen"
                  : locale === "es"
                  ? "Leer el artículo"
                  : locale === "pt"
                  ? "Ler o artigo"
                  : "Read article"}
                →
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Popular services */}
      <section aria-labelledby="services-heading" className="mt-12">
        <h2 id="services-heading" className="text-xl font-semibold mb-4">
          {locale === "fr"
            ? "Nos services"
            : locale === "de"
            ? "Unsere Dienstleistungen"
            : locale === "es"
            ? "Nuestros servicios"
            : locale === "pt"
            ? "Nossos serviços"
            : "Our services"}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <li key={s.href} className="">
              <Link
                href={s.href}
                prefetch={false}
                className="flex items-start gap-3 rounded-md bg-surface-warm/55 p-3 shadow-sm hover:bg-accent"
              >
                <span aria-hidden>{s.icon}</span>
                <span>
                  <span className="block font-medium">{s.title}</span>
                  <span className="block text-sm text-muted-foreground line-clamp-2">
                    {s.description}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Search box */}
      <section aria-labelledby="search-heading" className="mt-12">
        <h2 id="search-heading" className="text-xl font-semibold mb-3">
          {locale === "fr"
            ? "Rechercher"
            : locale === "de"
            ? "Suchen"
            : locale === "es"
            ? "Buscar"
            : locale === "pt"
            ? "Pesquisar"
            : "Search"}
        </h2>
        {/* Search form removed per UX simplification request */}
      </section>

      <div className="mt-10 text-center">
        <Link
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          href={`${localePrefix}/`}
          prefetch={false}
        >
          {locale === "fr"
            ? "Retour à l'accueil"
            : locale === "de"
            ? "Zurück zur Startseite"
            : locale === "es"
            ? "Volver al inicio"
            : locale === "pt"
            ? "Voltar ao início"
            : "Back to home"}
        </Link>

        <div className="mt-4">
          <Link
            className="text-sm text-muted-foreground hover:underline"
            href={`${localePrefix}/ressources/articles/`}
            prefetch={false}
          >
            {locale === "fr"
              ? "Voir tous les articles"
              : locale === "de"
              ? "Alle Artikel ansehen"
              : locale === "es"
              ? "Ver todos los artículos"
              : locale === "pt"
              ? "Ver todos os artigos"
              : "Browse all articles"}
          </Link>
        </div>
      </div>

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name:
                  locale === "fr"
                    ? "Accueil"
                    : locale === "de"
                    ? "Startseite"
                    : locale === "es"
                    ? "Inicio"
                    : locale === "pt"
                    ? "Início"
                    : "Home",
                item: `https://ridger.ch/${locale}/`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "404",
                item: `https://ridger.ch/${locale}/404`,
              },
            ],
          }),
        }}
      />
    </main>
  );
}
