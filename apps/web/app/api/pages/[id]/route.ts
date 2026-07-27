import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infra/lib/supabase/server-client';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { logger } from '@/lib/logger';

async function getPageOrFail(supabase: ReturnType<typeof createClient>, id: string, userId: string) {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error?.code === 'PGRST116') {
    return { error: NextResponse.json(
      { ok: false, error: { code: 'NOT_FOUND', message: 'Page not found' } },
      { status: 404 },
    ), data: null };
  }
  if (error) throw error;
  return { data, error: null };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const supabase = createClient();
    const { data, error } = await getPageOrFail(supabase, params.id, userId);
    if (error) return error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    logger.error('Get page error:', err);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const supabase = createClient();
    const { data: existing, error } = await getPageOrFail(supabase, params.id, userId);
    if (error) return error;

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.slug !== undefined) updates.slug = body.slug;
    if (body.body_html !== undefined) updates.body_html = body.body_html;
    if (body.cover_image_url !== undefined) updates.cover_image_url = body.cover_image_url;
    if (body.content !== undefined) updates.content = body.content;
    if (body.published !== undefined) updates.published = body.published;
    updates.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('pages')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { ok: false, error: { code: 'DUPLICATE_SLUG', message: `Slug "${body.slug}" already exists` } },
          { status: 409 },
        );
      }
      throw updateError;
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    logger.error('Update page error:', err);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const supabase = createClient();
    const { data: existing, error } = await getPageOrFail(supabase, params.id, userId);
    if (error) return error;

    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ ok: true, deleted: params.id });
  } catch (err: any) {
    logger.error('Delete page error:', err);
    return NextResponse.json(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 },
    );
  }
}
