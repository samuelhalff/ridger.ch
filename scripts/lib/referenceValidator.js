// Curated source policy for public article references.
//
// Goal: use competitors and firms as private research inspiration when useful,
// but never publish their URLs as sources. Public references should point to
// official authorities, institutional bodies, recognized associations, academic
// sources, or official product/vendor documentation such as odoo.com.
//
// Any domain NOT on this list (or added at runtime via
// REFERENCE_ALLOWED_DOMAINS) is rejected. The built-in firm blocklist below
// still wins over runtime additions, so known firm/competitor domains cannot be
// reintroduced accidentally in CI.
//
// Categories:
//   - Swiss federal government (admin.ch and subdomains)
//   - Swiss portal (ch.ch)
//   - All 26 Swiss cantonal domains
//   - Swiss official bodies & registries
//   - Social insurance organisations
//   - Professional & industry associations
//   - International knowledge / reference sites
//   - Recognized software / vendor documentation
//   - Self-reference (ridger.ch)
//   - Academic / educational institutions
//
// Explicitly excluded:
//   - Fiduciaries, accounting firms, Treuhand firms
//   - Consulting firms, Odoo integrators, law/notary firms
//   - Big 4 or other competitors, even when their content is useful research
//
// Keep alphabetically sorted within each section for easy maintenance.
const ALLOWED_REFERENCE_DOMAINS = [
  // Swiss federal government (covers all *.admin.ch subdomains)
  "admin.ch",
  // Swiss portal
  "ch.ch",
  // Swiss cantons (all 26)
  "ag.ch",
  "ai.ch",
  "ar.ch",
  "be.ch",
  "bl.ch",
  "bs.ch",
  "fr.ch",
  "ge.ch",
  "gl.ch",
  "gr.ch",
  "ju.ch",
  "lu.ch",
  "ne.ch",
  "nw.ch",
  "ow.ch",
  "sg.ch",
  "sh.ch",
  "so.ch",
  "sz.ch",
  "tg.ch",
  "ti.ch",
  "ur.ch",
  "vd.ch",
  "vs.ch",
  "zg.ch",
  "zh.ch",
  // Swiss official bodies & registries
  "ahv-iv.ch",
  "caisseavs.ch",
  "centrepatronal.ch",
  "entscheidsuche.ch",
  "expertsuisse.ch",
  "finma.ch",
  "ocas.ch",
  "rab-asr.ch",
  "snb.ch",
  "so-fit.ch",
  "swissdec.ch",
  "zefix.ch",
  // Swiss cantonal social insurance / compensation funds
  "aknw.ch",
  "akso.ch",
  "cdas.ch",
  "jardinsuisse.ch",
  "sva-bl.ch",
  "sva-sz.ch",
  "svash.ch",
  // Professional & industry associations
  "amsuisse.ch",
  "ccig.ch",
  "economiesuisse.ch",
  "fer.ch",
  "swissaccounting.org",
  "swissmem.ch",
  "veb.ch",
  // International knowledge / reference
  "europa.eu",
  "francophonie.org",
  "oecd.org",
  "wikipedia.org",
  // Recognized software / vendor documentation
  "github.com",
  "odoo.com",
  // Academic / educational
  "controledegestion.org",
  "he-arc.ch",
  "houle.ai",
  // Self-reference and sibling properties (same owner)
  "ridger.ch",
  "episto.ch",
];

