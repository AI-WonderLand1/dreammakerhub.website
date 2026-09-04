'use client';

import { useState } from 'react';
import { FileText, Home, Pencil, Plus } from 'lucide-react';
import { useBuilderStore } from '../store';

export default function PagesPanel() {
  const pages = useBuilderStore((state) => state.pages);
  const activePageId = useBuilderStore((state) => state.activePageId);
  const createPage = useBuilderStore((state) => state.createPage);
  const switchPage = useBuilderStore((state) => state.switchPage);
  const renamePage = useBuilderStore((state) => state.renamePage);

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

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
    <section className="flex h-full w-[23.4rem] flex-col bg-[#0c101d] text-white" aria-label="Pages panel">
      <div className="shrink-0 border-b border-white/10 px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[.2em] text-violet-300/45">Site</p>
            <h3 className="mt-1 text-xs font-black text-white">Pages <span className="text-white/25">{pages.length}</span></h3>
          </div>
          <button
            type="button"
            onClick={() => createPage()}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-violet-300/15 bg-violet-500/10 px-2 text-[9px] font-bold text-violet-200 transition hover:border-violet-300/30 hover:bg-violet-500/20 hover:text-white"
            title="Add page"
            aria-label="Add page"
          >
            <Plus size={13} aria-hidden="true" />
            Add Page
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5">
        <div className="space-y-1" role="list" aria-label="Site pages">
          {pages.map((page) => {
            const isActive = page.id === activePageId;
            const isHome = page.slug === '/';
            const isEditing = page.id === editingPageId;
            const PageIcon = isHome ? Home : FileText;

            return (
              <div
                key={page.id}
                role="listitem"
                className={`group flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition ${
                  isActive
                    ? 'border-violet-400/30 bg-violet-500/15 shadow-[inset_3px_0_0_rgba(139,92,246,.85)]'
                    : 'border-transparent bg-white/[.015] hover:border-white/8 hover:bg-white/[.04]'
                }`}
              >
                <PageIcon
                  size={14}
                  className={isHome ? 'shrink-0 text-amber-300/80' : 'shrink-0 text-white/35'}
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
                    className="min-w-0 flex-1 rounded-md border border-violet-400/40 bg-black/35 px-2 py-1 text-[11px] font-semibold text-white outline-none focus:border-violet-300/70"
                    aria-label={`Rename ${page.name}`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => switchPage(page.id)}
                    onDoubleClick={() => beginRename(page.id, page.name)}
                    className="min-w-0 flex-1 text-left"
                    title="Open page — double-click to rename"
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="block truncate text-[11px] font-semibold text-white/80 group-hover:text-white">
                      {page.name}
                    </span>
                    {isHome && (
                      <span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[.14em] text-amber-200/45">
                        Home
                      </span>
                    )}
                  </button>
                )}

                {isActive && !isEditing && (
                  <span className="rounded bg-violet-400/10 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[.12em] text-violet-200/80">
                    Active
                  </span>
                )}

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => beginRename(page.id, page.name)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/20 opacity-0 transition hover:bg-white/5 hover:text-white/70 group-hover:opacity-100 focus:opacity-100"
                    title={`Rename ${page.name}`}
                    aria-label={`Rename ${page.name}`}
                  >
                    <Pencil size={11} aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-white/8 px-3.5 py-2 text-[8px] text-white/20">
        Double-click a page name to rename it.
      </div>
    </section>
  );
}
