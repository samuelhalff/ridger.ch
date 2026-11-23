import { llmsTxt } from "@/src/lib/llms";

// Generated at build time from the page list shared with /llms-full.txt and
// the share images (src/lib/llms.ts, src/lib/public-pages.ts).
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
