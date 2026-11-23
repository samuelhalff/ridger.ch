import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { ogPages } from "@/src/lib/public-pages";

/*
 * Share image (1200 × 630) of each French and English public page, written
 * at build time: /assets/og-pages/<key>.webp (rendered as PNG by next/og,
 * stored as WebP). Ridger's look: near-black background, the two ridge lines
 * of the logo drawn large in cream and bronze, Fraunces title, Instrument
 * Sans labels. Other locales and unknown pages keep /assets/og/og-<locale>.webp.
 */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [...ogPages().keys()].map((key) => ({ key: `${key}.webp` }));
}

const read = (f: string) => fs.readFileSync(path.join(process.cwd(), f));
const font = (f: string) => read(`src/og/${f}.ttf`);
const LOGO = `data:image/svg+xml;base64,${read("public/assets/ridger--light.svg").toString("base64")}`;
// The logo's two ridge lines, as a large background motif.
const RIDGES = `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="720" height="720"><g transform="rotate(8 12 14.5)"><path d="M3 18 L10 9 L14.5 14.5 L21 6.5" fill="none" stroke="#faf7f2" stroke-opacity="0.10" stroke-width="1.1" stroke-linejoin="round"/><path d="M3 22.5 L10 13.5 L14.5 19 L21 11" fill="none" stroke="#9a7b4f" stroke-opacity="0.45" stroke-width="1.1" stroke-linejoin="round"/></g></svg>`,
).toString("base64")}`;

const CREAM = "#faf7f2";
const BRONZE = "#9a7b4f";
const BRONZE_ON_DARK = "#bda072";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const page = ogPages().get(key.replace(/\.webp$/, ""));
  if (!page) return new Response("Not found", { status: 404 });
  const size = page.title.length > 90 ? 48 : page.title.length > 64 ? 56 : page.title.length > 40 ? 64 : 74;
  const png = new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#0c0b0a",
          color: CREAM,
          fontFamily: "Instrument Sans",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={RIDGES} width={720} height={720} alt="" style={{ position: "absolute", right: -150, top: -40 }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "64px 80px 56px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} width={235} height={80} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {page.rubric ? (
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", color: BRONZE_ON_DARK }}>{page.rubric}</span>
            ) : null}
            <span style={{ fontFamily: "Fraunces", fontSize: size, fontWeight: 600, lineHeight: 1.1, letterSpacing: -0.5, maxWidth: 980 }}>{page.title}</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, fontWeight: 400, color: "#a8a29a" }}>
            <span>ridger.ch</span>
          </div>
        </div>
        <div style={{ height: 8, backgroundColor: BRONZE }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Instrument Sans", data: font("instrument-regular"), weight: 400, style: "normal" },
        { name: "Instrument Sans", data: font("instrument-semibold"), weight: 600, style: "normal" },
        { name: "Fraunces", data: font("fraunces-semibold"), weight: 600, style: "normal" },
      ],
    },
  );
  const webp = await sharp(Buffer.from(await png.arrayBuffer())).webp({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(webp), { headers: { "Content-Type": "image/webp" } });
}
