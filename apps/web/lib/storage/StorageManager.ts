/**
 * Storage Abstraction Layer for AI-WONDERLAND
 * Handles both Supabase and BYOC storage seamlessly
 */

import { StorageMode, BYOCConfig, ProjectAsset, StorageMetadata, TempStorageConfig } from './types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export class StorageManager {
  private mode: StorageMode = 'supabase';
  private byocConfig: BYOCConfig | null = null;
  private tempStorageConfig: TempStorageConfig = {
    enabled: true,
    ttlHours: 24,
    bucketName: 'temp_storage',
    cleanupInterval: 3600000, // 1 hour
  };

  constructor(mode: StorageMode = 'supabase', byocConfig?: BYOCConfig) {
    this.mode = mode;
    this.byocConfig = byocConfig || null;
    this.initCleanupScheduler();
  }

  /**
   * Save project to appropriate storage backend
   */
  async saveProject(projectId: string, data: unknown, userId: string): Promise<ProjectAsset> {
    const metadata: StorageMetadata = {
      projectId,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: JSON.stringify(data).length,
      provider: this.mode,
    };

    if (this.mode === 'byoc' && this.byocConfig?.enabled) {
      return this.saveToBYOC(projectId, data, metadata);
    } else if (this.mode === 'hybrid') {
      // Save to both Supabase and BYOC
      await this.saveToSupabase(projectId, data, metadata);
      if (this.byocConfig?.enabled) {
        return this.saveToBYOC(projectId, data, metadata);
      }
    }

    return this.saveToSupabase(projectId, data, metadata);
  }

  /**
   * Load project from appropriate storage backend
   */
  async loadProject(projectId: string): Promise<unknown> {
    if (this.mode === 'byoc' && this.byocConfig?.enabled) {
      return this.loadFromBYOC(projectId);
    } else if (this.mode === 'hybrid') {
      try {
        return await this.loadFromBYOC(projectId);
      } catch {
        // Fallback to Supabase if BYOC fails
        return this.loadFromSupabase(projectId);
      }
    }

    return this.loadFromSupabase(projectId);
  }

  /**
   * Save to Supabase (default)
   */
  private async saveToSupabase(projectId: string, data: unknown, metadata: StorageMetadata): Promise<ProjectAsset> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const bucket = metadata.ttl ? 'temp_storage' : 'projects';
    const { data: result, error } = await supabase.storage
      .from(bucket)
      .upload(`${metadata.userId}/${projectId}.json`, JSON.stringify({ data, metadata }), {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) throw error;

    const url = supabase.storage.from(bucket).getPublicUrl(result.path).data.publicUrl;

    return {
      id: projectId,
      name: projectId,
      type: 'config',
      url,
      size: metadata.size,
      metadata,
    };
  }

  /**
   * Load from Supabase
   */
  private async loadFromSupabase(projectId: string): Promise<unknown> {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data: files } = await supabase.storage.from('projects').list();
    if (!files) throw new Error('Project not found');

    const file = files.find(f => f.name.includes(projectId));
    if (!file) throw new Error('Project file not found');

    const { data, error } = await supabase.storage
      .from('projects')
      .download(file.name);

    if (error) throw error;

    const text = await data.text();
    return JSON.parse(text);
  }

  /**
   * Save to BYOC (Custom Cloud)
   */
  private async saveToBYOC(projectId: string, data: unknown, metadata: StorageMetadata): Promise<ProjectAsset> {
    if (!this.byocConfig?.enabled || !this.byocConfig.endpoints?.saveProject) {
      throw new Error('BYOC not configured');
    }

    const response = await fetch(this.byocConfig.endpoints.saveProject, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.byocConfig.credentials.apiKey}`,
      },
      body: JSON.stringify({ projectId, data, metadata }),
    });

    if (!response.ok) {
      throw new Error(`BYOC save failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      id: projectId,
      name: projectId,
      type: 'config',
      url: result.url,
      size: metadata.size,
      metadata,
    };
  }

  /**
   * Load from BYOC
   */
  private async loadFromBYOC(projectId: string): Promise<unknown> {
    if (!this.byocConfig?.enabled || !this.byocConfig.endpoints?.loadProject) {
      throw new Error('BYOC not configured');
    }

    const response = await fetch(`${this.byocConfig.endpoints.loadProject}?projectId=${projectId}`, {
      headers: {
        'Authorization': `Bearer ${this.byocConfig.credentials.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`BYOC load failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete project from storage
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    if (this.mode === 'byoc' && this.byocConfig?.enabled) {
      await this.deleteFromBYOC(projectId);
    } else {
      if (supabase) {
        await supabase.storage.from('projects').remove([`${userId}/${projectId}.json`]);
      }
    }
  }

  /**
   * Delete from BYOC
   */
  private async deleteFromBYOC(projectId: string): Promise<void> {
    if (!this.byocConfig?.enabled || !this.byocConfig.endpoints?.deleteProject) {
      throw new Error('BYOC not configured');
    }

    const response = await fetch(this.byocConfig.endpoints.deleteProject, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.byocConfig.credentials.apiKey}`,
      },
      body: JSON.stringify({ projectId }),
    });

    if (!response.ok) {
      throw new Error(`BYOC delete failed: ${response.statusText}`);
    }
  }

  /**
   * Initialize cleanup scheduler for temporary storage
   */
  private initCleanupScheduler(): void {
    if (!this.tempStorageConfig.enabled) return;

    setInterval(() => {
      this.cleanupExpiredAssets().catch(console.error);
    }, this.tempStorageConfig.cleanupInterval);
  }

  /**
   * Clean up expired temporary assets
   */
  private async cleanupExpiredAssets(): Promise<void> {
    if (!supabase) return;

    const now = Date.now();
    const ttlMs = this.tempStorageConfig.ttlHours * 3600000;

    const { data: files } = await supabase.storage.from('temp_storage').list();
    if (!files) return;

    for (const file of files) {
      if (file.created_at) {
        const createdAt = new Date(file.created_at).getTime();
        if (now - createdAt > ttlMs) {
          await supabase.storage.from('temp_storage').remove([file.name]).catch(console.error);
        }
      }
    }
  }

  /**
   * Switch storage mode
   */
  switchMode(mode: StorageMode, byocConfig?: BYOCConfig): void {
    this.mode = mode;
    if (byocConfig) {
      this.byocConfig = byocConfig;
    }
  }

  /**
   * Get current storage status
   */
  getStatus() {
    return {
      mode: this.mode,
      byocEnabled: this.byocConfig?.enabled || false,
      byocProvider: this.byocConfig?.provider || null,
      supabaseAvailable: !!supabase,
    };
  }
}

// Singleton instance
let storageManager: StorageManager | null = null;

export function getStorageManager(mode?: StorageMode, byocConfig?: BYOCConfig): StorageManager {
  if (!storageManager) {
    storageManager = new StorageManager(mode, byocConfig);
  }
  return storageManager;
}

export function createStorageManager(mode: StorageMode, byocConfig?: BYOCConfig): StorageManager {
  return new StorageManager(mode, byocConfig);
}
