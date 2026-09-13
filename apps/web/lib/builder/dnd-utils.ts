import type { CanvasElement, BlockDefinition } from './types';
import { BLOCKS } from './blocks';

export const CANVAS_ROOT_ID = 'canvas-root';

export const CONTAINER_TYPES = ['group', 'columns', 'row', 'grid', 'flex', 'section', 'container', 'card'];

// Any palette block that declares an allowedChildren list is a nestable
// container (covers Stack, Wrapper, Sidebar Layout, Masonry, Split Screen,
// Scroll Container, etc.). Legacy hardcoded types stay accepted for
// backward compatibility with saved builder states.
const REGISTRY_CONTAINER_TYPES = new Set(
  BLOCKS.filter((b) => b.allowedChildren && b.allowedChildren.length > 0).map((b) => b.type)
);

export function acceptsChildren(type: string): boolean {
  return REGISTRY_CONTAINER_TYPES.has(type) || CONTAINER_TYPES.includes(type);
}

export interface ElementInfo {
  el: CanvasElement;
  parentId: string | null;
  index: number;
}

/**
 * Resolve an element and its immediate parent at any nesting depth.
 *
 * The previous implementation overwrote the nested parent with the top-level
 * ancestor while unwinding recursion. That made a deeply nested block appear
 * to live one or more levels higher than it really did, so drag/drop could
 * move it into the wrong container.
 */
export function findElementInfo(
  elements: CanvasElement[],
  id: string,
  parentId: string | null = null,
): ElementInfo | null {
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.id === id) return { el, parentId, index: i };
    if (el.children?.length) {
      const nested = findElementInfo(el.children, id, el.id);
      if (nested) return nested;
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

function containsElement(elements: CanvasElement[] | undefined, id: string): boolean {
  if (!elements?.length) return false;
  for (const el of elements) {
    if (el.id === id) return true;
    if (containsElement(el.children, id)) return true;
  }
  return false;
}

/**
 * True when `id` is anywhere below `ancestorId`.
 *
 * This is used to stop a container from being dropped into one of its own
 * descendants, which would otherwise create an invalid/cyclic builder tree.
 */
export function isDescendantOf(elements: CanvasElement[], id: string, ancestorId: string): boolean {
  if (id === ancestorId) return false;
  const ancestor = findElementById(elements, ancestorId);
  return ancestor ? containsElement(ancestor.children, id) : false;
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
