import { NextResponse } from "next/server";
import { z } from "zod";
import { runWithTimeout } from "@/src/lib/agent/resilience";

export const runtime = "nodejs";
export const revalidate = 0;

const FORMSPARK_ACTION_URL = process.env.FORMSPARK_ACTION_URL;
const FORMSPARK_TIMEOUT_MS = Number.parseInt(
  process.env.FORMSPARK_TIMEOUT_MS || "5000",
  10,
);
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;
const DEBUG_VALIDATION = process.env.DEBUG_AGENT === "1";

const contactSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(500),
  consent: z.literal(true),
  companyName: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(80).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  aumBand: z.string().trim().max(80).optional().or(z.literal("")),
  horizon: z.string().trim().max(80).optional().or(z.literal("")),
  serviceInterest: z.string().trim().max(120).optional().or(z.literal("")),
  pageUrl: z.string().trim().max(600).optional().or(z.literal("")),
  referrer: z.string().trim().max(600).optional().or(z.literal("")),
  gaClientId: z
    .string()
    .trim()
    .regex(/^\d{1,20}\.\d{1,20}$/)
    .optional()
    .or(z.literal("")),
  turnstileToken: z.string().trim().max(2048).optional().or(z.literal("")),
});

const verifyTurnstile = async (token: string): Promise<boolean> => {
  if (!TURNSTILE_SECRET_KEY) return true; // skip in dev when key absent
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: token }),
      },
    );
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
};

const submitFormspark = async (payload: z.infer<typeof contactSchema>) => {
  if (!FORMSPARK_ACTION_URL) {
    if (DEBUG_VALIDATION) {
      console.log("[contact] FORMSPARK_ACTION_URL unset — skipping (dev mode)");
    }
    return;
  }
  const res = await runWithTimeout(
    (signal) =>
      fetch(FORMSPARK_ACTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal,
      }),
    FORMSPARK_TIMEOUT_MS,
    "formspark_contact",
  );
  if (!res.ok) {
    throw new Error(`Formspark contact failed (${res.status})`);
  }
};

export async function POST(request: Request) {
  let payload: z.infer<typeof contactSchema>;
  try {
    payload = contactSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  // Turnstile verification (skipped when secret key not configured)
  if (payload.turnstileToken) {
    const valid = await verifyTurnstile(payload.turnstileToken);
    if (!valid) {
      return NextResponse.json({ error: "invalid_token" }, { status: 403 });
    }
  }

  try {
    // Attribution gaClientId is for analytics matching only — never disclose to Formspark
    await submitFormspark({ ...payload, gaClientId: undefined });

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error) {
    if (DEBUG_VALIDATION) {
      console.warn("[contact] submission failed", error);
    }
    return NextResponse.json({ error: "crm_unavailable" }, { status: 502 });
  }
}
