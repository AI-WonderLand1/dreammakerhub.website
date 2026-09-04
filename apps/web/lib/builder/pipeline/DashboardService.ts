import { getEventBus } from './EventBus';
import { EventNames, type DashboardStatsPayload } from './types';
import { useBuilderStore } from '../store';
import { fileFolderManager } from './FileFolderManager';
import { validationService } from './ValidationService';
import { logger } from '@/lib/logger';

export class DashboardService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private supabase: any = null;
  private channel: any = null;
  private lastStats: DashboardStatsPayload | null = null;
  private projectId: string | null = null;
  private initPromise: Promise<void> | null = null;

  setProjectId(id: string): void {
    this.projectId = id;
  }

  start(): void {
    this.initSupabase();

    this.unsubs.push(this.bus.on(EventNames.PROJECT_STATE_CHANGED, () => this.publishStats()));
    this.unsubs.push(this.bus.on(EventNames.PROJECT_METADATA_UPDATED, () => this.publishStats()));
    this.unsubs.push(this.bus.on(EventNames.STORAGE_SAVED, () => this.publishStats()));
    this.unsubs.push(this.bus.on(EventNames.VALIDATION_COMPLETED, (event) => {
      const { passed } = event.payload;
      this.lastStats = this.computeStats(passed ? 'passed' : 'failed');
      this.broadcast();
    }));
  }

  private async initSupabase(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        this.supabase = createClient(url, key);
      } catch {}
    })();
    return this.initPromise;
  }

  private computeStats(validationStatus?: DashboardStatsPayload['validationStatus']): DashboardStatsPayload {
    const state = useBuilderStore.getState();
    const elements = state.elements;
    const fileCount = fileFolderManager.getFileCount();
    const issues = validationService.getLastIssues();
    const validationErrors = issues.filter((i) => i.severity === 'error').length;

    return {
      elementCount: elements.length,
      pageCount: state.pages.length,
      fileCount,
      storageUsage: fileCount * 512,
      validationStatus: validationStatus || (validationErrors > 0 ? 'failed' : 'passed'),
      lastSaved: new Date().toISOString(),
      aiActivity: false,
      projectHealth: validationErrors > 0 ? 'warning' : 'healthy',
    };
  }

  private async publishStats(): Promise<void> {
    const stats = this.computeStats();
    this.lastStats = stats;
    this.bus.emit(EventNames.DASHBOARD_STATS_UPDATED, stats);
    this.bus.emit(EventNames.DASHBOARD_SYNC, { force: false });
    await this.broadcast();
  }

  private async broadcast(): Promise<void> {
    if (!this.supabase || !this.lastStats) return;
    try {
      await this.initSupabase();
      const room = this.projectId ? `wonder:dash:${this.projectId}` : 'wonder:dash:builder';
      if (this.channel) {
        this.supabase.removeChannel(this.channel).catch(() => {});
      }
      this.channel = this.supabase.channel(room);
      await this.channel.subscribe();
      await this.channel.send({
        type: 'broadcast',
        event: 'wb',
        payload: {
          type: 'stats',
          message: `📊 ${this.lastStats.elementCount} elements · ${this.lastStats.fileCount} files`,
          stats: this.lastStats,
          from: 'builder',
          ts: Date.now(),
        },
      });
    } catch {}
  }

  getLastStats(): DashboardStatsPayload | null { return this.lastStats; }

  stop(): void {
    if (this.channel) {
      this.supabase?.removeChannel(this.channel).catch(() => {});
      this.channel = null;
    }
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const dashboardService = new DashboardService();
