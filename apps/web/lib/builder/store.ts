import { create } from 'zustand';
import { BuilderState, CanvasElement, Breakpoint, BuilderTheme } from './types';

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
  undo: () => void;
  redo: () => void;
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
  theme: initialTheme,
  history: { past: [], future: [] },

  setElements: (elements) => {
    const { elements: current, history } = get();
    set({
      elements,
      history: { past: [...history.past, current], future: [] },
    });
  },

  addElement: (element, parentId) => {
    const { elements, history } = get();
    const newElements = [...elements, element];
    set({
      elements: newElements,
      history: { past: [...history.past, elements], future: [] },
    });
  },

  removeElement: (id) => {
    const { elements, history } = get();
    const newElements = elements.filter((el) => el.id !== id);
    set({
      elements: newElements,
      selectedId: get().selectedId === id ? null : get().selectedId,
      history: { past: [...history.past, elements], future: [] },
    });
  },

  selectElement: (id) => set({ selectedId: id }),

  updateElementProps: (id, props) => {
    const { elements } = get();
    set({
      elements: elements.map((el) => (el.id === id ? { ...el, props: { ...el.props, ...props } } : el)),
    });
  },

  updateElementStyles: (id, styles) => {
    const { elements } = get();
    set({
      elements: elements.map((el) => (el.id === id ? { ...el, styles: { ...el.styles, ...styles } } : el)),
    });
  },

  setBreakpoint: (breakpoint) => set({ activeBreakpoint: breakpoint }),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),

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
