'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, FilePlus2, Plus, Save, Trash2 } from 'lucide-react';

type CmsItem = {
  id: string;
  title: string;
  slug: string;
  fields: Record<string, string>;
};

type CmsCollection = {
  id: string;
  name: string;
  items: CmsItem[];
};

type CmsState = {
  version: 1;
  collections: CmsCollection[];
};

const CMS_FILE = 'wonderbuild/cms.json';
const EMPTY_STATE: CmsState = { version: 1, collections: [] };

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

export default function CMSPanel({ projectId }: { projectId: string }) {
  const [state, setState] = useState<CmsState>(EMPTY_STATE);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/projects/${encodeURIComponent(projectId)}/files`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const raw = data?.files?.[CMS_FILE];
        if (typeof raw !== 'string') return;
        try {
          const parsed = JSON.parse(raw) as CmsState;
          if (parsed?.version === 1 && Array.isArray(parsed.collections)) {
            setState(parsed);
            setSelectedCollectionId(parsed.collections[0]?.id || null);
          }
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selectedCollection = useMemo(
    () => state.collections.find((collection) => collection.id === selectedCollectionId) || null,
    [selectedCollectionId, state.collections],
  );

  const persist = async (next: CmsState) => {
    setState(next);
    if (!projectId) return;
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [CMS_FILE]: JSON.stringify(next, null, 2) } }),
      });
      if (!response.ok) throw new Error('Save failed');
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const collection: CmsCollection = { id: makeId('collection'), name, items: [] };
    const next = { ...state, collections: [...state.collections, collection] };
    setNewCollectionName('');
    setSelectedCollectionId(collection.id);
    void persist(next);
  };

  const addItem = () => {
    if (!selectedCollection) return;
    const item: CmsItem = { id: makeId('item'), title: 'Untitled', slug: 'untitled', fields: {} };
    const next: CmsState = {
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === selectedCollection.id
          ? { ...collection, items: [...collection.items, item] }
          : collection,
      ),
    };
    void persist(next);
  };

  const updateItem = (itemId: string, patch: Partial<CmsItem>) => {
    if (!selectedCollection) return;
    const next: CmsState = {
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === selectedCollection.id
          ? {
              ...collection,
              items: collection.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
            }
          : collection,
      ),
    };
    setState(next);
  };

  const deleteItem = (itemId: string) => {
    if (!selectedCollection) return;
    const next: CmsState = {
      ...state,
      collections: state.collections.map((collection) =>
        collection.id === selectedCollection.id
          ? { ...collection, items: collection.items.filter((item) => item.id !== itemId) }
          : collection,
      ),
    };
    void persist(next);
  };

  const deleteCollection = (collectionId: string) => {
    const next: CmsState = {
      ...state,
      collections: state.collections.filter((collection) => collection.id !== collectionId),
    };
    const nextSelected = next.collections[0]?.id || null;
    setSelectedCollectionId(nextSelected);
    void persist(next);
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-[#070b16] text-white" aria-label="CMS panel">
      <div className="shrink-0 border-b border-white/8 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-500/10 text-violet-200">
              <Database size={14} />
            </span>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.18em] text-violet-300/45">Content</p>
              <h3 className="text-[11px] font-black">CMS</h3>
            </div>
          </div>
          <span className="text-[8px] font-semibold text-white/25">{saving ? 'Saving…' : status || ''}</span>
        </div>

        <div className="mt-3 flex gap-1.5">
          <input
            value={newCollectionName}
            onChange={(event) => setNewCollectionName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addCollection();
            }}
            placeholder="New collection, e.g. Blog"
            className="min-w-0 flex-1 rounded-lg border border-white/8 bg-black/25 px-2.5 py-2 text-[10px] text-white outline-none placeholder:text-white/20 focus:border-violet-400/40"
          />
          <button
            type="button"
            onClick={addCollection}
            disabled={!newCollectionName.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white disabled:opacity-30"
            aria-label="Add CMS collection"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)]">
        <div className="flex gap-1 overflow-x-auto border-b border-white/8 p-2">
          {state.collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => setSelectedCollectionId(collection.id)}
              className={`shrink-0 rounded-md px-2 py-1.5 text-[9px] font-bold ${
                collection.id === selectedCollectionId
                  ? 'bg-violet-500/15 text-violet-200'
                  : 'text-white/35 hover:bg-white/[.04] hover:text-white/65'
              }`}
            >
              {collection.name} <span className="text-white/20">{collection.items.length}</span>
            </button>
          ))}
          {state.collections.length === 0 && (
            <p className="px-1 py-2 text-[9px] text-white/25">Create a collection for posts, products, team members, or custom content.</p>
          )}
        </div>

        <div className="min-h-0 overflow-y-auto p-2.5">
          {selectedCollection ? (
            <>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[.16em] text-white/25">Collection</p>
                  <p className="text-[11px] font-bold text-white/80">{selectedCollection.name}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex h-7 items-center gap-1 rounded-md border border-violet-300/15 bg-violet-500/10 px-2 text-[8px] font-bold text-violet-200"
                  >
                    <FilePlus2 size={11} /> Add item
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCollection(selectedCollection.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-white/25 hover:bg-red-500/10 hover:text-red-300"
                    aria-label={`Delete ${selectedCollection.name}`}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {selectedCollection.items.map((item) => (
                  <article key={item.id} className="rounded-lg border border-white/7 bg-white/[.02] p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <input
                          value={item.title}
                          onChange={(event) => {
                            const title = event.target.value;
                            updateItem(item.id, { title, slug: slugify(title) });
                          }}
                          onBlur={() => void persist(state)}
                          className="w-full rounded-md border border-white/8 bg-black/25 px-2 py-1.5 text-[10px] font-semibold text-white outline-none focus:border-violet-400/40"
                          aria-label="CMS item title"
                        />
                        <input
                          value={item.slug}
                          onChange={(event) => updateItem(item.id, { slug: slugify(event.target.value) })}
                          onBlur={() => void persist(state)}
                          className="w-full rounded-md border border-white/6 bg-black/15 px-2 py-1 text-[8px] font-mono text-white/45 outline-none focus:border-violet-400/30"
                          aria-label="CMS item slug"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-white/20 hover:bg-red-500/10 hover:text-red-300"
                        aria-label={`Delete ${item.title}`}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </article>
                ))}
                {selectedCollection.items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-white/8 p-5 text-center text-[9px] text-white/25">
                    No content yet. Add the first item.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => void persist(state)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/8 bg-white/[.03] py-2 text-[9px] font-bold text-white/45 hover:text-white"
              >
                <Save size={11} /> Save CMS
              </button>
            </>
          ) : (
            <div className="flex h-full items-center justify-center p-5 text-center text-[9px] leading-5 text-white/25">
              CMS content stays with this project and is stored separately from page layout.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