const DISALLOWED_FIRM_SOURCE_DOMAINS = [
  "aag-fiduciaire.ch",
  "aapartnertreuhand.ch",
  "aaretax.ch",
  "acctive.ch",
  "ackermann-treuhand.ch",
  "adbtax.ch",
  "agfiduciaire.ch",
  "alltax.ch",
  "balmer-etienne.ch",
  "bbtreuhand.ch",
  "bdo.ch",
  "berneyassocies.com",
  "calliopee.ch",
  "caminada.com",
  "cobalt-it.ch",
  "cofidest-swiss-audit.ch",
  "cofidest.ch",
  "core-partner.ch",
  "deloitte.ch",
  "dlg.ch",
  "entreprendre.ch",
  "eurexsuisse.com",
  "ey.com",
  "fbk-conseils.ch",
  "fg-fiduciaire.ch",
  "ficops.ch",
  "fidag-sa.ch",
  "fidflow.ch",
  "fidinam.com",
  "fiduciaire-rutz-menger.ch",
  "fiducom.ch",
  "fidulex.ch",
  "fidurolle.ch",
  "financialkeepers.ch",
  "findea.ch",
  "finwise.ch",
  "ftrust.ch",
  "gaapex.ch",
  "grantthornton.ch",
  "grf-societe-fiduciaire.ch",
  "gtf.ch",
  "hoop.swiss",
  "karpeo.ch",
  "kaurum.com",
  "kendris.com",
  "kpmg.ch",
  "liberal-vd.ch",
  "mazars.ch",
  "mm-t.ch",
  "nexova.ch",
  "niris.ch",
  "obt.ch",
  "omnitax.ch",
  "open-net.ch",
  "pkf.swiss",
  "pwc.ch",
  "retax.ch",
  "rister.ch",
  "rnptreuhand.ch",
  "roux-associes.ch",
  "safe-fiduciaire.ch",
  "swissdomiciliation.ch",
  "tax-services.ch",
  "taxpartner.ch",
  "treuco.ch",
  "wadsack.ch",
  "y-fiduciaire.ch",
  "zuffereypanigas.ch",
];

const DEFAULT_TIMEOUT_MS = parseInt(process.env.LINK_CHECK_TIMEOUT_MS || "10000", 10);
const DEFAULT_MIN_BYTES = parseInt(process.env.LINK_CHECK_MIN_BYTES || "600", 10);

// Patterns that indicate a page has no real content (placeholder, error, empty shell)
const EMPTY_CONTENT_PATTERNS = [
  /coming\s+soon/i,
  /under\s+construction/i,
  /page\s+not\s+found/i,
  /404\s+not\s+found/i,
  /<body[^>]*>\s*<\/body>/i,
  /^\s*$/,
];
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (compatible; ResourceValidator/1.0)";

// Trusted source domains (less strict validation)
const TRUSTED_DOMAINS = [
  "admin.ch",
  "fedlex.admin.ch",
  "kmu.admin.ch",
  "ch.ch",
  "ge.ch",
  "vd.ch",
  "zh.ch",
  "be.ch",
  "ti.ch",
  "bfs.admin.ch",
  "estv.admin.ch",
  "finma.ch",
  "seco.admin.ch",
  "odoo.com",
  "so-fit.ch",
  "swissdec.ch",
  "rab-asr.ch",
  "zefix.ch",
  "fer.ch",
  "economiesuisse.ch",
  "github.com",
  "wikipedia.org"
];

function parseDomainList(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// Runtime-extended allowlist: merge the built-in list with any domains added
// via the REFERENCE_ALLOWED_DOMAINS environment variable (comma-separated).
const ALLOWED_DOMAINS = Array.from(
  new Set([
    ...ALLOWED_REFERENCE_DOMAINS,
    ...parseDomainList(process.env.REFERENCE_ALLOWED_DOMAINS),
  ])
);

// Optional explicit blocklist via environment variable. Domains listed here are
// rejected even if they appear in the allowlist. The built-in firm-source
// blocklist is always active.
const BLOCKED_DOMAINS = Array.from(
  new Set([
    ...DISALLOWED_FIRM_SOURCE_DOMAINS,
    ...parseDomainList(process.env.REFERENCE_BLOCKED_DOMAINS),
  ]),
);

function isBlockedDomain(url, extraBlocked = []) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const blockedDomains = Array.from(
      new Set([
        ...BLOCKED_DOMAINS,
        ...(Array.isArray(extraBlocked) ? extraBlocked : []),
      ]),
    );
    // Explicit/built-in blocklists take priority over all allowlist entries.
    if (
      blockedDomains.length > 0 &&
      blockedDomains.some((d) => host === d || host.endsWith(`.${d}`))
    ) {
      return true;
    }
    // Whitelist approach: allow only domains in the allowed list
    return !ALLOWED_DOMAINS.some(
      (d) => host === d || host.endsWith(`.${d}`),
    );
  } catch {
    return true;
  }
}

