/**
 * /llms-full.txt: the text of every public page in French and English, as
 * Markdown, built once at build time (app/llms-full.txt/route.ts).
 * Page list and content: src/lib/public-pages.ts.
 */
import { PUBLIC_LOCALES, SITE_URL, publicPages, type PublicPage } from "./public-pages";
import { LLMS_INTRO as INTRO } from "./llms";

function pageBlock(p: PublicPage): string {
  const head = [`# ${p.title}`, "", `URL: ${p.url}`];
  if (p.updated) head.push(p.locale === "fr" ? `Mis à jour le ${p.updated}` : `Updated: ${p.updated}`);
  const body = p.body().trim();
  return [...head, "", body, ""].join("\n");
}

export function llmsFullTxt(): string {
  const lines = [
    "# Ridger: full text of the public pages",
    "",
    `> ${INTRO}`,
    "",
    "This file holds the text of the public pages of ridger.ch in French, the main language, then in English, as Markdown. Each page starts with its title and its canonical URL. The German, Spanish and Portuguese versions translate the same pages and are not repeated here.",
    "",
    `Index: ${SITE_URL}/llms.txt`,
    "",
  ];
  for (const locale of PUBLIC_LOCALES) {
    for (const page of publicPages(locale)) lines.push("---", "", pageBlock(page));
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n");
}
