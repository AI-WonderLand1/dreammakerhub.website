import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/infra/lib/supabase/server-client';
import { requirePaidAIUser } from '@/app/api/ai/auth';
import { sanitizeUntrustedHtml } from '@/lib/security/sanitize-html.server';
import { logger } from '@/lib/logger';
import type { BuilderTheme, CanvasElement } from '@/lib/builder/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const PAGE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_PAGES = 100;
const MAX_SITE_PAYLOAD_BYTES = 5 * 1024 * 1024;

interface WonderBuildPublishPage {
  id: string;
  name: string;
  slug: string;
  elements: CanvasElement[];
}

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

function parseWonderBuildPages(value: unknown): WonderBuildPublishPage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_PAGES) return null;

  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const pages: WonderBuildPublishPage[] = [];

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null;
    const candidate = raw as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
    const name = typeof candidate.name === 'string' ? candidate.name.trim().slice(0, 200) : '';
    const pageSlug = typeof candidate.slug === 'string' ? candidate.slug.trim().toLowerCase() : '';
    const elements = Array.isArray(candidate.elements) ? candidate.elements as CanvasElement[] : null;

    if (!PAGE_ID_RE.test(id) || !name || !elements) return null;
    if (pageSlug !== '/' && !PAGE_SLUG_RE.test(pageSlug)) return null;
    if (seenIds.has(id) || seenSlugs.has(pageSlug)) return null;

    seenIds.add(id);
    seenSlugs.add(pageSlug);
    pages.push({ id, name, slug: pageSlug, elements });
  }

  return pages;
}

function internalPageSlug(userId: string, projectId: string, pageId: string): string {
  return `wb-${userId}-${projectId}-${pageId.toLowerCase()}`;
}

function publicPageUrl(projectId: string, pageSlug: string): string {
  return pageSlug === '/' ? `/sites/${projectId}` : `/sites/${projectId}/${pageSlug}`;
}

export async function POST(req: NextRequest) {
  const auth = await requirePaidAIUser(req);
  if ('userId' in auth === false) return auth as NextResponse;
  const userId = (auth as { userId: string }).userId;

  try {
    const body = await req.json();
    const { target } = body;

    if (target === 'site' && body.pages !== undefined) {
      const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
      if (!UUID_RE.test(projectId)) {
        return NextResponse.json({ ok: false, message: 'Invalid project ID' }, { status: 400 });
      }

      const payloadSize = JSON.stringify(body.pages).length;
      if (payloadSize > MAX_SITE_PAYLOAD_BYTES) {
        return NextResponse.json({ ok: false, message: 'Site payload is too large to publish' }, { status: 413 });
      }

      const pages = parseWonderBuildPages(body.pages);
      if (!pages) {
        return NextResponse.json({ ok: false, message: 'Invalid WonderBuild page data' }, { status: 400 });
      }
      if (!pages.some((page) => page.slug === '/')) {
        return NextResponse.json({ ok: false, message: 'WonderBuild site must include a Home page' }, { status: 400 });
      }

      const theme = body.theme && typeof body.theme === 'object'
        ? body.theme as BuilderTheme
        : undefined;

      const supabase = await createClient();
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id,user_id')
        .eq('id', projectId)
        .eq('user_id', userId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!project) {
        return NextResponse.json({ ok: false, message: 'Project not found' }, { status: 404 });
      }

      const now = new Date().toISOString();
      const rows = pages.map((page) => ({
        user_id: userId,
        title: page.name,
        slug: internalPageSlug(userId, projectId, page.id),
        body_html: '',
        content: {
          kind: 'wonderbuild-site-page',
          version: 2,
          wonderBuild: {
            projectId,
            pageId: page.id,
            pageSlug: page.slug,
            isHome: page.slug === '/',
          },
          theme,
          elements: page.elements,
        },
        published: true,
        updated_at: now,
      }));

      const { error: upsertError } = await supabase
        .from('pages')
        .upsert(rows, { onConflict: 'slug' });
      if (upsertError) throw upsertError;

      const prefix = `wb-${userId}-${projectId}-`;
      const activeSlugs = new Set(rows.map((row) => row.slug));
      const { data: previousRows, error: previousError } = await supabase
        .from('pages')
        .select('id,slug')
        .eq('user_id', userId)
        .like('slug', `${prefix}%`);

      if (previousError) throw previousError;
      const staleIds = (previousRows || [])
        .filter((row) => !activeSlugs.has(row.slug))
        .map((row) => row.id);

      if (staleIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('pages')
          .delete()
          .eq('user_id', userId)
          .in('id', staleIds);
        if (deleteError) throw deleteError;
      }

      const url = `/sites/${projectId}`;
      return NextResponse.json({
        ok: true,
        message: `Published ${pages.length} page${pages.length === 1 ? '' : 's'}`,
        projectId,
        url,
        pages: pages.map((page) => ({
          id: page.id,
          name: page.name,
          slug: page.slug,
          url: publicPageUrl(projectId, page.slug),
        })),
      });
    }

    if (target === 'site') {
      const { code, elements, title } = body;
      const supabase = await createClient();
      const pageTitle = typeof title === 'string' && title.trim() ? title.trim().slice(0, 200) : 'Untitled Page';
      let slug = slugify(pageTitle);

      const { data: existing } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (existing) slug = `${slug}-${Date.now()}`;

      const safeHtml = sanitizeUntrustedHtml(typeof code === 'string' ? code : '');
      const { data, error } = await supabase
        .from('pages')
        .insert({
          user_id: userId,
          title: pageTitle,
          slug,
          body_html: safeHtml,
          content: Array.isArray(elements) ? elements : [],
          published: true,
        })
        .select()
        .single();

      if (error) throw error;
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
