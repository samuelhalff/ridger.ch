export const locales = ["en", "fr", "de", "es", "pt"] as const;
export type Locale = (typeof locales)[number];
