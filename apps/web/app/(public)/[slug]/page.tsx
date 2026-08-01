import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Page {
  id: string;
  title: string;
  slug: string;
  body_html: string;
  cover_image_url: string | null;
  content: unknown;
  published: boolean;
  created_at: string;
  updated_at: string;
}

async function getPageBySlug(slug: string): Promise<Page | null> {
  const { rows } = await query(
    'SELECT * FROM pages WHERE slug = $1 AND published = true',
    [slug]
  );
  return rows[0] || null;
}

export async function generateStaticParams() {
  const { rows } = await query('SELECT slug FROM pages WHERE published = true');
  return rows.map((row: { slug: string }) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) return {};

  return {
    title: page.title,
    openGraph: {
      title: page.title,
      images: page.cover_image_url ? [page.cover_image_url] : [],
    },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) notFound();

  return (
    <article className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold text-white">{page.title}</h1>
      {page.cover_image_url && (
        <img
          src={page.cover_image_url}
          alt={page.title}
          className="mb-8 w-full rounded-lg object-cover"
        />
      )}
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: page.body_html }}
      />
    </article>
  );
}
