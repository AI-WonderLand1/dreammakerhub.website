import { NextRequest, NextResponse } from 'next/server';
import { readBody, extractConfig } from '@/lib/wp-engine/proxy';
import { requireUserId } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const body = await readBody(req);
  const config = extractConfig(body);
  if (!config) {
    return NextResponse.json({ ok: false, message: 'wpUrl and apiKey are required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${config.wpUrl}/wp-json/aiw/v1/status`, {
      headers: { 'Accept': 'application/json', 'X-AIW-Api-Key': config.apiKey },
    });
    const data = await res.json().catch(() => ({}));

    return NextResponse.json({
      ok: true,
      connected: res.ok,
      status: res.status,
      name: data?.name,
      version: data?.version,
      wp_version: data?.wp_version,
      message: res.ok ? 'Connected to WordPress' : 'Could not reach AI Wonderland plugin',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, connected: false, message: err?.message || 'Failed to reach WordPress site' },
      { status: 502 }
    );
  }
}
