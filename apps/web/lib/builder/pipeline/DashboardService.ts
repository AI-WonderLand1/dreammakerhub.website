import { getEventBus } from './EventBus';
import { EventNames, type EventPayload, type DashboardStatsPayload } from './types';
import { useBuilderStore } from '../store';
import { fileFolderManager } from './FileFolderManager';
import { logger } from '@/lib/logger';

export class DashboardService {
  private bus = getEventBus();
  private unsubs: Array<() => void> = [];
  private supabaseChannel: any = null;
  private lastStats: DashboardStatsPayload | null = null;
  private projectId: string | null = null;

  setProjectId(id: string): void {
    this.projectId = id;
  }

  start(): void {
    // Recompute stats whenever project state changes
    this.unsubs.push(
      this.bus.on(EventNames.PROJECT_STATE_CHANGED, () => {
        this.publishStats();
      })
    );

    // On storage save
    this.unsubs.push(
      this.bus.on(EventNames.STORAGE_SAVED, (event) => {
        this.publishStats();
      })
    );

    // On validation
    this.unsubs.push(
      this.bus.on(EventNames.VALIDATION_COMPLETED, () => {
        this.publishStats();
      })
    );
  }

  private computeStats(): DashboardStatsPayload {
    const elements = useBuilderStore.getState().elements;
    const fileCount = fileFolderManager.getFileCount();
    const lastSaved = new Date().toISOString();

    return {
      elementCount: elements.length,
      pageCount: 1,
      fileCount,
      storageUsage: fileCount * 512,
      validationStatus: 'idle',
      lastSaved,
      aiActivity: false,
      projectHealth: 'healthy',
    };
  }

  private async publishStats(): Promise<void> {
    const stats = this.computeStats();
    this.lastStats = stats;

    this.bus.emit(EventNames.DASHBOARD_STATS_UPDATED, stats);
    this.bus.emit(EventNames.DASHBOARD_SYNC, { force: false });

    // Broadcast to Supabase Realtime for dashboard widget
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const room = this.projectId ? `wonder:dash:${this.projectId}` : 'wonder:dash:builder';
        const channel = supabase.channel(room);
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'wb',
          payload: {
            type: 'stats',
            message: `📊 ${stats.elementCount} elements · ${stats.fileCount} files`,
            stats,
            from: 'builder',
            ts: Date.now(),
          },
        });
        setTimeout(() => supabase.removeChannel(channel), 1000);
      }
    } catch {}
  }

  getLastStats(): DashboardStatsPayload | null {
    return this.lastStats;
  }

  stop(): void {
    for (const unsub of this.unsubs) unsub();
    this.unsubs = [];
  }
}

export const dashboardService = new DashboardService();
