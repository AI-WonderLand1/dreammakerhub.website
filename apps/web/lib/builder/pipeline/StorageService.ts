import { getEventBus } from './EventBus';
import { EventNames } from './types';
import { useBuilderStore } from '../store';
import type { BuilderState, BuilderTheme, Breakpoint } from '../types';
import { logger } from '@/lib/logger';

const LOCAL_KEY = 'aiw-builder-state';
const STATE_FILE = 'builder-state.json';
const DEBOUNCE_MS = 2000;

export type VisualState = {
  elements: BuilderState['elements'];
  theme: BuilderTheme;
  activeBreakpoint: Breakpoint;
  zoom: number;
  pan: { x: number; y: number };
  showGrid: boolean;
  snapToGrid: boolean;
};

export class StorageService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private projectId: string | null = null;
  private ownerId: string | null = null;
  private saveCount = 0;
  private localSaveTimer: ReturnType<typeof setTimeout> | null = null;
  private projectSaveTimer: ReturnType<typeof setTimeout> | null = null;

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
        this.scheduleProjectSave();
      })
    );
    this.unsubs.push(
      this.bus.on(EventNames.STORAGE_SAVING, (event) => {
        const { projectId } = event.payload;
        if (projectId === this.projectId) {
          this.scheduleProjectSave();
        }
      })
    );
  }

  private scheduleLocalSave(): void {
    if (this.localSaveTimer) clearTimeout(this.localSaveTimer);
    this.localSaveTimer = setTimeout(() => {
      this.localSaveTimer = null;
      this.saveToLocal();
    }, 500);
  }

  private scheduleProjectSave(): void {
    if (!this.projectId) return;
    if (this.projectSaveTimer) clearTimeout(this.projectSaveTimer);
    this.projectSaveTimer = setTimeout(() => {
      this.projectSaveTimer = null;
      this.saveToProject();
    }, DEBOUNCE_MS);
  }

  private readState(): VisualState {
    const state = useBuilderStore.getState();
    return {
      elements: state.elements,
      theme: state.theme,
      activeBreakpoint: state.activeBreakpoint,
      zoom: state.zoom,
      pan: state.pan,
      showGrid: state.showGrid,
      snapToGrid: state.snapToGrid,
    };
  }

  private applyState(state: Partial<VisualState>): void {
    const store = useBuilderStore.getState();
    if (state.elements) store.setElements(state.elements);
    if (state.theme) useBuilderStore.setState({ theme: state.theme });
    if (state.activeBreakpoint) store.setBreakpoint(state.activeBreakpoint);
    if (state.zoom != null) store.setZoom(state.zoom);
    if (state.pan) store.setPan(state.pan);
    if (state.showGrid != null) store.setShowGrid(state.showGrid);
    if (state.snapToGrid != null) store.setSnapToGrid(state.snapToGrid);
  }

  private saveToLocal(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify({
        ...this.readState(),
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
        this.applyState({
          elements: parsed.elements,
          zoom: parsed.zoom ?? 1,
          pan: parsed.pan ?? { x: 0, y: 0 },
          showGrid: parsed.showGrid ?? true,
          snapToGrid: parsed.snapToGrid ?? true,
          theme: parsed.theme,
          activeBreakpoint: parsed.activeBreakpoint,
        });
      }
      return true;
    } catch { return false; }
  }

  async saveToProject(): Promise<void> {
    if (!this.projectId) return;
    const payload = JSON.stringify({ ...this.readState(), version: 1 }, null, 2);

    try {
      const res = await fetch(`/api/projects/${this.projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: { [STATE_FILE]: payload },
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
      const raw = data.files?.[STATE_FILE];
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Partial<VisualState>;
      if (parsed.elements) {
        this.applyState(parsed);
        this.bus.emit(EventNames.STORAGE_LOADED, {
          projectId: this.projectId,
          ...parsed,
        });
      }
      return true;
    } catch { return false; }
  }

  async saveRevision(label?: string): Promise<any> {
    if (!this.projectId) return null;
    const snapshot = this.readState();
    try {
      const res = await fetch(`/api/projects/${this.projectId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshot, label }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.bus.emit(EventNames.STORAGE_SAVED, {
        projectId: this.projectId,
        timestamp: Date.now(),
        revision: true,
      });
      return data.revision;
    } catch (err: any) {
      this.bus.emit(EventNames.STORAGE_ERROR, {
        projectId: this.projectId,
        error: err.message,
      });
      return null;
    }
  }

  async loadRevisions(): Promise<any[]> {
    if (!this.projectId) return [];
    try {
      const res = await fetch(`/api/projects/${this.projectId}/revisions`, { method: 'GET' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.revisions ?? [];
    } catch { return []; }
  }

  async restoreRevision(revisionId: string): Promise<boolean> {
    if (!this.projectId) return false;
    try {
      const res = await fetch(`/api/projects/${this.projectId}/revisions?revisionId=${revisionId}`, {
        method: 'PUT',
      });
      if (!res.ok) return false;
      const { revision } = await res.json();
      const snapshot = revision?.snapshot as Partial<VisualState>;
      if (snapshot?.elements) {
        this.applyState(snapshot);
        return true;
      }
      return false;
    } catch { return false; }
  }

  getSaveCount(): number { return this.saveCount; }

  stop(): void {
    if (this.localSaveTimer) clearTimeout(this.localSaveTimer);
    if (this.projectSaveTimer) clearTimeout(this.projectSaveTimer);
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const storageService = new StorageService();
