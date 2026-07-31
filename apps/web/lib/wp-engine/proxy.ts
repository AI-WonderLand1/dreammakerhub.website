import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { logger } from '@/lib/logger';

export interface WPProxyConfig {
  wpUrl: string;
  apiKey: string;
}

export async function readBody(req: NextRequest): Promise<Record<string, any>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function extractConfig(body: Record<string, any>): WPProxyConfig | null {
  const wpUrl = String(body?.wpUrl || '').replace(/\/+$/, '');
  const apiKey = String(body?.apiKey || '');
  if (!wpUrl || !apiKey) return null;
  return { wpUrl, apiKey };
}

export async function wpProxy(
  req: NextRequest,
  path: string,
  options?: { method?: string; body?: Record<string, any> }
) {
  const userId = await requireUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = options?.body ?? (await readBody(req));
  const config = extractConfig(body);
  if (!config) {
    return NextResponse.json({ ok: false, message: 'wpUrl and apiKey are required' }, { status: 400 });
  }

  const method = options?.method || req.method || 'POST';
  const endpoint = `${config.wpUrl}/wp-json/aiw/v1/${path}`;

  try {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-AIW-Api-Key': config.apiKey,
      },
      body: ['POST', 'PUT', 'PATCH'].includes(method)
        ? JSON.stringify(options?.body ?? {})
        : undefined,
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, message: data?.message || data?.error || `WordPress returned ${res.status}`, status: data?.status },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, data, status: res.status });
  } catch (err: any) {
    logger.error(`WP proxy error [${path}]:`, err);
    return NextResponse.json(
      { ok: false, message: err?.message || 'Failed to reach WordPress site' },
      { status: 502 }
    );
  }
}

export function normalizeProjects(raw: any): any[] {
  const list = raw?.data ?? raw?.projects ?? raw ?? [];
  if (!Array.isArray(list)) return [];
  return list.map((p: any) => ({
    id: String(p.id ?? p.post_id ?? ''),
    title: p.title ?? p.post_title ?? 'Untitled',
    slug: p.slug ?? p.post_name ?? '',
    status: p.status ?? p.post_status ?? 'publish',
    date: p.date ?? p.post_date ?? '',
    modified: p.modified ?? p.post_modified ?? '',
    content: p.content ?? p.post_content ?? '',
    meta: p.meta ?? p.data ?? null,
    url: p.url ?? p.permalink ?? '',
  }));
}

export function normalizePages(raw: any): any[] {
  const list = raw?.data ?? raw?.pages ?? raw ?? [];
  if (!Array.isArray(list)) return [];
  return list.map((p: any) => ({
    id: String(p.id ?? ''),
    title: p.title ?? 'Untitled',
    slug: p.slug ?? p.post_name ?? '',
    status: p.status ?? p.post_status ?? 'publish',
    date: p.date ?? p.post_date ?? '',
    modified: p.modified ?? p.post_modified ?? '',
    content: p.content ?? p.post_content ?? '',
    link: p.url ?? p.permalink ?? '',
  }));
}
