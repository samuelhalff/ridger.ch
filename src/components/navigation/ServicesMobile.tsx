"use client";
import ServicesElements from "@/app/[locale]/navigation";
import { buildInternalUrl } from "@/src/lib/paths";
import type { Locale } from "@/src/lib/i18n-locales";
import Link from "next/link";

interface ServicesMobileProps {
  onLinkClick?: () => void;
}

export default function ServicesMobile({
  onLinkClick,
  locale,
  services,
  label,
}: ServicesMobileProps & {
  locale?: string;
  services?: Array<{ href: string; title: string }>;
  label?: string;
}) {
  const currentLocale = (locale || "fr") as Locale;
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

  return (
    <div>
      <div className="flex items-center gap-3 rounded bg-surface-warm px-2 py-2 text-md font-medium shadow-sm">
        <span>{label || "Services"}</span>
      </div>
      <div className="mt-2 flex flex-col gap-1 overflow-hidden rounded-md">
        {items.map((service) => (
          <Link
            key={service.href}
            href={
              service.href.startsWith(`/${currentLocale}/`)
                ? normalizeHref(service.href)
                : buildInternalUrl(normalizeHref(service.href), currentLocale)
            }
            prefetch={false}
            onClick={onLinkClick}
            locale={locale}
            className="flex items-center justify-between gap-3 text-md px-4 py-3 hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            <span className="block truncate" title={service.title}>
              {service.title}
            </span>
            <span aria-hidden className="text-muted-foreground">
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
