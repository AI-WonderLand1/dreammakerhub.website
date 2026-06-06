/**
 * SyncGuard - Batches memory writes to reduce API calls
 * "Shadow Sync" from IndexedDB → Python Memory Bank
 */

import { localMemory, PendingChange } from "./local-memory";
import { alice } from "./alice-proxy";
import { logger } from "../../lib/logger";

export interface SyncGuardConfig {
  batchSize: number;        // Sync when this many items accumulate
  syncIntervalMs: number;    // Or sync every X milliseconds
  enabled: boolean;
}

const DEFAULT_CONFIG: SyncGuardConfig = {
  batchSize: 5,
  syncIntervalMs: 30000,     // 30 seconds
  enabled: true,
};

class SyncGuard {
  private config: SyncGuardConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;

  constructor(config: Partial<SyncGuardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    if (this.intervalId) return;

    await localMemory.init();

    this.intervalId = setInterval(() => {
      this.syncIfNeeded();
    }, this.config.syncIntervalMs);

    logger.info("SyncGuard started");
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("SyncGuard stopped");
    }
  }

  // Queue a thought for sync
  async queueThought(content: string, persona: string): Promise<void> {
    if (!this.config.enabled) return;

    // Save locally first (instant)
    await localMemory.saveThought(content, persona);

    // Check if we should trigger immediate sync using unsynced local count
    const pending = await this.getPendingCount();
    if (pending.thoughts >= this.config.batchSize) {
      this.syncThoughts();
    }
  }

  // Queue a change for sync
  async queueChange(type: PendingChange["type"], path: string, content: unknown): Promise<void> {
    if (!this.config.enabled) return;

    await localMemory.savePendingChange(type, path, content);

    const pending = await this.getPendingCount();
    if (pending.changes >= this.config.batchSize) {
      this.syncChanges();
    }
  }

  private async syncIfNeeded(): Promise<void> {
    if (this.isSyncing) return;

    await this.syncThoughts();
    await this.syncChanges();

    // Cleanup old synced entries
    await localMemory.cleanup();
  }

  private async syncThoughts(): Promise<void> {
    if (this.isSyncing || !this.config.enabled) return;
    this.isSyncing = true;

    try {
      const unsyncedThoughts = await localMemory.getThoughts(100);
      const toSync = unsyncedThoughts.filter((t) => !t.synced);

      if (toSync.length === 0) return;

      // Batch sync to Python memory bank
      for (const thought of toSync) {
        try {
          await alice.storeMemory(
            `thought:${thought.persona}:${thought.timestamp}`,
            thought.content,
            0.6
          );
        } catch (error) {
          logger.error("Failed to sync thought:", { error });
          break;
        }
      }

      // Mark as synced
      const ids = toSync.map((t) => t.id!).filter(Boolean);
      await localMemory.markSynced("thoughts", ids);

      logger.info(`SyncGuard: Synced ${ids.length} thoughts`);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncChanges(): Promise<void> {
    if (this.isSyncing || !this.config.enabled) return;
    this.isSyncing = true;

    try {
      const unsyncedChanges = await localMemory.getUnsyncedChanges();

      if (unsyncedChanges.length === 0) return;

      // Process changes based on type
      for (const change of unsyncedChanges) {
        try {
          if (change.type === "memory") {
            await alice.storeMemory(change.path, change.content, 0.7);
          }
          // Add other change types as needed
        } catch (error) {
          logger.error("Failed to sync change:", { error });
          break;
        }
      }

      // Mark as synced
      const ids = unsyncedChanges.map((c) => c.id!).filter(Boolean);
      await localMemory.markSynced("pendingChanges", ids);

      logger.info(`SyncGuard: Synced ${ids.length} changes`);
    } finally {
      this.isSyncing = false;
    }
  }

  // Force immediate sync
  async forceSync(): Promise<void> {
    await this.syncIfNeeded();
  }

  // Get pending count
  async getPendingCount(): Promise<{ thoughts: number; changes: number }> {
    const thoughts = await localMemory.getThoughts(100);
    const changes = await localMemory.getUnsyncedChanges();

    return {
      thoughts: thoughts.filter((t) => !t.synced).length,
      changes: changes.length,
    };
  }
}

export const syncGuard = new SyncGuard();
