"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { withTrailingSlash } from "@/src/lib/paths";

const LANGS = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "de", label: "DE" },
  { code: "es", label: "ES" },
  { code: "pt", label: "PT" },
];

interface LangSwitchMobileProps {
  onLocaleChange?: () => void;
}

export default function LangSwitchMobile({
  onLocaleChange,
}: LangSwitchMobileProps) {
  // determine current language from URL path to avoid hydration mismatch
  const pathname = usePathname() || "/";
  const current = (
    pathname.replace(/^\/+|\/+$/g, "").split("/")[0] || "fr"
  ).slice(0, 2);
  const searchParams = useSearchParams();

  function buildHref(targetLocale: string) {
    const parts = pathname.replace(/^\/+|\/+$/g, "").split("/");
    const valid = ["en", "fr", "de", "es", "pt"];
    if (valid.includes(parts[0])) parts[0] = targetLocale;
    else parts.unshift(targetLocale);
    const qs = searchParams?.toString();
    const path = withTrailingSlash(`/${parts.join("/")}`);
    return `${path}${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex items-center">
      <span className="flex items-center gap-3 p-2">Language</span>
      <div className="flex gap-3 text-md p-1 ml-auto">
        {LANGS.filter((l) => l.code !== current).map((lang) => {
          const href = buildHref(lang.code);
          return (
            <Link
              key={lang.code}
              href={href}
              prefetch={false}
              hrefLang={lang.code}
              rel="alternate"
              aria-label={lang.label}
              onClick={() => onLocaleChange && onLocaleChange()}
              className={`p-3.5 rounded text-sm font-medium ${
                current === lang.code ? "bg-accent" : ""
              }`}
            >
              {lang.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
