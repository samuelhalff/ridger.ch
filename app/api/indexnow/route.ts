import { NextResponse } from 'next/server';
import { parseIndexNowUrls, submitToIndexNow } from '@/src/lib/indexnow';

export async function POST(req: Request) {
  try {
    // No auth: the IndexNow key is public by protocol (served at
    // /<key>.txt), so anyone can already submit ridger.ch URLs to the
    // search engines directly. We only restrict submissions to our own host
    // so the endpoint can't relay arbitrary URLs.
    const body = await req.json().catch(() => ({}));
    const parsed = parseIndexNowUrls((body as { urls?: unknown })?.urls);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_urls' }, { status: 400 });
    }
    await submitToIndexNow(parsed.urls);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'IndexNow error' }, { status: 500 });
  }
}
