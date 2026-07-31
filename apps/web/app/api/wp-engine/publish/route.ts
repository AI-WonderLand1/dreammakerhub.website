import { NextRequest, NextResponse } from 'next/server';
import { readBody, extractConfig } from '@/lib/wp-engine/proxy';
import { requireUserId } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { serializeToWP } from '@/lib/wp-engine/gutenberg';

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  if (!userId) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const body = await readBody(req);
  const config = extractConfig(body);
  if (!config) {
    return NextResponse.json({ ok: false, message: 'wpUrl and apiKey are required' }, { status: 400 });
  }

  const { title, status = 'publish', elements, content, postId, slug } = body;
  if (!title) {
    return NextResponse.json({ ok: false, message: 'title is required' }, { status: 400 });
  }

  const payload = serializeToWP(elements || []);
  const pageContent = content ?? payload.gutenberg;

  try {
    const isUpdate = !!postId;
    const endpoint = `${config.wpUrl}/wp-json/aiw/v1/gutenberg`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-AIW-Api-Key': config.apiKey,
      },
      body: JSON.stringify({
        title,
        content: pageContent,
        status,
        slug: slug || undefined,
        post_id: isUpdate ? Number(postId) : undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: data?.message || data?.error || `WordPress returned ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: isUpdate ? 'Page updated in WordPress' : 'Page created in WordPress',
      id: String(data?.id ?? postId ?? ''),
      link: data?.link ?? data?.url ?? data?.permalink,
      blockCount: payload.blockCount,
    });
  } catch (err: any) {
    logger.error('WP publish error:', err);
    return NextResponse.json(
      { ok: false, message: err?.message || 'Failed to reach WordPress site' },
      { status: 502 }
    );
  }
}