// Domains that serve an identical 200 SPA shell for every path (even dead
// ones), making link liveness impossible to verify over plain HTTP. Confirmed
// for www.ch.ch on 2026-09-11: dead and live paths return byte-identical HTML
// to non-browser clients; only a JS-rendering client sees the real 404.
const UNVERIFIABLE_SPA_DOMAINS = ["ch.ch"];

function isUnverifiableSpaDomain(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return UNVERIFIABLE_SPA_DOMAINS.some(
      (d) => host === d || host.endsWith(`.${d}`),
    );
  } catch {
    return false;
  }
}

/**
 * Check if a domain is in the trusted list
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isTrustedDomain(url) {
  try {
    const { hostname } = new URL(url);
    return TRUSTED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Extract domain from URL for deduplication
 * @param {string} url - URL to extract domain from
 * @returns {string|null} Domain or null if invalid
 */
function extractDomain(url) {
  try {
    const { hostname } = new URL(url);
    const lower = hostname.toLowerCase();
    // For Swiss institutional sites, different subdomains often represent
    // different authorities (e.g., bsv.admin.ch vs estv.admin.ch). Treat
    // the full hostname as the deduplication key.
    const multiTenantRoots = [
      "admin.ch",
      "ge.ch",
      "vd.ch",
      "zh.ch",
      "be.ch",
      "ti.ch",
    ];
    if (
      multiTenantRoots.some((root) => lower === root || lower.endsWith(`.${root}`))
    ) {
      return lower;
    }

    // Default: base domain (e.g., "example.com" from "www.example.com")
    const parts = lower.split(".");
    if (parts.length >= 2) return parts.slice(-2).join(".");
    return lower;
  } catch {
    return null;
  }
}

/**
 * Fetch with timeout and redirect handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    omitDefaultHeaders = false,
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const defaultHeaders = omitDefaultHeaders
      ? {}
      : {
          "User-Agent": DEFAULT_USER_AGENT,
          "Accept":
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        };
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        ...defaultHeaders,
        ...fetchOptions.headers
      }
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Validate a single URL
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation result
 */
