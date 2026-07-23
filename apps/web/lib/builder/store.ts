import { create } from 'zustand';
import { BuilderState, CanvasElement, Breakpoint, BuilderTheme, LeftPanelTab, RightPanelTab } from './types';

interface BuilderStore extends BuilderState {
  setElements: (elements: CanvasElement[]) => void;
  addElement: (element: CanvasElement, parentId?: string) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  updateElementProps: (id: string, props: Record<string, any>) => void;
  updateElementStyles: (id: string, styles: Record<string, any>) => void;
  setBreakpoint: (breakpoint: Breakpoint) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setShowGrid: (show: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  undo: () => void;
  redo: () => void;
  // Panels
  leftPanelTab: LeftPanelTab;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelTab: RightPanelTab;
  setRightPanelTab: (tab: RightPanelTab) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  // Accessibility & Theme
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
}

const initialTheme: BuilderTheme = {
  colors: {
    primary: '#7c3aed',
    secondary: '#06b6d4',
    background: '#0f172a',
    text: '#f8fafc',
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  },
};

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  elements: [],
  selectedId: null,
  activeBreakpoint: 'desktop',
  zoom: 1,
  pan: { x: 0, y: 0 },
  showGrid: true,
  snapToGrid: true,
  theme: initialTheme,
  history: { past: [], future: [] },
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

  setElements: (elements) => {
    const { elements: current, history } = get();
    set({
      elements,
      history: { past: [...history.past, current], future: [] },
    });
  },

  addElement: (element, parentId) => {
    const { elements, history } = get();
    if (parentId) {
      const newElements = elements.map((el) => {
        if (el.id === parentId) {
          return { ...el, children: [...(el.children || []), element] };
        }
        return el;
      });
      set({
        elements: newElements,
        history: { past: [...history.past, elements], future: [] },
      });
    } else {
      set({
        elements: [...elements, element],
        history: { past: [...history.past, elements], future: [] },
      });
    }
  },

  removeElement: (id) => {
    const { elements, history } = get();
    const removeRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.filter((el) => el.id !== id).map((el) => ({
        ...el,
        children: el.children ? removeRecursive(el.children) : undefined,
      }));
    set({
      elements: removeRecursive(elements),
      selectedId: get().selectedId === id ? null : get().selectedId,
      history: { past: [...history.past, elements], future: [] },
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

  setBreakpoint: (breakpoint) => set({ activeBreakpoint: breakpoint }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  setShowGrid: (show) => set({ showGrid: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),

  undo: () => {
    const { history, elements } = get();
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    set({
      elements: previous,
      history: { past: newPast, future: [elements, ...history.future] },
    });
  },

  redo: () => {
    const { history, elements } = get();
    if (history.future.length === 0) return;
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    set({
      elements: next,
      history: { past: [...history.past, elements], future: newFuture },
    });
  },
}));
