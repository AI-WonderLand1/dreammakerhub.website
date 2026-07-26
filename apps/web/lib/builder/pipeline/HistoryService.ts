import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type EventEnvelope } from './types';
import { useBuilderStore } from '../store';
import type { CanvasElement } from '../types';

interface HistorySnapshot {
  elements: CanvasElement[];
  label: string;
}

export class HistoryService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private snapshots: HistorySnapshot[] = [];
  private currentIndex = -1;
  private maxSnapshots = 100;
  private ignoreNextChange = false;
  private subscribedToStore = false;

  start(): void {
    this.subscribedToStore = true;
    this.unsubs.push(
      useBuilderStore.subscribe((state, prev) => {
        if (this.ignoreNextChange) {
          this.ignoreNextChange = false;
          return;
        }
        if (state.elements !== prev.elements) {
          this.pushSnapshot(state.elements, 'change');
        }
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.HISTORY_UNDO, () => {
        this.undo();
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.HISTORY_REDO, () => {
        this.redo();
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.HISTORY_SNAPSHOT, (event) => {
        const { label } = event.payload as EventPayload<typeof EventNames.HISTORY_SNAPSHOT>;
        const elements = useBuilderStore.getState().elements;
        this.pushSnapshot(elements, label || 'snapshot');
      })
    );

    this.unsubs.push(
      this.bus.on(EventNames.HISTORY_CLEAR, () => {
        this.clear();
      })
    );

    this.pushSnapshot(useBuilderStore.getState().elements, 'initial');
  }

  private pushSnapshot(elements: CanvasElement[], label: string): void {
    const deep = JSON.parse(JSON.stringify(elements));
    this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    this.snapshots.push({ elements: deep, label });
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
    this.currentIndex = this.snapshots.length - 1;
  }

  private undo(): void {
    if (this.currentIndex <= 0) return;
    this.currentIndex--;
    this.applyCurrent();
  }

  private redo(): void {
    if (this.currentIndex >= this.snapshots.length - 1) return;
    this.currentIndex++;
    this.applyCurrent();
  }

  private applyCurrent(): void {
    const snapshot = this.snapshots[this.currentIndex];
    if (!snapshot) return;
    this.ignoreNextChange = true;
    useBuilderStore.getState().setElements(snapshot.elements);
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.snapshots.length - 1;
  }

  getCurrentLabel(): string {
    return this.snapshots[this.currentIndex]?.label || '';
  }

  getSnapshotCount(): number {
    return this.snapshots.length;
  }

  clear(): void {
    this.snapshots = [];
    this.currentIndex = -1;
    this.pushSnapshot(useBuilderStore.getState().elements, 'cleared');
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
    this.subscribedToStore = false;
  }
}

export const historyService = new HistoryService();
