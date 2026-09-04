import { create } from 'zustand';
import { BuilderState, CanvasElement, Breakpoint, BuilderTheme, LeftPanelTab, RightPanelTab } from './types';
import { addSitePage, normalizeSitePages, renameSitePage, switchSitePage, syncActivePageElements } from './pages';
import { getEventBus } from './pipeline/EventBus';
import { EventNames } from './pipeline/types';

interface BuilderStore extends BuilderState {
  projectId: string;
  setProjectId: (id: string) => void;
  setElements: (elements: CanvasElement[]) => void;
  createPage: (name?: string) => string;
  switchPage: (pageId: string) => boolean;
  renamePage: (pageId: string, name: string) => boolean;
  addElement: (element: CanvasElement, parentId?: string) => void;
  removeElement: (id: string) => void;
  moveElement: (id: string, targetParentId: string | null, index: number) => void;
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
      const site = normalizeSitePages(
        parsed.pages,
        parsed.activePageId,
        Array.isArray(parsed.elements) ? parsed.elements : undefined,
      );
      return {
        elements: site.elements,
        pages: site.pages,
        activePageId: site.activePageId,
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

function appendChildRecursive(
  elements: CanvasElement[],
  parentId: string,
  child: CanvasElement,
): { elements: CanvasElement[]; inserted: boolean } {
  let inserted = false;

  const next = elements.map((element) => {
    if (element.id === parentId) {
      inserted = true;
      return { ...element, children: [...(element.children || []), child] };
    }

    if (element.children?.length) {
      const nested = appendChildRecursive(element.children, parentId, child);
      if (nested.inserted) {
        inserted = true;
        return { ...element, children: nested.elements };
      }
    }

    return element;
  });

  return { elements: next, inserted };
}

function insertChildAtRecursive(
  elements: CanvasElement[],
  parentId: string,
  child: CanvasElement,
  index: number,
): { elements: CanvasElement[]; inserted: boolean } {
  let inserted = false;

  const next = elements.map((element) => {
    if (element.id === parentId) {
      const children = [...(element.children || [])];
      children.splice(Math.max(0, Math.min(index, children.length)), 0, child);
      inserted = true;
      return { ...element, children };
    }

    if (element.children?.length) {
      const nested = insertChildAtRecursive(element.children, parentId, child, index);
      if (nested.inserted) {
        inserted = true;
        return { ...element, children: nested.elements };
      }
    }

    return element;
  });

  return { elements: next, inserted };
}

function cloneElementTree(element: CanvasElement, root = true): CanvasElement {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    ...element,
    id: `el-${nonce}`,
    name: root ? `${element.name} (copy)` : element.name,
    children: element.children?.map((child) => cloneElementTree(child, false)),
  };
}

function duplicateRecursive(
  elements: CanvasElement[],
  id: string,
): { elements: CanvasElement[]; duplicateId: string | null } {
  let duplicateId: string | null = null;
  const next: CanvasElement[] = [];

  for (const element of elements) {
    if (element.id === id) {
      const duplicate = cloneElementTree(element);
      duplicateId = duplicate.id;
      next.push(element, duplicate);
      continue;
    }

    if (element.children?.length) {
      const nested = duplicateRecursive(element.children, id);
      if (nested.duplicateId) {
        duplicateId = nested.duplicateId;
        next.push({ ...element, children: nested.elements });
        continue;
      }
    }

    next.push(element);
  }

  return { elements: next, duplicateId };
}

const persisted = loadPersistedState();
const initialSite = normalizeSitePages(persisted.pages, persisted.activePageId, persisted.elements);

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  projectId: persisted.projectId || '',
  setProjectId: (id) => set({ projectId: id }),
  elements: initialSite.elements,
  pages: initialSite.pages,
  activePageId: initialSite.activePageId,
  selectedId: null,
  activeBreakpoint: 'desktop',
  zoom: persisted.zoom ?? 1,
  pan: persisted.pan ?? { x: 0, y: 0 },
  showGrid: persisted.showGrid ?? true,
  snapToGrid: persisted.snapToGrid ?? true,
  theme: initialTheme,
  history: { past: [], future: [] },

  setElements: (elements) => set((state) => ({
    elements,
    pages: syncActivePageElements(state.pages, state.activePageId, elements),
  })),

  createPage: (name = 'Untitled Page') => {
    const state = get();
    const next = addSitePage(state.pages, state.activePageId, state.elements, name);
    set({
      pages: next.pages,
      activePageId: next.activePageId,
      elements: next.elements,
      selectedId: null,
    });
    const bus = getEventBus();
    bus.emit(EventNames.HISTORY_CLEAR, {});
    bus.emit(EventNames.PROJECT_METADATA_UPDATED, {
      key: 'pages',
      value: { activePageId: next.activePageId, pageCount: next.pages.length },
    });
    return next.page.id;
  },

