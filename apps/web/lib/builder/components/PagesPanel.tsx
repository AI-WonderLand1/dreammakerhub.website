'use client';

import { useMemo, useState } from 'react';
import { FileText, Home, Pencil, Plus, Search } from 'lucide-react';
import { useBuilderStore } from '../store';
import LayersPanel from './LayersPanel';

export default function PagesPanel() {
  const pages = useBuilderStore((state) => state.pages);
  const activePageId = useBuilderStore((state) => state.activePageId);
  const createPage = useBuilderStore((state) => state.createPage);
  const switchPage = useBuilderStore((state) => state.switchPage);
  const renamePage = useBuilderStore((state) => state.renamePage);

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [query, setQuery] = useState('');

  const visiblePages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pages;
    return pages.filter((page) =>
      page.name.toLowerCase().includes(normalized) || page.slug.toLowerCase().includes(normalized),
    );
  }, [pages, query]);

  const selectPage = (pageId: string) => {
    if (useBuilderStore.getState().activePageId !== pageId) {
      switchPage(pageId);
    }
  };

  const beginRename = (pageId: string, name: string) => {
    setEditingPageId(pageId);
    setDraftName(name);
  };

  const cancelRename = () => {
    setEditingPageId(null);
    setDraftName('');
  };

  const commitRename = (pageId: string) => {
    if (editingPageId !== pageId) return;
    renamePage(pageId, draftName);
    cancelRename();
  };

  return (
    <section className="wb-pages-dock grid h-full min-h-0 w-full grid-rows-[minmax(220px,44%)_minmax(0,1fr)] bg-[#070b16] text-white" aria-label="Pages panel">
      <div className="flex min-h-0 flex-col border-b border-white/8">
        <div className="shrink-0 px-3 pb-2 pt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.22em] text-violet-300/45">Website</p>
              <h3 className="mt-0.5 text-[11px] font-black text-white">Pages <span className="text-white/25">{pages.length}</span></h3>
            </div>
            <button
              type="button"
              onClick={() => createPage()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-violet-300/15 bg-violet-500/10 text-violet-200 transition hover:border-violet-300/35 hover:bg-violet-500/20 hover:text-white"
              title="Add page"
              aria-label="Add page"
            >
              <Plus size={13} aria-hidden="true" />
            </button>
          </div>

          <label className="flex h-8 items-center gap-2 rounded-md border border-white/8 bg-black/25 px-2 text-white/35 transition focus-within:border-violet-400/35 focus-within:text-violet-200">
            <Search size={12} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pages..."
              className="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none placeholder:text-white/20"
              aria-label="Search pages"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="space-y-0.5" role="list" aria-label="Site pages">
            {visiblePages.map((page) => {
              const isActive = page.id === activePageId;
              const isHome = page.slug === '/';
              const isEditing = page.id === editingPageId;
              const PageIcon = isHome ? Home : FileText;
              const displaySlug = isHome ? '/' : `/${page.slug.replace(/^\/+/, '')}`;

              return (
                <div
                  key={page.id}
                  role="listitem"
                  className={`group flex min-h-9 items-center gap-2 rounded-md border px-2 py-1 transition ${
                    isActive
                      ? 'border-violet-400/25 bg-violet-500/14 shadow-[inset_2px_0_0_rgba(139,92,246,.95)]'
                      : 'border-transparent hover:border-white/7 hover:bg-white/[.035]'
                  }`}
                >
                  <PageIcon
                    size={12}
                    className={isHome ? 'shrink-0 text-violet-300' : 'shrink-0 text-white/30'}
                    aria-hidden="true"
                  />

                  {isEditing ? (
                    <input
                      autoFocus
                      value={draftName}
                      onChange={(event) => setDraftName(event.target.value)}
                      onBlur={() => commitRename(page.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          event.currentTarget.blur();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          cancelRename();
                        }
                      }}
                      onClick={(event) => event.stopPropagation()}
                      className="min-w-0 flex-1 rounded border border-violet-400/40 bg-black/40 px-1.5 py-1 text-[10px] font-semibold text-white outline-none"
                      aria-label={`Rename ${page.name}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => selectPage(page.id)}
                      onDoubleClick={() => beginRename(page.id, page.name)}
                      className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                      title="Open page — double-click to rename"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="truncate text-[10px] font-semibold text-white/78 group-hover:text-white">{page.name}</span>
                      <span className="max-w-[74px] truncate font-mono text-[8px] text-white/24">{displaySlug}</span>
                    </button>
                  )}

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => beginRename(page.id, page.name)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/18 opacity-0 transition hover:bg-white/5 hover:text-white/65 group-hover:opacity-100 focus:opacity-100"
                      title={`Rename ${page.name}`}
                      aria-label={`Rename ${page.name}`}
                    >
                      <Pencil size={10} aria-hidden="true" />
                    </button>
                  )}
                </div>
              );
            })}

            {visiblePages.length === 0 && (
              <div className="px-2 py-6 text-center text-[9px] text-white/25">No pages match “{query}”.</div>
            )}
          </div>
        </div>
      </div>

      <LayersPanel embedded />
    </section>
  );
}
