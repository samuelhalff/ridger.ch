import { cookies } from "next/headers";

const CONSENT_KEY = "cookieConsent";

export async function getConsentFromCookies(): Promise<"accepted" | "declined" | null> {
  try {
    const c = (await cookies()).get(CONSENT_KEY)?.value;
    if (c === "accepted" || c === "declined") return c;
    return null;
  } catch {
    return null;
  }
}
