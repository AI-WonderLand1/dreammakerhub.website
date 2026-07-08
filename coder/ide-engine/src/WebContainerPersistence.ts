import type { WebContainer, FileSystemTree } from '@webcontainer/api';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'temp_storage';
const IDE_PREFIX = 'ide';

export interface ProjectSnapshot {
  files: Record<string, string>;
  savedAt: number;
  userId: string;
}

export class WebContainerPersistence {
  private supabase: SupabaseClient;
  private userId: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveDelay = 3000;

  constructor(supabase: SupabaseClient, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  private getPath(filename: string): string {
    return `${this.userId}/${IDE_PREFIX}/${filename}`;
  }

  async saveSnapshot(wc: WebContainer): Promise<void> {
    const files = await this.readAllFiles(wc, '.');
    const snapshot: ProjectSnapshot = {
      files,
      savedAt: Date.now(),
      userId: this.userId,
    };

    const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });

    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(this.getPath('project.json'), blob, {
        upsert: true,
        contentType: 'application/json',
      });

    if (error) {
      throw error;
    }
  }

  async loadSnapshot(): Promise<ProjectSnapshot | null> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .download(this.getPath('project.json'));

    if (error || !data) {
      return null;
    }

    const text = await data.text();
    try {
      return JSON.parse(text) as ProjectSnapshot;
    } catch {
      return null;
    }
  }

  snapshotToTree(snapshot: ProjectSnapshot): FileSystemTree {
    const tree: FileSystemTree = {};

    for (const [path, content] of Object.entries(snapshot.files)) {
      const parts = path.split('/');
      let current: FileSystemTree = tree;

      for (let i = 0; i < parts.length - 1; i++) {
        const dirName = parts[i];
        if (!current[dirName]) {
          current[dirName] = { directory: {} };
        }
        current = (current[dirName] as { directory: FileSystemTree }).directory;
      }

      const fileName = parts[parts.length - 1];
      current[fileName] = { file: { contents: content } };
    }

    return tree;
  }

  scheduleSave(wc: WebContainer): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.saveSnapshot(wc).catch(() => {});
    }, this.saveDelay);
  }

  private async readAllFiles(wc: WebContainer, dir: string): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    await this.walkDir(wc, dir, '', files);
    return files;
  }

  private async walkDir(
    wc: WebContainer,
    dir: string,
    prefix: string,
    files: Record<string, string>
  ): Promise<void> {
    let entries;
    try {
      entries = await wc.fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const name = typeof entry.name === 'string' ? entry.name : new TextDecoder().decode(entry.name);
      if (name.startsWith('.') && name !== '.env') continue;
      if (name === 'node_modules') continue;

      const fullPath = dir === '.' ? name : `${dir}/${name}`;
      const storagePath = prefix ? `${prefix}/${name}` : name;

      if (entry.isDirectory()) {
        await this.walkDir(wc, fullPath, storagePath, files);
      } else {
        try {
          const content = await wc.fs.readFile(fullPath, 'utf-8');
          files[storagePath] = content;
        } catch {
          // skip binary/unreadable files
        }
      }
    }
  }

  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }
}
