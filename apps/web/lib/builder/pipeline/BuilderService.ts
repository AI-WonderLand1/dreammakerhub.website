import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';
import { transactionManager } from './TransactionManager';

export class BuilderService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];

  start(): void {
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_ADDED, (event) => {
        const { element, parentId } = event.payload;
        useBuilderStore.getState().addElement(element, parentId);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_REMOVED, (event) => {
        const { elementId } = event.payload;
        useBuilderStore.getState().removeElement(elementId);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_UPDATED, (event) => {
        const { elementId, props } = event.payload;
        useBuilderStore.getState().updateElementProps(elementId, props);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_STYLES_CHANGED, (event) => {
        const { elementId, styles } = event.payload;
        useBuilderStore.getState().updateElementStyles(elementId, styles);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENT_SELECTED, (event) => {
        const { elementId } = event.payload;
        useBuilderStore.getState().selectElement(elementId);
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.ELEMENTS_CLEARED, () => {
        useBuilderStore.getState().setElements([]);
      })
    );
  }

  async addElement(element: CanvasElement, parentId?: string): Promise<void> {
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        useBuilderStore.getState().removeElement(element.id);
      });
      this.bus.emit(EventNames.ELEMENT_ADDED, { element, parentId }, { transactionId: txId });
    });
  }

  async removeElement(elementId: string): Promise<void> {
    const elements = useBuilderStore.getState().elements;
    const el = elements.find((e) => e.id === elementId);
    if (!el) return;
    const originalIndex = elements.findIndex((e) => e.id === elementId);
    await transactionManager.run(async (txId) => {
      transactionManager.addRollback(() => {
        const restored = JSON.parse(JSON.stringify(el));
        useBuilderStore.getState().addElement(restored);
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
    const el = useBuilderStore.getState().elements.find((e) => e.id === elementId);
    const prev = { ...(el?.styles || {}) };
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

  async clearElements(): Promise<void> {
    const prevCount = useBuilderStore.getState().elements.length;
    await transactionManager.run(async (txId) => {
      transactionManager.snapshotBeforeMutate();
      this.bus.emit(EventNames.ELEMENTS_CLEARED, { previousCount: prevCount }, { transactionId: txId });
    });
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const builderService = new BuilderService();
