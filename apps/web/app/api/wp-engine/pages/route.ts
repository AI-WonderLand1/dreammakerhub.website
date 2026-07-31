import { NextRequest, NextResponse } from 'next/server';
import { readBody, extractConfig } from '@/lib/wp-engine/proxy';
import { requireUserId } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const body = await readBody(req);
  const config = extractConfig(body);
  if (!config) {
    return NextResponse.json({ ok: false, message: 'wpUrl and apiKey are required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${config.wpUrl}/wp-json/aiw/v1/pages`, {
      headers: { 'Accept': 'application/json', 'X-AIW-Api-Key': config.apiKey },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: data?.message || `WordPress returned ${res.status}` },
        { status: res.status }
      );
    }

    const list = data?.data ?? data?.pages ?? [];
    return NextResponse.json({
      ok: true,
      pages: (Array.isArray(list) ? list : []).map((p: any) => ({
        id: String(p.id ?? ''),
        title: p.title ?? 'Untitled',
        slug: p.slug ?? '',
        status: p.status ?? 'publish',
        date: p.date ?? '',
        modified: p.modified ?? '',
        content: p.content ?? '',
        link: p.url ?? '',
      })),
    });
  } catch (err: any) {
    logger.error('WP pages list error:', err);
    return NextResponse.json(
      { ok: false, message: err?.message || 'Failed to reach WordPress site' },
      { status: 502 }
    );
  }
}
