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
    const { target, code, elements, title } = await req.json();

    if (target === 'site') {
      const supabase = createClient();
      const pageTitle = title || 'Untitled Page';
      const slug = slugify(pageTitle);

      const { data, error } = await supabase
        .from('pages')
        .insert({
          user_id: userId,
          title: pageTitle,
          slug,
          body_html: code || '',
          content: elements || [],
          published: true,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json(
            { ok: false, message: `Slug "${slug}" already exists` },
            { status: 409 }
          );
        }
        throw error;
      }

      return NextResponse.json({
        ok: true,
        message: `Published to /${slug}`,
        slug,
        url: `/${slug}`,
        pageId: data.id,
      });
    }

    if (target === 'html') {
      return NextResponse.json({ ok: true, message: 'HTML export ready' });
    }

    return NextResponse.json({ ok: false, message: 'Invalid target' }, { status: 400 });
  } catch (err: any) {
    logger.error('Publish error:', err);
    return NextResponse.json({ ok: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
