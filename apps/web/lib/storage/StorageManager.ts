import { StorageMode, BYOCConfig, ProjectAsset, StorageMetadata, TempStorageConfig } from './types';

export class StorageManager {
  private mode: StorageMode = 'supabase';
  private byocConfig: BYOCConfig | null = null;

  constructor(mode: StorageMode = 'supabase', byocConfig?: BYOCConfig) {
    this.mode = mode;
    this.byocConfig = byocConfig || null;
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
    return { id: projectId, name: projectId, type: 'config', url: '', size: metadata.size, metadata };
  }

  async loadProject(_projectId: string): Promise<unknown> {
    return null;
  }

  async deleteProject(_projectId: string, _userId: string): Promise<void> {}

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

  switchMode(mode: StorageMode, byocConfig?: BYOCConfig): void {
    this.mode = mode;
    if (byocConfig) this.byocConfig = byocConfig;
  }

  getStatus() {
    return { mode: this.mode, byocEnabled: this.byocConfig?.enabled || false, byocProvider: this.byocConfig?.provider || null, supabaseAvailable: false };
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
