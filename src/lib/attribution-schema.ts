import { z } from "zod";

/**
 * Server-side validation for the first-party attribution sent with lead
 * submissions (see src/lib/attribution.ts). Values are attacker-controlled:
 * bounded lengths and pathnames only. Invalid attribution is dropped
 * (`.catch`) so it can never cost a lead.
 */
const attributionString = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string().max(max).optional().or(z.literal("")),
  );

const attributionPathname = z
  .string()
  .trim()
  .max(200)
  .regex(/^\/[^\s?#]*$/);

export const attributionSchema = z
  .object({
    landingPage: attributionPathname.optional().or(z.literal("")),
    referrer: attributionString(150),
    utm: z
      .object({
        source: attributionString(150),
        medium: attributionString(150),
        campaign: attributionString(150),
        term: attributionString(150),
        content: attributionString(150),
      })
      .partial()
      .optional(),
    gclid: attributionString(200),
    pages: z.array(attributionPathname).max(20).optional(),
  })
  .optional()
  .catch(undefined);

export type AttributionInput = z.infer<typeof attributionSchema>;

const clean = (value?: string) =>
  (value || "").replace(/[<>"'`\r\n\t]/g, "").trim();

/** Flat, readable fields for the lead e-mail (Formspark). */
export function flattenAttribution(attribution: AttributionInput) {
  if (!attribution) return {};
  const utm = attribution.utm || {};
  const utmLine = (["source", "medium", "campaign", "term", "content"] as const)
    .filter((key) => clean(utm[key]))
    .map((key) => `${key}=${clean(utm[key])}`)
    .join(" ");
  const out: Record<string, string> = {};
  if (clean(attribution.landingPage)) out.landingPage = clean(attribution.landingPage);
  if (clean(attribution.referrer)) out.firstReferrer = clean(attribution.referrer);
  if (utmLine) out.utm = utmLine;
  if (clean(attribution.gclid)) out.gclid = clean(attribution.gclid);
  if (attribution.pages?.length) {
    out.pagesViewed = attribution.pages.map(clean).filter(Boolean).join(" > ");
  }
  return out;
}
