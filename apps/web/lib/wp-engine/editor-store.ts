'use client';
import { create } from 'zustand';
import { CanvasElement } from '@/lib/builder/types';
import { WPConnectionConfig } from '@/lib/wp-engine/types';

export type WpEditorStatus = 'draft' | 'publish';

interface WpEditorState {
  elements: CanvasElement[];
  selectedId: string | null;
  title: string;
  status: WpEditorStatus;
  connection: WPConnectionConfig | null;
  connected: boolean;
  connecting: boolean;
  connectionError: string | null;
  leftOpen: boolean;
  rightOpen: boolean;
  search: string;
  activeCategory: string;

  setElements: (elements: CanvasElement[]) => void;
  setTitle: (title: string) => void;
  setStatus: (status: WpEditorStatus) => void;
  select: (id: string | null) => void;
  addBlock: (element: CanvasElement, index?: number) => void;
  updateProps: (id: string, props: Record<string, any>) => void;
  updateStyles: (id: string, styles: Record<string, any>) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  setConnection: (config: WPConnectionConfig | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (v: boolean) => void;
  setConnectionError: (msg: string | null) => void;
  setLeftOpen: (v: boolean) => void;
  setRightOpen: (v: boolean) => void;
  setSearch: (v: string) => void;
  setActiveCategory: (v: string) => void;
}

function reorder(elements: CanvasElement[], id: string, dir: -1 | 1): CanvasElement[] {
  const idx = elements.findIndex((el) => el.id === id);
  const target = idx + dir;
  if (idx === -1 || target < 0 || target >= elements.length) return elements;
  const next = [...elements];
  const [item] = next.splice(idx, 1);
  next.splice(target, 0, item);
  return next;
}

export const useWpEditorStore = create<WpEditorState>((set, get) => ({
  elements: [],
  selectedId: null,
  title: '',
  status: 'draft',
  connection: null,
  connected: false,
  connecting: false,
  connectionError: null,
  leftOpen: true,
  rightOpen: true,
  search: '',
  activeCategory: 'forms',

  setElements: (elements) => set({ elements }),
  setTitle: (title) => set({ title }),
  setStatus: (status) => set({ status }),
  select: (id) => set({ selectedId: id }),
  addBlock: (element, index) => {
    const { elements } = get();
    const next = [...elements];
    if (typeof index === 'number' && index >= 0 && index <= next.length) {
      next.splice(index, 0, element);
    } else {
      next.push(element);
    }
    set({ elements: next, selectedId: element.id });
  },
  updateProps: (id, props) => {
    const { elements } = get();
    set({
      elements: elements.map((el) =>
        el.id === id ? { ...el, props: { ...el.props, ...props } } : el
      ),
    });
  },
  updateStyles: (id, styles) => {
    const { elements } = get();
    set({
      elements: elements.map((el) =>
        el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el
      ),
    });
  },
  removeBlock: (id) => {
    const { elements, selectedId } = get();
    set({
      elements: elements.filter((el) => el.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },
  duplicateBlock: (id) => {
    const { elements } = get();
    const idx = elements.findIndex((el) => el.id === id);
    if (idx === -1) return;
    const src = elements[idx];
    const copy: CanvasElement = {
      ...src,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${src.name} (copy)`,
    };
    const next = [...elements];
    next.splice(idx + 1, 0, copy);
    set({ elements: next, selectedId: copy.id });
  },
  moveBlock: (id, dir) => set({ elements: reorder(get().elements, id, dir) }),
  setConnection: (config) => set({ connection: config }),
  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setConnectionError: (msg) => set({ connectionError: msg }),
  setLeftOpen: (v) => set({ leftOpen: v }),
  setRightOpen: (v) => set({ rightOpen: v }),
  setSearch: (v) => set({ search: v }),
  setActiveCategory: (v) => set({ activeCategory: v }),
}));
