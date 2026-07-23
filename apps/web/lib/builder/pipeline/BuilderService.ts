import { getEventBus } from './EventBus';
import { EventNames, EventPayload } from './types';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { transactionManager } from './TransactionManager';

export class BuilderService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];

  start(): void {
    // Subscribe to element events and apply to store
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_ADDED, (event) => {
        const { element, parentId } = event.payload as EventPayload<typeof EventNames.ELEMENT_ADDED>;
        useBuilderStore.getState().addElement(element, parentId);
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, (event) => {
        const { elementId } = event.payload as EventPayload<typeof EventNames.ELEMENT_REMOVED>;
        useBuilderStore.getState().removeElement(elementId);
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_UPDATED, (event) => {
        const { elementId, props } = event.payload as EventPayload<typeof EventNames.ELEMENT_UPDATED>;
        useBuilderStore.getState().updateElementProps(elementId, props);
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_STYLES_CHANGED, (event) => {
        const { elementId, styles } = event.payload as EventPayload<typeof EventNames.ELEMENT_STYLES_CHANGED>;
        useBuilderStore.getState().updateElementStyles(elementId, styles);
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_SELECTED, (event) => {
        const { elementId } = event.payload as EventPayload<typeof EventNames.ELEMENT_SELECTED>;
        useBuilderStore.getState().selectElement(elementId);
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.ELEMENTS_CLEARED, () => {
        useBuilderStore.getState().setElements([]);
      })
    );

    // Subscribe to store changes and emit events
    this.unsubs.push(
      useBuilderStore.subscribe((state, prev) => {
        if (state.selectedId !== prev.selectedId) {
          this.bus.emit(EventNames.ELEMENT_SELECTED, { elementId: state.selectedId });
        }
      })
    );
  }

  // ─── Actions that emit events ─────────────────────────────

  async addElement(element: CanvasElement, parentId?: string): Promise<void> {
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        useBuilderStore.getState().removeElement(element.id);
      });
      this.bus.emit(EventNames.ELEMENT_ADDED, { element, parentId }, { transactionId: txId });
    });
  }

  async removeElement(elementId: string): Promise<void> {
    const el = useBuilderStore.getState().elements.find((e) => e.id === elementId);
    if (!el) return;
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        useBuilderStore.getState().addElement(el);
      });
      this.bus.emit(EventNames.ELEMENT_REMOVED, { elementId, element: el }, { transactionId: txId });
    });
  }

  async updateElement(elementId: string, props: Record<string, any>): Promise<void> {
    const prev = useBuilderStore.getState().elements.find((e) => e.id === elementId)?.props || {};
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        useBuilderStore.getState().updateElementProps(elementId, prev);
      });
      this.bus.emit(EventNames.ELEMENT_UPDATED, { elementId, props, previousProps: prev }, { transactionId: txId, batch: true });
    });
  }

  async updateElementStyles(elementId: string, styles: Record<string, any>): Promise<void> {
    const prev = useBuilderStore.getState().elements.find((e) => e.id === elementId)?.styles || {};
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        useBuilderStore.getState().updateElementStyles(elementId, prev);
      });
      this.bus.emit(EventNames.ELEMENT_STYLES_CHANGED, { elementId, styles, previousStyles: prev }, { transactionId: txId, batch: true });
    });
  }

  async selectElement(elementId: string | null): Promise<void> {
    this.bus.emit(EventNames.ELEMENT_SELECTED, { elementId });
  }

  async duplicateElement(elementId: string): Promise<void> {
    const el = useBuilderStore.getState().elements.find((e) => e.id === elementId);
    if (!el) return;
    const dup: CanvasElement = {
      ...el,
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `${el.name} (copy)`,
    };
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        useBuilderStore.getState().removeElement(dup.id);
      });
      this.bus.emit(EventNames.ELEMENT_DUPLICATED, { originalId: elementId, newElement: dup }, { transactionId: txId });
      this.bus.emit(EventNames.ELEMENT_ADDED, { element: dup }, { transactionId: txId });
    });
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const builderService = new BuilderService();