async function validateUrl(url, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT_MS,
    minBytes = DEFAULT_MIN_BYTES,
    checkContent = true
  } = options;

  const result = {
    url,
    valid: false,
    status: null,
    statusText: null,
    bodySize: 0,
    contentType: null,
    finalUrl: url,
    error: null,
    reason: null
  };

  // Basic URL validation
  if (!url || typeof url !== "string") {
    result.error = "Invalid URL format";
    result.reason = "invalid-url";
    return result;
  }

  if (!/^https?:\/\//.test(url)) {
    result.error = "URL must start with http:// or https://";
    result.reason = "invalid-protocol";
    return result;
  }

  if (isBlockedDomain(url)) {
    result.error = "Domain is blocked";
    result.reason = "blocked-domain";
    return result;
  }

  // Client-rendered SPA domains serve the same 200 shell for every path
  // (including dead ones), so their links cannot be verified over HTTP from CI.
  // Default: give existing references the benefit of the doubt (valid, but
  // flagged) so cleanup jobs never delete them on a false signal. With
  // strictUnverifiable (used when the AI pipeline accepts NEW references),
  // reject them so unverifiable citations don't enter the corpus.
  if (isUnverifiableSpaDomain(url)) {
    result.reason = "unverifiable-spa";
    result.valid = !options.strictUnverifiable;
    result.error = options.strictUnverifiable
      ? "SPA domain cannot be verified over HTTP; not accepted for new references"
      : null;
    return result;
  }

  try {
    const tryGetWithoutDefaultHeaders = async () => {
      // Some sites return false 404s when we set a UA/Accept header, or when
      // receiving HEAD requests. Retry with a GET and without our defaults.
      const retry = await fetchWithTimeout(url, {
        method: "GET",
        timeout,
        omitDefaultHeaders: true,
      });
      return retry;
    };

    // First try HEAD request to quickly detect hard failures and get metadata.
    // Note: HEAD responses have no body, so if we want to validate content we
    // must follow up with a GET for textual content.
    let usedHead = true;
    let response = await fetchWithTimeout(url, { method: "HEAD", timeout });
    result.status = response.status;
    result.statusText = response.statusText;
    result.finalUrl = response.url;

    // Some servers incorrectly respond 404/410 to HEAD (or to our default headers).
    // Retry with a GET without default headers before marking as not-found.
    if (response.status === 404 || response.status === 410) {
      const retry = await tryGetWithoutDefaultHeaders();
      if (!(retry.status === 404 || retry.status === 410)) {
        response = retry;
        usedHead = false;
        result.status = response.status;
        result.statusText = response.statusText;
        result.finalUrl = response.url;
      } else {
        result.reason = "not-found";
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        return result;
      }
    }

    if (response.status >= 500) {
      result.reason = "server-error";
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    // If HEAD fails with 405/403, try GET
    if (!response.ok || response.status === 405 || response.status === 403) {
      response = await fetchWithTimeout(url, { method: "GET", timeout });
      usedHead = false;
      result.status = response.status;
      result.statusText = response.statusText;
      result.finalUrl = response.url;
    }

    // Final status check after potential GET retry. Retry once more without
    // default headers for domains that block/lie to "bot-like" requests.
    if (response.status === 404 || response.status === 410) {
      const retry = await tryGetWithoutDefaultHeaders();
      if (retry.ok) {
        response = retry;
        usedHead = false;
        result.status = response.status;
        result.statusText = response.statusText;
        result.finalUrl = response.url;
      } else {
        result.reason = "not-found";
        result.error = `HTTP ${response.status}: ${response.statusText}`;
        return result;
      }
    }

    if (!response.ok) {
      result.reason = "http-error";
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      return result;
    }

    // Get content info
    const contentType = response.headers.get("content-type") || "";
    result.contentType = contentType;

    // If we need to validate textual content, ensure we have a GET response body.
    // A successful HEAD would otherwise appear as an empty page (0 bytes).
    const looksTextual = /text|html|json|xml/i.test(contentType);
    if (checkContent && looksTextual && usedHead) {
      response = await fetchWithTimeout(url, { method: "GET", timeout });
      usedHead = false;
      result.status = response.status;
      result.statusText = response.statusText;
      result.finalUrl = response.url;
      result.contentType = response.headers.get("content-type") || contentType;
    }

    // Check content size
    const isTextual = /text|html|json|xml/i.test(result.contentType || "");
    
    if (checkContent && isTextual) {
      const body = await response.text();
      result.bodySize = Buffer.byteLength(body, "utf8");

      // Check for minimum content size
      if (result.bodySize < minBytes) {
        // Be more lenient with trusted domains
        if (!isTrustedDomain(url)) {
          result.reason = "content-too-small";
          result.error = `Body too small: ${result.bodySize} bytes (min: ${minBytes})`;
          return result;
        }
      }

      // Check for empty/placeholder patterns
      const hasEmptyPattern = EMPTY_CONTENT_PATTERNS.some(pattern => pattern.test(body));
      if (hasEmptyPattern) {
        const emptyThreshold = parseInt(process.env.LINK_CHECK_EMPTY_THRESHOLD || "20000", 10);
        if (result.bodySize <= emptyThreshold) {
          result.reason = "empty-content";
          result.error = "Page appears to be empty or placeholder content";
          return result;
        }
      }
    } else {
      // For binary content, use content-length or read body
      const contentLength = response.headers.get("content-length");
      if (contentLength) {
        result.bodySize = parseInt(contentLength, 10);
      } else {
        const buffer = await response.arrayBuffer();
        result.bodySize = buffer.byteLength;
      }

      if (result.bodySize < minBytes && !isTrustedDomain(url)) {
        result.reason = "content-too-small";
        result.error = `Content too small: ${result.bodySize} bytes`;
        return result;
      }
    }

    // All checks passed
    result.valid = true;
    return result;

  } catch (err) {
    if (err.name === "AbortError") {
      result.reason = "timeout";
      result.error = `Request timeout after ${timeout}ms`;
    } else {
      result.reason = "network-error";
      result.error = err.message;
    }
    return result;
  }
}

