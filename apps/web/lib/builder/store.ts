import { create } from 'zustand';
import { BuilderState, CanvasElement, Breakpoint, BuilderTheme, LeftPanelTab, RightPanelTab } from './types';
import { getEventBus } from './pipeline/EventBus';

interface BuilderStore extends BuilderState {
  projectId: string;
  setProjectId: (id: string) => void;
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement, parentId?: string) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  updateElementProps: (id: string, props: Record<string, any>) => void;
  updateElementStyles: (id: string, styles: Record<string, any>) => void;
  duplicateElement: (id: string) => void;
  clearElements: () => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  undo: () => void;
  redo: () => void;
  leftPanelTab: LeftPanelTab;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  uiScale: number;
  setUiScale: (v: number) => void;
  themeMode: 'dark' | 'light';
  setThemeMode: (v: 'dark' | 'light') => void;
  voiceInputEnabled: boolean;
  setVoiceInputEnabled: (v: boolean) => void;
  shortcutsModalOpen: boolean;
  setShortcutsModalOpen: (v: boolean) => void;
  previewMode: boolean;
  setPreviewMode: (v: boolean) => void;
}

const initialTheme: BuilderTheme = {
  colors: {
    primary: '#7c3aed',
    secondary: '#06b6d4',
    background: '#0f172a',
    text: '#f8fafc',
  },
  fonts: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
  spacing: { sm: '0.5rem', md: '1rem', lg: '2rem' },
  borderRadius: { sm: '0.25rem', md: '0.5rem', lg: '1rem' },
};

const STORAGE_KEY = 'aiw-builder-state';

function loadPersistedState(): Partial<BuilderState & { projectId?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        elements: parsed.elements || [],
        zoom: parsed.zoom ?? 1,
        pan: parsed.pan ?? { x: 0, y: 0 },
        showGrid: parsed.showGrid ?? true,
        snapToGrid: parsed.snapToGrid ?? true,
        projectId: parsed.projectId || '',
      };
    }
  } catch {}
  return {};
}

const persisted = loadPersistedState();

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  projectId: persisted.projectId || '',
  setProjectId: (id) => set({ projectId: id }),
  elements: persisted.elements || [],
  selectedId: null,
  activeBreakpoint: 'desktop',
  zoom: persisted.zoom ?? 1,
  pan: persisted.pan ?? { x: 0, y: 0 },
  showGrid: persisted.showGrid ?? true,
  snapToGrid: persisted.snapToGrid ?? true,
  theme: initialTheme,
  history: { past: [], future: [] },

  setElements: (elements) => set({ elements }),

  addElement: (element, parentId) => {
    const { elements } = get();
    if (parentId) {
      const newElements = elements.map((el) => {
        if (el.id === parentId) {
          return { ...el, children: [...(el.children || []), element] };
        }
        return el;
      });
      set({ elements: newElements });
    } else {
      set({ elements: [...elements, element] });
    }
  },

  removeElement: (id) => {
    const { elements } = get();
    const removeRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.filter((el) => el.id !== id).map((el) => ({
        ...el,
        children: el.children ? removeRecursive(el.children) : undefined,
      }));
    set({
      elements: removeRecursive(elements),
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
  },

  selectElement: (id) => set({ selectedId: id }),

  updateElementProps: (id, props) => {
    const { elements } = get();
    const updateRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.map((el) => {
        if (el.id === id) return { ...el, props: { ...el.props, ...props } };
        if (el.children) return { ...el, children: updateRecursive(el.children) };
        return el;
      });
    set({ elements: updateRecursive(elements) });
  },

  updateElementStyles: (id, styles) => {
    const { elements } = get();
    const updateRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.map((el) => {
        if (el.id === id) return { ...el, styles: { ...el.styles, ...styles } };
        if (el.children) return { ...el, children: updateRecursive(el.children) };
        return el;
      });
    set({ elements: updateRecursive(elements) });
  },

  duplicateElement: (id) => {
    const { elements } = get();
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const dup: CanvasElement = {
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${el.name} (copy)`,
    };
    set({ elements: [...elements, dup] });
  },

  clearElements: () => set({ elements: [] }),

  setBreakpoint: (breakpoint) => set({ activeBreakpoint: breakpoint }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  setShowGrid: (show) => set({ showGrid: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),

  undo: () => {
    getEventBus().emit('history:undo' as any, { elements: [] });
  },

  redo: () => {
    getEventBus().emit('history:redo' as any, { elements: [] });
  },

  leftPanelTab: 'blocks',
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  leftPanelOpen: true,
  setLeftPanelOpen: (open) => set({ leftPanelOpen: open }),
  rightPanelTab: 'content',
  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  rightPanelOpen: true,
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  highContrast: false,
  setHighContrast: (v) => set({ highContrast: v }),
  uiScale: 100,
  setUiScale: (v) => set({ uiScale: Math.max(75, Math.min(150, v)) }),
  themeMode: 'dark',
  setThemeMode: (v) => set({ themeMode: v }),
  voiceInputEnabled: false,
  setVoiceInputEnabled: (v) => set({ voiceInputEnabled: v }),
  shortcutsModalOpen: false,
  setShortcutsModalOpen: (v) => set({ shortcutsModalOpen: v }),
  previewMode: false,
  setPreviewMode: (v) => set({ previewMode: v }),
}));
