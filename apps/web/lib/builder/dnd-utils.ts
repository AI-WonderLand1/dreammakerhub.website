import type { CanvasElement, BlockDefinition } from './types';

export const CANVAS_ROOT_ID = 'canvas-root';

export const CONTAINER_TYPES = ['group', 'columns', 'row', 'grid', 'flex', 'section', 'container', 'card'];

export interface ElementInfo {
  el: CanvasElement;
  parentId: string | null;
  index: number;
}

export function findElementInfo(elements: CanvasElement[], id: string): ElementInfo | null {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.id === id) return { el, parentId: null, index: i };
    if (el.children?.length) {
      const nested = findElementInfo(el.children, id);
      if (nested) return { el: nested.el, parentId: el.id, index: nested.index };
    }
  }
  return null;
}

export function findElementById(elements: CanvasElement[], id: string): CanvasElement | null {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children?.length) {
      const nested = findElementById(el.children, id);
      if (nested) return nested;
    }
  }
  return null;
}

export function isDescendantOf(elements: CanvasElement[], id: string, ancestorId: string): boolean {
  for (const el of elements) {
    if (el.id === id) return false;
    if (el.id === ancestorId) {
      return el.children?.some((c) => c.id === id || isDescendantOf([c], id, ancestorId)) ?? false;
    }
    if (el.children?.length && isDescendantOf(el.children, id, ancestorId)) return true;
  }
  return false;
}

export function blockToCanvasElement(block: BlockDefinition): CanvasElement {
  return {
    id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: block.type,
    name: block.name,
    icon: block.icon,
    props: { ...block.defaultProps },
    styles: { ...block.defaultStyles },
  };
}