/**
 * Validate multiple references with concurrency control
 * @param {Array<Object>} references - Array of {url, labelKey, ...} objects
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} Validation results
 */
async function validateReferences(references, options = {}) {
  const { concurrency = 4, ...validateOptions } = options;

  if (!Array.isArray(references) || references.length === 0) {
    return { valid: [], invalid: [], stats: { checked: 0, valid: 0, invalid: 0 } };
  }

  const results = [];
  const queue = [...references];
  
  // Process with limited concurrency
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const ref = queue.shift();
      if (!ref || !ref.url) {
        results.push({ ref, result: { valid: false, reason: "missing-url", error: "Reference missing URL" } });
        continue;
      }
      if (isBlockedDomain(ref.url)) {
        results.push({
          ref,
          result: {
            valid: false,
            reason: "blocked-domain",
            error: "Domain not in allowed reference domains",
          },
        });
        continue;
      }
      // validateReferences gates NEW references entering the corpus, so
      // unverifiable SPA domains are rejected here (strict) while existing
      // references checked via validateUrl directly keep the benefit of the doubt.
      const result = await validateUrl(ref.url, {
        strictUnverifiable: true,
        ...validateOptions,
      });
      results.push({ ref, result });
    }
  });

  await Promise.all(workers);

  // Separate valid and invalid
  const valid = [];
  const invalid = [];

  for (const { ref, result } of results) {
    if (result.valid) {
      valid.push({ ...ref, _validation: result });
    } else {
      invalid.push({ ...ref, _validation: result });
    }
  }

  return {
    valid,
    invalid,
    stats: {
      checked: results.length,
      valid: valid.length,
      invalid: invalid.length
    }
  };
}

/**
 * Deduplicate references by domain (keep only one per domain)
 * @param {Array<Object>} references - Array of reference objects
 * @returns {Array<Object>} Deduplicated references
 */
function deduplicateByDomain(references) {
  const seenDomains = new Set();
  const unique = [];

  for (const ref of references) {
    const domain = extractDomain(ref.url);
    if (!domain || seenDomains.has(domain)) {
      continue;
    }
    seenDomains.add(domain);
    unique.push(ref);
  }

  return unique;
}

/**
 * Verified Swiss/official fallback references for different topics
 */
