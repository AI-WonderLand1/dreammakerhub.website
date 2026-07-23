import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { logger } from '@/lib/logger';

export class ProjectStateManager {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;
  private lastElementsHash = '';

  setProjectId(id: string): void {
    this.projectId = id;
  }

  start(): void {
    this.unsubs.push(
      useBuilderStore.subscribe((state, prev) => {
        if (state.elements !== prev.elements) {
          const hash = hashElements(state.elements);
          if (hash !== this.lastElementsHash) {
            this.lastElementsHash = hash;
            this.bus.emit(EventNames.PROJECT_STATE_CHANGED, {
              elements: state.elements,
            }, { batch: true });
          }
        }
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_ADDED, (event) => {
        const { element } = event.payload;
        logger.info(`[ProjectState] Added: ${element.name} (${element.type})`);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, (event) => {
        const { element } = event.payload;
        logger.info(`[ProjectState] Removed: ${element.name}`);
      })
    );
  }

  getSnapshot(): { elements: CanvasElement[]; timestamp: number } {
    return {
      elements: useBuilderStore.getState().elements,
      timestamp: Date.now(),
    };
  }

  loadSnapshot(elements: CanvasElement[]): void {
    this.lastElementsHash = '';
    useBuilderStore.getState().setElements(elements);
    this.bus.emit(EventNames.PROJECT_LOADED, {
      elements,
      projectId: this.projectId || 'local',
    });
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

function hashElements(elements: CanvasElement[]): string {
  let h = 0;
  const s = JSON.stringify(elements);
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

export const projectStateManager = new ProjectStateManager();
