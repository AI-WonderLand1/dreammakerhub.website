// apps/web/services/storage/StorageProvider.ts
export interface StorageProvider {
  upload(path: string, data: any): Promise<void>;
  download(path: string): Promise<any>;
  exists(path: string): Promise<boolean>;
}

export class NoopStorageProvider implements StorageProvider {
  async upload() {}
  async download() { return null; }
  async exists() { return false; }
}
