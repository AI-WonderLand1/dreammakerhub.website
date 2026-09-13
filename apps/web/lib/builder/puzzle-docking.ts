import type { CanvasElement } from './types';
import { useBuilderStore } from './store';
import { acceptsChildren, findElementInfo, isDescendantOf } from './dnd-utils';
import { findBlockDefinition } from './blocks/utils';

export const FREE_POSITION_KEY = '--wb-free-position';
export const FREE_HEIGHT_KEY = '--wb-free-height';
export const FREE_ORIGIN_POSITION_KEY = '--wb-free-origin-position';
export const FREE_ORIGIN_WIDTH_KEY = '--wb-free-origin-width';

export function isFreePositioned(el: CanvasElement): boolean {
  return String(el.styles?.[FREE_POSITION_KEY] || '') === '1';
}

export function pixelNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function canFitInside(parentType: string, childType: string): boolean {
  if (!acceptsChildren(parentType)) return false;
  const definition = findBlockDefinition(parentType);
  return !definition?.allowedChildren || definition.allowedChildren.includes(childType);
}

function elementIdsUnderPointer(clientX: number, clientY: number): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const hit of document.elementsFromPoint(clientX, clientY)) {
    let node = (hit as HTMLElement).closest<HTMLElement>('[data-wb-element-id]');
    while (node) {
      const id = node.dataset.wbElementId;
      if (id && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      const parent = node.parentElement;
      node = parent?.closest<HTMLElement>('[data-wb-element-id]') || null;
    }
  }

  return ids;
}

/**
 * Puzzle-style docking: if a freely moved element is released on a compatible
 * container, it snaps into that container as a normal child. Incompatible
 * pieces simply stay where the user released them. No color/status overlay is
 * needed because the structure itself is the feedback.
 */
export function tryPuzzleDock(elementId: string, clientX: number, clientY: number): boolean {
  if (typeof document === 'undefined') return false;

  const store = useBuilderStore.getState();
  const draggedInfo = findElementInfo(store.elements, elementId);
  if (!draggedInfo) return false;

  for (const targetId of elementIdsUnderPointer(clientX, clientY)) {
    if (targetId === elementId) continue;
    if (isDescendantOf(store.elements, targetId, elementId)) continue;

    const targetInfo = findElementInfo(store.elements, targetId);
    if (!targetInfo) continue;
    if (!canFitInside(targetInfo.el.type, draggedInfo.el.type)) continue;

    const originPosition = String(draggedInfo.el.styles?.[FREE_ORIGIN_POSITION_KEY] || '').trim();
    const originWidth = String(draggedInfo.el.styles?.[FREE_ORIGIN_WIDTH_KEY] || '').trim();

    store.updateElementStyles(elementId, {
      position: originPosition || undefined,
      left: undefined,
      top: undefined,
      right: undefined,
      bottom: undefined,
      width: originWidth || undefined,
      [FREE_POSITION_KEY]: undefined,
      [FREE_HEIGHT_KEY]: undefined,
      [FREE_ORIGIN_POSITION_KEY]: undefined,
      [FREE_ORIGIN_WIDTH_KEY]: undefined,
    });

    const latest = useBuilderStore.getState();
    const latestTarget = findElementInfo(latest.elements, targetId);
    latest.moveElement(elementId, targetId, latestTarget?.el.children?.length ?? 0);
    latest.selectElement(elementId);
    return true;
  }

  return false;
}