const VERIFIED_FALLBACK_REFS = {
  tax: [
    { labelKey: "Administration fédérale des contributions (AFC)", url: "https://www.estv.admin.ch/estv/fr/home.html" },
    { labelKey: "TVA Suisse - Documentation officielle", url: "https://www.estv.admin.ch/estv/fr/home/taxe-sur-la-valeur-ajoutee.html" },
    { labelKey: "Impôts - Portail officiel suisse (ch.ch)", url: "https://www.ch.ch/fr/impots/" },
    { labelKey: "Portail PME - Fiscalité", url: "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/impots.html" }
  ],
  payroll: [
    { labelKey: "Office fédéral des assurances sociales (OFAS)", url: "https://www.bsv.admin.ch/bsv/fr/home.html" },
    { labelKey: "Swissdec - Standard de transmission salariale", url: "https://www.swissdec.ch/fr/" }
  ],
  audit: [
    { labelKey: "Autorité fédérale de surveillance en matière de révision (ASR)", url: "https://www.rab-asr.ch/" },
    { labelKey: "Code des obligations - Révision", url: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#art_727" },
    { labelKey: "EXPERTsuisse - Audit et conseil", url: "https://www.expertsuisse.ch/fr-ch" }
  ],
  odoo: [
    { labelKey: "Odoo - Documentation officielle", url: "https://www.odoo.com/documentation" },
    { labelKey: "Swissdec - Standard de transmission salariale", url: "https://www.swissdec.ch/fr/" }
  ],
  corporate: [
    { labelKey: "Code des obligations (CO)", url: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr" },
    { labelKey: "Registre du commerce - Canton de Genève", url: "https://www.ge.ch/organisation/registre-du-commerce" }
  ],
  domiciliation: [
    { labelKey: "Registre du commerce (Zefix)", url: "https://www.zefix.ch/fr/search/entity/welcome" },
    { labelKey: "Code des obligations (CO) - Société anonyme", url: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#book_2/tit_26/ch_2" }
  ],
  outsourcing: [
    { labelKey: "Portail PME de la Confédération (PME)", url: "https://www.kmu.admin.ch/kmu/fr/home.html" },
    { labelKey: "Code des obligations - Comptabilité", url: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#part_4/tit_32" }
  ],
  ma: [
    { labelKey: "Loi sur la fusion, la scission, la transformation et le transfert de patrimoine (LFus)", url: "https://www.fedlex.admin.ch/eli/cc/2003/218/fr" },
    { labelKey: "Code des obligations (CO)", url: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr" }
  ],
  "family-office": [
    { labelKey: "FINMA - Autorité fédérale de surveillance", url: "https://www.finma.ch/fr/" },
    { labelKey: "Loi sur le blanchiment d'argent (LBA)", url: "https://www.fedlex.admin.ch/eli/cc/1998/892_892_892/fr" }
  ],
  finance: [
    { labelKey: "Finances - Portail PME", url: "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances.html" },
    { labelKey: "Financement - Portail PME", url: "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/finances/financement.html" }
  ],
  regulatory: [
    { labelKey: "FINMA - Autorité fédérale de surveillance", url: "https://www.finma.ch/fr/" },
    { labelKey: "Loi sur le blanchiment d'argent (LBA)", url: "https://www.fedlex.admin.ch/eli/cc/1998/892_892_892/fr" }
  ],
  accounting: [
    { labelKey: "Swiss GAAP FER", url: "https://www.fer.ch/fr/" },
    { labelKey: "Code des obligations - Comptabilité", url: "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/fr#part_4/tit_32" }
  ],
  incorporation: [
    { labelKey: "Créer une entreprise - Portail PME", url: "https://www.kmu.admin.ch/kmu/fr/home/savoir-pratique/creation-pme.html" },
    { labelKey: "Registre du commerce - Guide fédéral", url: "https://www.zefix.ch/fr/search/entity/welcome" }
  ],
  general: [
    { labelKey: "Portail PME de la Confédération", url: "https://www.kmu.admin.ch/kmu/fr/home.html" },
    { labelKey: "Economiesuisse", url: "https://www.economiesuisse.ch/fr" }
  ]
};

/**
 * Get verified fallback references for a topic category
 * @param {string} category - Topic category
 * @returns {Array<Object>} Verified references
 */
function getFallbackReferences(category = "general") {
  return VERIFIED_FALLBACK_REFS[category] || VERIFIED_FALLBACK_REFS.general;
}

module.exports = {
  validateUrl,
  validateReferences,
  deduplicateByDomain,
  extractDomain,
  isTrustedDomain,
  isBlockedDomain,
  isUnverifiableSpaDomain,
  getFallbackReferences,
  VERIFIED_FALLBACK_REFS,
  ALLOWED_REFERENCE_DOMAINS,
  DISALLOWED_FIRM_SOURCE_DOMAINS,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_MIN_BYTES
};
