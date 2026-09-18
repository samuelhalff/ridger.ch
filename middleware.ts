import { NextRequest, NextResponse } from "next/server";
import { locales } from "./src/lib/i18n-locales";

type SecurityHeaderOptions = {
  nonce: string;
  csp: string;
  isProd: boolean;
  noIndex: boolean;
};

function applySecurityHeaders(
  response: NextResponse,
  { nonce, csp, isProd, noIndex }: SecurityHeaderOptions,
) {
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );
  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  if (noIndex) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProd = process.env.NODE_ENV === "production";
  // Generate a per-request nonce for CSP
  const nonce = isProd
    ? (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`)
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 32)
    : "";
  const host = request.headers.get("host") || "";
  const shouldNoIndex =
    request.nextUrl.search.length > 0 ||
    pathname.includes("/opengraph-image") ||
    pathname.includes("/twitter-image");

  if (isProd && host.startsWith("www.")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.hostname = host.replace(/^www\./, "");
    redirectUrl.protocol = "https";
    const response = NextResponse.redirect(redirectUrl, 308);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Normalize locale-prefixed requests for common root assets (e.g. /en/favicon.png -> /favicon.png)
  const staticRootAsset = pathname.match(
    /^\/[a-z]{2}\/(favicon\.(?:png|ico|svg)|apple-touch-icon\.png|site\.webmanifest|manifest\.webmanifest)$/,
  );
  if (staticRootAsset) {
    const target = "/" + staticRootAsset[1];
    return NextResponse.rewrite(new URL(target, request.url));
  }

  // CSP: strict in production, relaxed in development for Next.js dev client
  const cspDirectives = (
    isProd
      ? [
          `default-src 'self'`,
          // Nonce-based inline scripts
          `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://maps.googleapis.com https://maps.gstatic.com`,
          `script-src-attr 'none'`,
          // Allow inline styles for Tailwind and Next styles
          `style-src 'self' 'unsafe-inline'`,
          `font-src 'self' data:`,
          `connect-src 'self' https: https://vitals.vercel-analytics.com https://api.formspark.io`,
          // Allow embedding Google Maps iframe & required map tiles/images
          `frame-src 'self' https://www.google.com https://maps.google.com https://maps.gstatic.com https://challenges.cloudflare.com`,
          // Some map assets & JS served from these
          `img-src 'self' data: blob: https: https://maps.gstatic.com https://maps.googleapis.com`,
          `frame-ancestors 'self'`,
          `base-uri 'self'`,
          `form-action 'self' https://api.formspark.io`,
          `object-src 'none'`,
        ]
      : [
          `default-src 'self'`,
          // Relax for dev: allow eval for source maps and dev client scripts
          `script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https:`,
          `style-src 'self' 'unsafe-inline'`,
          `img-src 'self' data: blob: https: https://maps.gstatic.com https://maps.googleapis.com`,
          `font-src 'self' data:`,
          // Allow HMR/WebSocket in dev
          `connect-src 'self' http: https: ws: wss: https://vitals.vercel-analytics.com`,
          `frame-src 'self' https://www.google.com https://maps.google.com https://maps.gstatic.com https://challenges.cloudflare.com`,
          `frame-ancestors 'self'`,
          `base-uri 'self'`,
          `form-action 'self' https://api.formspark.io`,
          `object-src 'none'`,
        ]
  ).join("; ");
  // Allow Google's Trusted Types policy name used by Maps/Platform scripts
  const trustedTypesDirective = `trusted-types nextjs#bundler goog#html 'allow-duplicates'`;
  const csp = `${cspDirectives}; ${trustedTypesDirective}`;

  // Guardrails for malformed URLs that have shown up in Google Search Console.
  // These mostly come from broken markdown link syntax accidentally emitted in article content.
  // Examples:
  // - /[team](/team)
  // - /services/[taxes](/services/taxes)
  // - /$/
  // - /pt/family-office/ (legacy path)
  {
    const localePrefixMatch = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
    const localeFromPath =
      localePrefixMatch && locales.includes(localePrefixMatch[1] as any)
        ? localePrefixMatch[1]
        : null;

    const effectiveLocale = localeFromPath || getLocale(request);
    const localePrefix = `/${effectiveLocale}`;
    const rest = localeFromPath ? pathname.slice(3) || "/" : pathname;
    const restNoTrailingSlash =
      rest.length > 1 && rest.endsWith("/") ? rest.slice(0, -1) : rest;

    const redirectWithHeaders = (targetPath: string) => {
      const redirectUrl = new URL(targetPath, request.url);
      redirectUrl.search = request.nextUrl.search;
      const response = NextResponse.redirect(redirectUrl, 308);
      response.headers.set("x-pathname", pathname);
      applySecurityHeaders(response, { nonce, csp, isProd, noIndex: shouldNoIndex });
      // Always noindex redirects to avoid "Page with redirect" indexing noise.
      if (!response.headers.has("X-Robots-Tag")) {
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
      }
      return response;
    };

    const goneWithHeaders = () => {
      const response = new NextResponse("Gone", { status: 410 });
      response.headers.set("x-pathname", pathname);
      applySecurityHeaders(response, { nonce, csp, isProd, noIndex: false });
      response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
      response.headers.set("X-Robots-Tag", "noindex, nofollow");
      return response;
    };

    // Normalize /$/ -> locale home
    if (restNoTrailingSlash === "/$") {
      return redirectWithHeaders(`${localePrefix}/`);
    }

    // Legacy path normalization: /<locale>/family-office/ -> /<locale>/services/family-office/
    if (restNoTrailingSlash === "/family-office") {
      return redirectWithHeaders(`${localePrefix}/services/family-office/`);
    }

    // Hard-fail markdown-style bracketed link paths.
    // These URLs are malformed crawl junk and should not remain redirectable.
    const mdPathMatch = restNoTrailingSlash.match(
      /^\/(?:services\/)?\[[^\]]+\]\((\/[^)]+)\)$/,
    );
    if (mdPathMatch) {
      return goneWithHeaders();
    }
  }

  // Check if the path already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    // Extract locale and set it in headers for the pages to use
    const locale = pathname.split("/")[1];

    // Check if we need to add trailing slash to prevent redirect chains
    // When trailingSlash: true is set in next.config.js, URLs without trailing slash
    // would cause Next.js to redirect, creating "Page with redirect" issues in GSC
    // Skip for: file extensions, opengraph-image routes, API-like paths
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
    const isSpecialRoute =
      pathname.includes("/opengraph-image") ||
      pathname.includes("/twitter-image");
    const needsTrailingSlash =
      pathname !== `/${locale}` &&
      !pathname.endsWith("/") &&
      !hasFileExtension &&
      !isSpecialRoute;

    if (needsTrailingSlash) {
      // Redirect to trailing slash version to avoid double redirect
      const targetPath = `${pathname}/`;
      const redirectUrl = new URL(targetPath, request.url);
      redirectUrl.search = request.nextUrl.search;
      const response = NextResponse.redirect(redirectUrl, 308);
      applySecurityHeaders(response, { nonce, csp, isProd, noIndex: shouldNoIndex });
      if (!response.headers.has("X-Robots-Tag")) {
        response.headers.set("X-Robots-Tag", "noindex, nofollow");
      }
      return response;
    }

    // Propagate request headers so Server Components can read them via headers()
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", locale);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-nonce", nonce);
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    // Also mirror on response for observability/debugging in the browser
    response.headers.set("x-locale", locale);
    // Expose the pathname to server components for active nav styling
    response.headers.set("x-pathname", pathname);
    // Security headers
    applySecurityHeaders(response, { nonce, csp, isProd, noIndex: shouldNoIndex });
    return response;
  }

  // If no locale in the path, redirect to the path with detected locale
  const locale = getLocale(request);
  // Ensure we redirect directly to the trailing-slash URL to avoid redirect chains
  // when `trailingSlash: true` is enabled in next.config.js.
  let targetPath = `/${locale}${pathname}`;
  if (!targetPath.endsWith("/")) {
    targetPath += "/";
  }
  const redirectUrl = new URL(targetPath, request.url);
  // Preserve query parameters (e.g. ?utm_source=..., ?articles=43)
  redirectUrl.search = request.nextUrl.search;
  // Use 308 permanent redirect for SEO - tells search engines not to index non-locale URLs
  const response = NextResponse.redirect(redirectUrl, 308);
  response.headers.set("x-pathname", pathname);
  response.headers.set("Vary", "Accept-Language");
  applySecurityHeaders(response, { nonce, csp, isProd, noIndex: shouldNoIndex });
  // Removed report-only header
  if (!response.headers.has("X-Robots-Tag")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function getLocale(request: NextRequest): string {
  // Check the accept-language header
  const acceptLanguage = request.headers.get("accept-language");

  if (acceptLanguage) {
    // Parse the accept-language header to find the best match
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim())
      .map((lang) => lang.split("-")[0]); // Get main language code

    for (const lang of languages) {
      if (locales.includes(lang as any)) {
        return lang;
      }
    }
  }

  // Default to French
  return "fr";
}

export const config = {
  // Skip only internal/static paths that should not be internationalized
  // Allow `ressources` and other content routes to be redirected to /<locale>/...
  matcher: [
    "/((?!_next|api|assets|\\.well-known|favicon.ico|favicon.png|favicon.svg|apple-touch-icon.png|site.webmanifest|manifest.webmanifest|robots.txt|sitemap|sitemap.xml|sitemap_index.xml|browserconfig.xml|BingSiteAuth.xml|.*.txt).*)",
  ],
};
