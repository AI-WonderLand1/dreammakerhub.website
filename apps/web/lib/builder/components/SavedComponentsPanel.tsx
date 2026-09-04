'use client';

import { useEffect, useMemo, useState } from 'react';
import { CopyPlus, Layers3, Save, Trash2 } from 'lucide-react';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';

const COMPONENTS_FILE = 'wonderbuild/components.json';

type SavedComponent = {
  id: string;
  name: string;
  element: CanvasElement;
};

type SavedComponentsState = {
  version: 1;
  components: SavedComponent[];
};

function findElement(elements: CanvasElement[], id: string | null): CanvasElement | null {
  if (!id) return null;
  for (const element of elements) {
    if (element.id === id) return element;
    const nested = findElement(element.children || [], id);
    if (nested) return nested;
  }
  return null;
}

function cloneWithFreshIds(element: CanvasElement): CanvasElement {
  return {
    ...element,
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    props: element.props ? { ...element.props } : {},
    styles: element.styles ? { ...element.styles } : {},
    children: element.children?.map((child) => cloneWithFreshIds(child)),
  };
}

export default function SavedComponentsPanel({ projectId }: { projectId: string }) {
  const elements = useBuilderStore((state) => state.elements);
  const selectedId = useBuilderStore((state) => state.selectedId);
  const addElement = useBuilderStore((state) => state.addElement);
  const selectElement = useBuilderStore((state) => state.selectElement);
  const selected = useMemo(() => findElement(elements, selectedId), [elements, selectedId]);

  const [components, setComponents] = useState<SavedComponent[]>([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    fetch(`/api/projects/${encodeURIComponent(projectId)}/files`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        const raw = data?.files?.[COMPONENTS_FILE];
        if (typeof raw !== 'string') return;
        try {
          const parsed = JSON.parse(raw) as SavedComponentsState;
          if (parsed?.version === 1 && Array.isArray(parsed.components)) setComponents(parsed.components);
        } catch {}
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persist = async (next: SavedComponent[]) => {
    setComponents(next);
    if (!projectId) return;
    setSaving(true);
    setStatus(null);
    try {
      const payload: SavedComponentsState = { version: 1, components: next };
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: { [COMPONENTS_FILE]: JSON.stringify(payload, null, 2) } }),
      });
      if (!response.ok) throw new Error('Save failed');
      setStatus('Saved');
    } catch {
      setStatus('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const saveSelected = () => {
    if (!selected) return;
    const component: SavedComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim() || selected.name,
      element: JSON.parse(JSON.stringify(selected)) as CanvasElement,
    };
    setName('');
    void persist([...components, component]);
  };

  const insertComponent = (component: SavedComponent) => {
    const element = cloneWithFreshIds(component.element);
    addElement(element);
    selectElement(element.id);
  };

  const removeComponent = (id: string) => {
    void persist(components.filter((component) => component.id !== id));
  };

  return (
    <section className="flex h-full min-h-0 w-full flex-col bg-[#070b16] text-white" aria-label="Reusable components panel">
      <div className="shrink-0 border-b border-white/8 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-300/15 bg-violet-500/10 text-violet-200">
              <Layers3 size={14} />
            </span>
            <div>
              <p className="text-[8px] font-black uppercase tracking-[.18em] text-violet-300/45">Reusable</p>
              <h3 className="text-[11px] font-black">Components</h3>
            </div>
          </div>
          <span className="text-[8px] font-semibold text-white/25">{saving ? 'Saving…' : status || ''}</span>
        </div>

        <div className="mt-3 rounded-lg border border-white/7 bg-white/[.02] p-2.5">
          <p className="text-[9px] font-semibold text-white/45">
            {selected ? `Selected: ${selected.name}` : 'Select a section or element on the canvas to save it.'}
          </p>
          <div className="mt-2 flex gap-1.5">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={selected?.name || 'Component name'}
              disabled={!selected}
              className="min-w-0 flex-1 rounded-md border border-white/8 bg-black/25 px-2 py-1.5 text-[9px] text-white outline-none placeholder:text-white/18 focus:border-violet-400/40 disabled:opacity-35"
            />
            <button
              type="button"
              onClick={saveSelected}
              disabled={!selected}
              className="flex h-8 items-center gap-1 rounded-md bg-violet-600 px-2 text-[8px] font-black text-white disabled:opacity-30"
            >
              <Save size={11} /> Save
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        <div className="space-y-1.5">
          {components.map((component) => (
            <article key={component.id} className="group flex items-center gap-2 rounded-lg border border-white/7 bg-white/[.02] p-2.5 hover:border-violet-300/18 hover:bg-violet-500/[.035]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-white/7 bg-black/20 text-sm">
                {component.element.icon || '◇'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-white/75">{component.name}</p>
                <p className="truncate text-[8px] text-white/25">{component.element.type}</p>
              </div>
              <button
                type="button"
                onClick={() => insertComponent(component)}
                className="flex h-7 items-center gap-1 rounded-md border border-violet-300/15 bg-violet-500/10 px-2 text-[8px] font-bold text-violet-200"
              >
                <CopyPlus size={10} /> Insert
              </button>
              <button
                type="button"
                onClick={() => removeComponent(component.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/20 opacity-0 transition hover:bg-red-500/10 hover:text-red-300 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Delete ${component.name}`}
              >
                <Trash2 size={10} />
              </button>
            </article>
          ))}

          {components.length === 0 && (
            <div className="rounded-lg border border-dashed border-white/8 p-6 text-center text-[9px] leading-5 text-white/25">
              Saved sections and components will appear here and can be inserted on any page in this project.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
