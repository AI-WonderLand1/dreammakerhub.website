import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { target, code, elements, wpUrl, apiKey } = await req.json();

    if (target === 'wordpress') {
      if (!wpUrl) {
        return NextResponse.json({ ok: false, message: 'WordPress URL is required' }, { status: 400 });
      }

      const siteUrl = wpUrl.replace(/\/$/, '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-AIW-Api-Key'] = apiKey;
      }

      const pagePayload = {
        title: 'AI Wonderland Builder Export',
        content: code || '<div>Empty</div>',
        status: 'draft',
        meta: {
          _aiw_builder_elements: elements ? JSON.stringify(elements) : null,
        },
      };

      const res = await fetch(`${siteUrl}/wp-json/aiw/v1/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(pagePayload),
      });

      if (!res.ok) {
        const errText = await res.text();
        logger.error('WordPress publish failed:', { status: res.status, body: errText });
        return NextResponse.json(
          { ok: false, message: `WordPress API error: ${res.status} — ${errText.slice(0, 200)}` },
          { status: 502 }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        ok: true,
        message: `Published to WordPress — Page ID: ${data.id || 'unknown'}`,
        pageId: data.id,
        url: `${siteUrl}/?p=${data.id}`,
      });
    }

    if (target === 'html') {
      return NextResponse.json({
        ok: true,
        message: 'HTML export ready',
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AI Wonderland Export</title><script src="https://cdn.tailwindcss.com"></script></head><body>${code || '<div>Empty</div>'}</body></html>`,
      });
    }

    return NextResponse.json({ ok: false, message: 'Invalid target' }, { status: 400 });
  } catch (err: any) {
    logger.error('Publish error:', err);
    return NextResponse.json({ ok: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
