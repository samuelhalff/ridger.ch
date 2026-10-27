"use client";
import ServicesElements from "@/app/[locale]/navigation";
import { buildInternalUrl } from "@/src/lib/paths";
import { locales, type Locale } from "@/src/lib/i18n-locales";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ServicesMobileProps {
  onLinkClick?: () => void;
}

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

// Path key for "is this the current page": ignores query/hash, encoding,
// a leading supported-locale segment and trailing slashes, so the unprefixed
// default-locale URL and its /fr/ form compare equal.
export function normalizePath(p: string) {
  let out = p.split(/[?#]/)[0] || "";
  try {
    out = decodeURI(out);
  } catch {
    /* keep raw */
  }
  out = out.replace(LOCALE_PREFIX, "");
  return out.replace(/\/+$/, "") || "/";
}

export default function ServicesMobile({
  onLinkClick,
  locale,
  services,
  label,
  allLabel,
}: ServicesMobileProps & {
  locale?: string;
  services?: Array<{ href: string; title: string }>;
  label?: string;
  allLabel?: string;
}) {
  const currentLocale = (locale || "fr") as Locale;
  const pathname = normalizePath(usePathname() || "");
  const items = (
    services && services.length
      ? services
      : ServicesElements.map((s) => ({ href: s.href, title: s.titleKey }))
  ) as Array<{
    href: string;
    title: string;
  }>;

  function normalizeHref(href: string) {
    if (!href) return href;
    href = href.replace(/\/services\/services(\/|$)/, "/services/$1");
    href = href.replace(/([^:])\/+/g, "$1/");
    return href;
  }

  const links = items.map((service) => ({
    title: service.title,
    href: service.href.startsWith(`/${currentLocale}/`)
      ? normalizeHref(service.href)
      : buildInternalUrl(normalizeHref(service.href), currentLocale),
  }));
  const hubHref = buildInternalUrl("/services", currentLocale);
  const isCurrent = (href: string) => normalizePath(href) === pathname;
  // On a service page (or the hub) the list starts open so the visitor sees where they are.
  const inServices =
    isCurrent(hubHref) || links.some((l) => isCurrent(l.href));

  return (
    <li>
      {/* Native disclosure: keyboard and screen-reader accessible; links stay in the DOM when closed. */}
      <details className="group border-b" open={inServices}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-2 py-3 text-md font-bold transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span>{label || "Services"}</span>
          <span
            aria-hidden
            className="text-xl font-normal leading-none text-accent transition-transform duration-200 group-open:rotate-45"
          >
            +
          </span>
        </summary>
        <ul className="pb-3">
          {links.map((service) => (
            <li key={service.href}>
              <Link
                href={service.href}
                prefetch={false}
                onClick={onLinkClick}
                locale={locale}
                aria-current={isCurrent(service.href) ? "page" : undefined}
                className="flex min-h-11 items-center px-4 py-2 text-md transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:font-medium aria-[current=page]:text-accent"
              >
                {service.title}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={hubHref}
              prefetch={false}
              onClick={onLinkClick}
              locale={locale}
              aria-current={isCurrent(hubHref) ? "page" : undefined}
              className="flex min-h-11 items-center px-4 py-2 text-sm font-medium text-accent underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:underline"
            >
              {allLabel || "All services"}
            </Link>
          </li>
        </ul>
      </details>
    </li>
  );
}
