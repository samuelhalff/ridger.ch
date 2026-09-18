import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

function toMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10;
}

export async function GET() {
  const mem = process.memoryUsage();
  return NextResponse.json(
    {
      ok: true,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        rssMB: toMB(mem.rss),
        heapTotalMB: toMB(mem.heapTotal),
        heapUsedMB: toMB(mem.heapUsed),
        externalMB: toMB(mem.external),
        arrayBuffersMB: toMB(mem.arrayBuffers),
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

