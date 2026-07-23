import { getEventBus } from './EventBus';
import { EventNames, type EventPayload } from './types';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { logger } from '@/lib/logger';

export class ProjectStateManager {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;

  setProjectId(id: string): void {
    this.projectId = id;
  }

  start(): void {
    // Track full state changes
    this.unsubs.push(
      useBuilderStore.subscribe((state, prev) => {
        if (state.elements !== prev.elements) {
          this.bus.emit(EventNames.PROJECT_STATE_CHANGED, { elements: state.elements }, { batch: true });
        }
      })
    );

    // Log element changes
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_ADDED, (event) => {
        const { element } = event.payload as EventPayload<typeof EventNames.ELEMENT_ADDED>;
        logger.info(`[ProjectState] Element added: ${element.name} (${element.type})`);
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, (event) => {
        const { element } = event.payload as EventPayload<typeof EventNames.ELEMENT_REMOVED>;
        logger.info(`[ProjectState] Element removed: ${element.name} (${element.id.slice(0, 8)})`);
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

export const projectStateManager = new ProjectStateManager();
