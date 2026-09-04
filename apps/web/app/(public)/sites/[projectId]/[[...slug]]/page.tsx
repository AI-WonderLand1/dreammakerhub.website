import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { query } from '@/lib/db';
import PublishedBuilderPage from '@/lib/builder/components/PublishedBuilderPage';
import type { BuilderTheme, CanvasElement } from '@/lib/builder/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PublishedWonderBuildContent {
  kind: 'wonderbuild-site-page';
  version: number;
  wonderBuild: {
    projectId: string;
    pageId: string;
    pageSlug: string;
    isHome: boolean;
  };
  theme?: BuilderTheme;
  elements: CanvasElement[];
}

interface PublishedRow {
  title: string;
  content: PublishedWonderBuildContent | string;
}

function requestedPageSlug(parts?: string[]): string {
  return parts && parts.length > 0 ? parts.join('/') : '/';
}

function parseContent(value: PublishedRow['content']): PublishedWonderBuildContent | null {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.kind !== 'wonderbuild-site-page') return null;
    if (!parsed.wonderBuild || typeof parsed.wonderBuild !== 'object') return null;
    if (!Array.isArray(parsed.elements)) return null;
    return parsed as PublishedWonderBuildContent;
  } catch {
    return null;
  }
}

async function getPublishedPage(projectId: string, pageSlug: string) {
  try {
    const { rows } = await query(
      `SELECT pg.title, pg.content
       FROM pages pg
       INNER JOIN projects pr
         ON pr.id::text = pg.content->'wonderBuild'->>'projectId'
        AND pr.user_id = pg.user_id
       WHERE pg.published = true
         AND pg.content->>'kind' = 'wonderbuild-site-page'
         AND pg.content->'wonderBuild'->>'projectId' = $1
         AND pg.content->'wonderBuild'->>'pageSlug' = $2
         AND pg.slug LIKE ('wb-' || pg.user_id::text || '-' || pr.id::text || '-%')
       ORDER BY pg.updated_at DESC NULLS LAST
       LIMIT 1`,
      [projectId, pageSlug],
    );

    const row = rows[0] as PublishedRow | undefined;
    if (!row) return null;
    const content = parseContent(row.content);
    if (!content) return null;
    return { title: row.title, content };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ projectId: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { projectId, slug } = await params;
  const page = await getPublishedPage(projectId, requestedPageSlug(slug));
  if (!page) return {};

  return {
    title: page.title,
    openGraph: { title: page.title },
  };
}

export default async function PublishedWonderBuildPage({
  params,
}: {
  params: Promise<{ projectId: string; slug?: string[] }>;
}) {
  const { projectId, slug } = await params;
  const page = await getPublishedPage(projectId, requestedPageSlug(slug));
  if (!page) notFound();

  return <PublishedBuilderPage elements={page.content.elements} theme={page.content.theme} />;
}
