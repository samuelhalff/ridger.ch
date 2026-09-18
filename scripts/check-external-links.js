/**
 * Check external links for 4xx errors, empty pages, or error page content.
 *
 * Usage:
 *   node scripts/check-external-links.js < url-list.txt   (one URL per line)
 *   node scripts/check-external-links.js https://example.com/foo https://example.com/bar
 *
 * Returns JSON lines with: { url, status, ok, error?, contentType?, contentLength?, snippet? }
 * A link is "ok" when: HTTP 200/301/302 AND not a 404-style page body.
 */

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
const MAX_BODY_SAMPLE = 2000;

// Patterns that indicate a page is a 404/error/empty page regardless of HTTP status
const ERROR_PATTERNS = [
  /\b404\b/i,
  /\bnot found\b/i,
  /\bpage not found\b/i,
  /\bpage introuvable\b/i,
  /\bpas trouvé\b/i,
  /\bnon trouvé\b/i,
  /\bseite nicht gefunden\b/i,
  /\bnicht gefunden\b/i,
  /\bpágina no encontrada\b/i,
  /\bno encontrada\b/i,
  /\bno encontrado\b/i,
  /\bpágina não encontrada\b/i,
  /\bnencontrada\b/i,
  /\bnencontrado\b/i,
  /\bmanquant\b/i,
  /\bmissing\b/i,
  /\bfehler\b/i,
  /\berreur\b/i,
  /\berror\b/i,
  /\bno content\b/i,
  /\bpage vide\b/i,
  /\bleere seite\b/i,
  /\bpágina vacía\b/i,
  /\bpágina vazia\b/i,
  /does\s+not\s+exist/i,
  /n'existe\s+pas/i,
  /existe\s+pas/i,
  /existiert\s+nicht/i,
  /no\s+existe/i,
  /não\s+existe/i,
  /el\s+recurso\s+solicitado\s+no/i,
];

const fetchWithRedirect = async (url, redirectCount = 0) => {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error(`too_many_redirects (${redirectCount})`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArkFidLinkChecker/1.0; +https://ridger.ch)",
        Accept: "text/html,application/xhtml+xml,application/pdf,text/plain,*/*",
      },
    });

    const status = res.status;
    const location = res.headers.get("location");

    // Follow redirects
    if (status >= 301 && status <= 308 && location) {
      clearTimeout(timeout);
      const resolvedUrl = new URL(location, url).href;
      return fetchWithRedirect(resolvedUrl, redirectCount + 1);
    }

    // Read body
    const contentType = res.headers.get("content-type") || "";
    const isText =
      contentType.includes("text/") ||
      contentType.includes("application/json") ||
      contentType.includes("application/xml") ||
      contentType.includes("application/pdf") ||
      !contentType;

    let body = "";
    let contentLength = 0;

    if (isText) {
      const reader = res.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let total = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          body += chunk;
          total += value.length;
          if (total > MAX_BODY_SAMPLE) break;
        }
        contentLength = total;
        // Try to get full content length from header
        const cl = res.headers.get("content-length");
        if (cl) contentLength = Math.max(contentLength, parseInt(cl, 10));
      }
    }

    clearTimeout(timeout);
    return { status, contentType, contentLength, body, location };
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
};

const checkUrl = async (url) => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const { status, contentType, contentLength, body } =
      await fetchWithRedirect(trimmed);

    // Check HTTP status
    const isHttpOk = status >= 200 && status < 400;

    // Check for error page content
    let errorMatch = null;
    if (body) {
      const clean = body
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_BODY_SAMPLE);

      for (const pattern of ERROR_PATTERNS) {
        const match = clean.match(pattern);
        if (match) {
          errorMatch = match[0];
          break;
        }
      }
    }

    const ok = isHttpOk && !errorMatch && contentLength > 0;
    const snippet = errorMatch
      ? `Error pattern matched: "${errorMatch}"`
      : body
        ? body
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 200)
        : "(empty body)";

    return {
      url: trimmed,
      status,
      ok,
      error: !ok
        ? errorMatch
          ? `body_error:${errorMatch}`
          : `http_${status}`
        : undefined,
      contentType: contentType.slice(0, 80),
      contentLength,
      snippet,
    };
  } catch (err) {
    return {
      url: trimmed,
      status: 0,
      ok: false,
      error: err.message || "unknown_error",
    };
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  let urls;

  if (args.length === 0) {
    // Read from stdin
    const stdin = await new Promise((resolve) => {
      let data = "";
      process.stdin.setEncoding("utf-8");
      process.stdin.on("data", (chunk) => (data += chunk));
      process.stdin.on("end", () => resolve(data));
    });
    urls = stdin
      .split(/[\n\r]+/)
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !l.startsWith("#") && !l.startsWith("//"));
  } else {
    urls = args;
  }

  const results = [];
  for (let i = 0; i < urls.length; i++) {
    const result = await checkUrl(urls[i]);
    if (result) {
      results.push(result);
      const icon = result.ok ? "✓" : "✗";
      process.stderr.write(
        `[${icon}] [${result.status}] ${result.url.slice(0, 120)}${result.error ? " — " + result.error : ""}\n`
      );
    }
  }

  console.log(JSON.stringify(results, null, 2));
};

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