  switchPage: (pageId) => {
    const state = get();
    const next = switchSitePage(state.pages, state.activePageId, state.elements, pageId);
    if (!next) return false;
    set({
      pages: next.pages,
      activePageId: next.activePageId,
      elements: next.elements,
      selectedId: null,
    });
    const bus = getEventBus();
    bus.emit(EventNames.HISTORY_CLEAR, {});
    bus.emit(EventNames.PROJECT_METADATA_UPDATED, {
      key: 'activePageId',
      value: next.activePageId,
    });
    return true;
  },

  renamePage: (pageId, name) => {
    const state = get();
    if (!state.pages.some((page) => page.id === pageId)) return false;
    const syncedPages = syncActivePageElements(state.pages, state.activePageId, state.elements);
    const pages = renameSitePage(syncedPages, pageId, name);
    set({ pages });
    getEventBus().emit(EventNames.PROJECT_METADATA_UPDATED, {
      key: 'pageName',
      value: { pageId, name: pages.find((page) => page.id === pageId)?.name || name },
    });
    return true;
  },

  addElement: (element, parentId) => {
    const state = get();
    let nextElements: CanvasElement[];

    if (parentId) {
      const nested = appendChildRecursive(state.elements, parentId, element);
      // A stale target should not silently eat a block. Fall back to the page root.
      nextElements = nested.inserted ? nested.elements : [...state.elements, element];
    } else {
      nextElements = [...state.elements, element];
    }

    set({
      elements: nextElements,
      pages: syncActivePageElements(state.pages, state.activePageId, nextElements),
    });
  },

  removeElement: (id) => {
    const state = get();
    const removeRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.filter((el) => el.id !== id).map((el) => ({
        ...el,
        children: el.children ? removeRecursive(el.children) : undefined,
      }));
    const nextElements = removeRecursive(state.elements);
    set({
      elements: nextElements,
      pages: syncActivePageElements(state.pages, state.activePageId, nextElements),
      selectedId: state.selectedId === id ? null : state.selectedId,
    });
  },

  moveElement: (id, targetParentId, index) => {
    const state = get();
    let moved: CanvasElement | null = null;

    const stripRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els
        .filter((el) => {
          if (el.id === id) {
            moved = el;
            return false;
          }
          return true;
        })
        .map((el) => ({
          ...el,
          children: el.children ? stripRecursive(el.children) : undefined,
        }));

    const stripped = stripRecursive(state.elements);
    if (!moved) return;

    let result: CanvasElement[];
    if (targetParentId) {
      const nested = insertChildAtRecursive(stripped, targetParentId, moved, index);
      // If a target disappeared between drag start/end, preserve the moved block
      // instead of losing it from the page.
      result = nested.inserted ? nested.elements : [...stripped, moved];
    } else {
      result = [...stripped];
      result.splice(Math.max(0, Math.min(index, result.length)), 0, moved);
    }

    set({
      elements: result,
      pages: syncActivePageElements(state.pages, state.activePageId, result),
    });
  },

  selectElement: (id) => set({ selectedId: id }),

  updateElementProps: (id, props) => {
    const state = get();
    const updateRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.map((el) => {
        if (el.id === id) return { ...el, props: { ...el.props, ...props } };
        if (el.children) return { ...el, children: updateRecursive(el.children) };
        return el;
      });
    const nextElements = updateRecursive(state.elements);
    set({
      elements: nextElements,
      pages: syncActivePageElements(state.pages, state.activePageId, nextElements),
    });
  },

  updateElementStyles: (id, styles) => {
    const state = get();
    const updateRecursive = (els: CanvasElement[]): CanvasElement[] =>
      els.map((el) => {
        if (el.id === id) return { ...el, styles: { ...el.styles, ...styles } };
        if (el.children) return { ...el, children: updateRecursive(el.children) };
        return el;
      });
    const nextElements = updateRecursive(state.elements);
    set({
      elements: nextElements,
      pages: syncActivePageElements(state.pages, state.activePageId, nextElements),
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const duplicated = duplicateRecursive(state.elements, id);
    if (!duplicated.duplicateId) return;

    set({
      elements: duplicated.elements,
      pages: syncActivePageElements(state.pages, state.activePageId, duplicated.elements),
      selectedId: duplicated.duplicateId,
    });
  },

  clearElements: () => set((state) => ({
    elements: [],
    pages: syncActivePageElements(state.pages, state.activePageId, []),
  })),

  setBreakpoint: (breakpoint) => set({ activeBreakpoint: breakpoint }),
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (pan) => set({ pan }),
  setShowGrid: (show) => set({ showGrid: show }),
  setSnapToGrid: (snap) => set({ snapToGrid: snap }),

  undo: () => {
    getEventBus().emit(EventNames.HISTORY_UNDO, { elements: [] });
  },

  redo: () => {
    getEventBus().emit(EventNames.HISTORY_REDO, { elements: [] });
  },

  leftPanelTab: 'pages',
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
