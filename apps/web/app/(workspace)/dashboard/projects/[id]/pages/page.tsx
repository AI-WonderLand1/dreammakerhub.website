'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Page {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function PagesManagementPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPages = async () => {
    try {
      const res = await fetch('/api/pages?limit=100');
      const data = await res.json();
      if (data.ok) {
        setPages(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleTogglePublish = async (page: Page) => {
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !page.published }),
      });
      const data = await res.json();
      if (data.ok) {
        setPages((prev) =>
          prev.map((p) => (p.id === page.id ? { ...p, published: !p.published } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    }
  };

  const handleDelete = async (page: Page) => {
    if (!confirm(`Delete "${page.title}"?`)) return;
    try {
      await fetch(`/api/pages/${page.id}`, { method: 'DELETE' });
      setPages((prev) => prev.filter((p) => p.id !== page.id));
    } catch (err) {
      console.error('Failed to delete page:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-white/40">Loading pages...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Published Pages</h1>
        <Link
          href={`/wonder-build/builder?projectId=${projectId}`}
          className="rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:opacity-90"
        >
          + New Page
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-white/60">No pages yet</p>
          <p className="text-sm text-white/40 mt-1">Create a page in the builder and publish it</p>
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Updated</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr key={page.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-white">{page.title}</td>
                  <td className="px-4 py-3 text-sm text-white/50">/{page.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTogglePublish(page)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        page.published
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {page.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40">
                    {new Date(page.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {page.published && (
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded px-2 py-1 text-[10px] text-white/50 hover:bg-white/10 hover:text-white"
                        >
                          View
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(page)}
                        className="rounded px-2 py-1 text-[10px] text-red-400/60 hover:bg-white/10 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
