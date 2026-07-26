import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infra/lib/supabase/server-client';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { logger } from '@/lib/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `page-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const body = await req.json();
    const { title, slug, body_html, cover_image_url, content } = body;

    const finalSlug = slug || slugify(title || 'Untitled Page');
    const finalTitle = title || 'Untitled Page';

    const supabase = createClient();
    const { data, error } = await supabase
      .from('pages')
      .insert({
        user_id: userId,
        title: finalTitle,
        slug: finalSlug,
        body_html: body_html || '',
        cover_image_url: cover_image_url || null,
        content: content || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { ok: false, error: { code: 'DUPLICATE_SLUG', message: `Slug "${finalSlug}" already exists` } },
          { status: 409 },
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (err: any) {
    logger.error('Create page error:', err);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const published = searchParams.get('published');
    const search = searchParams.get('search');

    const supabase = createClient();
    let query = supabase
      .from('pages')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (published === 'true') query = query.eq('published', true);
    else if (published === 'false') query = query.eq('published', false);

    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ ok: true, data, count, limit, offset });
  } catch (err: any) {
    logger.error('List pages error:', err);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 },
    );
  }
}
