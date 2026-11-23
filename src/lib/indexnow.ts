const INDEXNOW_HOST = "ridger.ch";

/**
 * Accept only canonical https URLs on the ridger.ch host. Rejects the whole
 * batch on any invalid entry so the endpoint can't be used as an open relay
 * for arbitrary URLs.
 */
export function parseIndexNowUrls(
  value: unknown,
): { success: true; urls: string[] } | { success: false } {
  if (!Array.isArray(value) || value.length < 1 || value.length > 1000) {
    return { success: false };
  }
  const out = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || entry.length > 2048) return { success: false };
    // Reject raw markers URL normalization would hide: any explicit port
    // (":<digits>" after the host), an "@" (credentials), or a "#" fragment.
    if (/#/.test(entry) || /@/.test(entry)) return { success: false };
    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      return { success: false };
    }
    if (
      url.protocol !== "https:" ||
      url.hostname !== INDEXNOW_HOST ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.hash !== "" ||
      // Reject an explicit ":<port>" even when it equals the default (443),
      // which URL normalizes away.
      new RegExp(`^https://${INDEXNOW_HOST}:`).test(entry)
    ) {
      return { success: false };
    }
    out.add(url.toString());
  }
  return { success: true, urls: [...out] };
}

const INDEXNOW_KEY = "0b2df53c19495486d5f3e5b686bbc8ea"; // served at https://ridger.ch/0b2df53c19495486d5f3e5b686bbc8ea.txt
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Sends URLs to IndexNow through api.indexnow.org, which shares them with
 * Bing, Yandex and the other participants. True only on 200/202: a 4xx
 * (bad key, wrong host, too many requests) is a failure.
 */
export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  // Defense in depth: never submit an off-host URL even if a caller skipped
  // parseIndexNowUrls.
  urls = urls.filter((u) => {
    try {
      return new URL(u).hostname === INDEXNOW_HOST;
    } catch {
      return false;
    }
  });
  if (!urls.length) return false;
  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const ok = response.status === 200 || response.status === 202;
    if (ok) console.log(`[IndexNow] ${urls.length} URL(s) accepted (${response.status})`);
    else console.warn(`[IndexNow] api.indexnow.org returned ${response.status}`);
    return ok;
  } catch (error) {
    console.warn("[IndexNow] submission failed:", error);
    return false;
  }
}
