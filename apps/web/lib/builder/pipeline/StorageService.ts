import { getEventBus } from './EventBus';
import { EventNames, type EventPayload } from './types';
import { useBuilderStore } from '../store';
import { logger } from '@/lib/logger';

export class StorageService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;
  private ownerId: string | null = null;
  private saveCount = 0;

  setProjectId(id: string): void {
    this.projectId = id;
  }

  setOwnerId(id: string): void {
    this.ownerId = id;
  }

  start(): void {
    // Auto-save to localStorage on state change
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, () => {
        this.saveToLocal();
      })
    );
  }

  private saveToLocal(): void {
    if (typeof window === 'undefined') return;
    const state = useBuilderStore.getState();
    try {
      localStorage.setItem('aiw-builder-state', JSON.stringify({
        elements: state.elements,
        zoom: state.zoom,
        pan: state.pan,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
      }));
    } catch {}
  }

  async saveToProject(): Promise<void> {
    if (!this.projectId) return;
    this.bus.emit(EventNames.STORAGE_SAVING, { projectId: this.projectId });

    const state = useBuilderStore.getState();
    const payload = {
      files: {
        'builder-state.json': JSON.stringify({ elements: state.elements, version: 1 }, null, 2),
      },
    };

    try {
      const res = await fetch(`/api/projects/${this.projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.saveCount++;
      this.bus.emit(EventNames.STORAGE_SAVED, {
        projectId: this.projectId,
        timestamp: Date.now(),
      });
      logger.info(`[Storage] Saved to project ${this.projectId}`);
    } catch (err: any) {
      this.bus.emit(EventNames.STORAGE_ERROR, {
        projectId: this.projectId,
        error: err.message,
      });
      logger.error('[Storage] Save failed:', err.message);
    }
  }

  async loadFromProject(): Promise<void> {
    if (!this.projectId) return;
    try {
      const res = await fetch(`/api/projects/${this.projectId}/files`, {
        method: 'GET',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const stateFile = data.files?.['builder-state.json'];
      if (stateFile) {
        const parsed = JSON.parse(stateFile);
        if (parsed.elements) {
          useBuilderStore.getState().setElements(parsed.elements);
          this.bus.emit(EventNames.STORAGE_LOADED, {
            projectId: this.projectId,
            elements: parsed.elements,
          });
        }
      }
    } catch (err: any) {
      logger.warn('[Storage] Load failed:', err.message);
    }
  }

  getSaveCount(): number {
    return this.saveCount;
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const storageService = new StorageService();
