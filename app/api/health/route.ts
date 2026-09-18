import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const revalidate = 0;

/**
 * buildId lets the deploy pipeline verify that the NEW release is answering —
 * a plain 200 cannot prove which release served it (the old process can still
 * respond while terminating). BUILD_ID is not sensitive: it already appears
 * in every /_next/static asset path.
 */
let cachedBuildId: string | null = null;

async function getBuildId() {
  if (!cachedBuildId) {
    try {
      cachedBuildId = (
        await fs.readFile(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8")
      ).trim();
    } catch {
      cachedBuildId = "unknown";
    }
  }
  return cachedBuildId;
}

export async function GET() {
  const uptimeSeconds = Math.round(process.uptime());
  return NextResponse.json(
    {
      ok: true,
      buildId: await getBuildId(),
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV ?? "unknown",
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
