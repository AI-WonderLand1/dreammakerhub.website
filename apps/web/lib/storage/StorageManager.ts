import { createClient } from "@supabase/supabase-js";
import { StorageMode, BYOCConfig, ProjectAsset, StorageMetadata } from './types';

export class StorageManager {
  private mode: StorageMode = 'supabase';
  private byocConfig: BYOCConfig | null = null;

  constructor(mode: StorageMode = 'supabase', byocConfig?: BYOCConfig) {
    this.mode = mode;
    this.byocConfig = byocConfig || null;
  }

  private getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase not configured");
    return createClient(url, key).storage.from("projects");
  }

  async saveProject(projectId: string, data: unknown, userId: string): Promise<ProjectAsset> {
    const metadata: StorageMetadata = {
      projectId, userId,
      createdAt: Date.now(), updatedAt: Date.now(),
      size: JSON.stringify(data).length,
      provider: this.mode,
    };
    if (this.mode === 'byoc' && this.byocConfig?.enabled) {
      return this.saveToBYOC(projectId, data, metadata);
    }
    const storage = this.getSupabase();
    const path = `${userId}/${projectId}/data.json`;
    const { error } = await storage.upload(path, JSON.stringify(data), { upsert: true, contentType: "application/json" });
    if (error) throw new Error(`Save failed: ${error.message}`);
    const { data: { publicUrl } } = storage.getPublicUrl(path);
    return { id: projectId, name: projectId, type: 'config', url: publicUrl, size: metadata.size, metadata };
  }

  async loadProject(projectId: string, userId: string): Promise<unknown> {
    if (this.mode === 'byoc' && this.byocConfig?.enabled) {
      return this.loadFromBYOC(projectId);
    }
    const storage = this.getSupabase();
    const path = `${userId}/${projectId}/data.json`;
    const { data, error } = await storage.download(path);
    if (error || !data) return null;
    const text = await data.text();
    try { return JSON.parse(text); } catch { return text; }
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    if (this.mode === 'byoc' && this.byocConfig?.enabled) {
      await this.deleteFromBYOC(projectId);
      return;
    }
    const storage = this.getSupabase();
    const prefix = `${userId}/${projectId}`;
    const { data: files } = await storage.list(prefix);
    if (files && files.length > 0) {
      const paths = files.map((f: any) => `${prefix}/${f.name}`);
      await storage.remove(paths);
    }
  }

  private async saveToBYOC(projectId: string, data: unknown, metadata: StorageMetadata): Promise<ProjectAsset> {
    if (!this.byocConfig?.enabled || !this.byocConfig.endpoints?.saveProject) {
      throw new Error('BYOC not configured');
    }
    const response = await fetch(this.byocConfig.endpoints.saveProject, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.byocConfig.credentials.apiKey}` },
      body: JSON.stringify({ projectId, data, metadata }),
    });
    if (!response.ok) throw new Error(`BYOC save failed: ${response.statusText}`);
    const result = await response.json();
    return { id: projectId, name: projectId, type: 'config', url: result.url, size: metadata.size, metadata };
  }

  private async loadFromBYOC(projectId: string): Promise<unknown> {
    if (!this.byocConfig?.endpoints?.loadProject) throw new Error('BYOC load not configured');
    const response = await fetch(`${this.byocConfig.endpoints.loadProject}/${projectId}`, {
      headers: { 'Authorization': `Bearer ${this.byocConfig.credentials.apiKey}` },
    });
    if (!response.ok) return null;
    return response.json();
  }

  private async deleteFromBYOC(projectId: string): Promise<void> {
    if (!this.byocConfig?.endpoints?.deleteProject) return;
    await fetch(`${this.byocConfig.endpoints.deleteProject}/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.byocConfig.credentials.apiKey}` },
    });
  }

  switchMode(mode: StorageMode, byocConfig?: BYOCConfig): void {
    this.mode = mode;
    if (byocConfig) this.byocConfig = byocConfig;
  }

  getStatus() {
    const url = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    return { mode: this.mode, byocEnabled: this.byocConfig?.enabled || false, byocProvider: this.byocConfig?.provider || null, supabaseAvailable: url };
  }
}

let storageManager: StorageManager | null = null;

export function getStorageManager(mode?: StorageMode, byocConfig?: BYOCConfig): StorageManager {
  if (!storageManager) storageManager = new StorageManager(mode, byocConfig);
  return storageManager;
}

export function createStorageManager(mode: StorageMode, byocConfig?: BYOCConfig): StorageManager {
  return new StorageManager(mode, byocConfig);
}