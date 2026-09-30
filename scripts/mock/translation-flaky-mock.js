"use strict";

/**
 * Offline mock (AI_MOCK_MODULE) that reproduces the 2026-09-30 failure mode of
 * the translation step, for scripts/translation-repair.test.js:
 *   MOCK_FLAKY=repairs  — every translation has a too-long title/seoTitle and
 *                         drops the body's external links; the targeted
 *                         shorten + link-repair calls fix them.
 *   MOCK_FLAKY=escalate — the main deployment keeps failing (and the repair
 *                         calls return nothing usable); only the escalated
 *                         final attempt (strong=true) returns a valid output.
 * Every call is appended to MOCK_CALL_LOG (JSON lines) when set.
 */

const fs = require("fs");
const base = require("./article-pipeline-mock");
const { stripReferencesSection } = require("../lib/translationRepair");

const mode = () => process.env.MOCK_FLAKY || "repairs";
function record(entry) {
  if (process.env.MOCK_CALL_LOG) fs.appendFileSync(process.env.MOCK_CALL_LOG, `${JSON.stringify(entry)}\n`);
}
const LONG = " — a long and winding explanatory addition for every family considering it";
const dropExternalLinks = (c) => c.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1");

module.exports = {
  ...base,
  translate(ctx) {
    record({ kind: "translate", locale: ctx.locale, strong: ctx.strong, retry: ctx.problems.length > 0, prompt: ctx.prompt });
    const good = base.translate(ctx);
    if (mode() === "escalate" && ctx.strong) return good;
    return {
      ...good,
      title: `${good.title}${LONG}`,
      seoTitle: `${good.seoTitle}${LONG}`,
      content: dropExternalLinks(good.content),
    };
  },
  shorten(ctx) {
    record({ kind: "shorten", locale: ctx.locale, strong: ctx.strong, prompt: ctx.prompt });
    if (mode() === "escalate") return {};
    const good = base.translate(ctx);
    return { title: good.title, seoTitle: good.seoTitle };
  },
  linkRepair(ctx) {
    record({ kind: "links", locale: ctx.locale, strong: ctx.strong, prompt: ctx.prompt });
    if (mode() === "escalate") return { content: "" };
    return { content: stripReferencesSection(base.translate(ctx).content) };
  },
};
