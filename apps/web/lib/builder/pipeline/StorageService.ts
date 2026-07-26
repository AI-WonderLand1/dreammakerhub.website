import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import { logger } from '@/lib/logger';

const LOCAL_KEY = 'aiw-builder-state';

export class StorageService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;
  private ownerId: string | null = null;
  private saveCount = 0;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  setProjectId(id: string): void {
    this.projectId = id;
    if (id) {
      this.loadFromProject();
    }
  }

  setOwnerId(id: string): void {
    this.ownerId = id;
  }

  start(): void {
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, () => {
        this.scheduleLocalSave();
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.STORAGE_SAVING, (event) => {
        const { projectId } = event.payload;
        if (projectId === this.projectId) {
          this.saveToProject();
        }
      })
    );
  }

  private scheduleLocalSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToLocal();
    }, 500);
  }

  private saveToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      const state = useBuilderStore.getState();
      localStorage.setItem(LOCAL_KEY, JSON.stringify({
        elements: state.elements,
        zoom: state.zoom,
        pan: state.pan,
        showGrid: state.showGrid,
        snapToGrid: state.snapToGrid,
        projectId: this.projectId,
      }));
    } catch {}
  }

  loadFromLocal(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed.projectId) this.projectId = parsed.projectId;
      if (parsed.elements) {
        useBuilderStore.getState().setElements(parsed.elements);
      }
      useBuilderStore.getState().setZoom(parsed.zoom ?? 1);
      useBuilderStore.getState().setPan(parsed.pan ?? { x: 0, y: 0 });
      useBuilderStore.getState().setShowGrid(parsed.showGrid ?? true);
      useBuilderStore.getState().setSnapToGrid(parsed.snapToGrid ?? true);
      return true;
    } catch { return false; }
  }

  async saveToProject(): Promise<void> {
    if (!this.projectId) return;
    const state = useBuilderStore.getState();

    try {
      const res = await fetch(`/api/projects/${this.projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: {
            'builder-state.json': JSON.stringify({ elements: state.elements, version: 1 }, null, 2),
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      this.saveCount++;
      this.bus.emit(EventNames.STORAGE_SAVED, {
        projectId: this.projectId,
        timestamp: Date.now(),
      });
      logger.info(`[Storage] Saved ${this.projectId}`);
    } catch (err: any) {
      this.bus.emit(EventNames.STORAGE_ERROR, {
        projectId: this.projectId,
        error: err.message,
      });
    }
  }

  async loadFromProject(): Promise<boolean> {
    if (!this.projectId) return false;
    try {
      const res = await fetch(`/api/projects/${this.projectId}/files`, {
        method: 'GET',
      });
      if (!res.ok) return false;
      const data = await res.json();
      const raw = data.files?.['builder-state.json'];
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed.elements) {
        useBuilderStore.getState().setElements(parsed.elements);
        this.bus.emit(EventNames.STORAGE_LOADED, {
          projectId: this.projectId,
          elements: parsed.elements,
        });
      }
      return true;
    } catch { return false; }
  }

  getSaveCount(): number { return this.saveCount; }

  stop(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const storageService = new StorageService();
