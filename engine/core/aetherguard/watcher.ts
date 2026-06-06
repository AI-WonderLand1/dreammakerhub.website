import { existsSync } from 'fs';
import { WATCHER_DEBOUNCE_MS } from './constants';

type ChangeHandler = (event: string, filePath: string) => void;

let watcher: { close: () => void; on: (event: string, handler: (...args: unknown[]) => void) => void } | null = null;
const pendingChanges = new Set<string>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function setupFileWatcher(
  rootDir: string,
  onChange: ChangeHandler
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chokidar: any;
  try {
    chokidar = await import('chokidar');
  } catch {
    return; // chokidar not available, skip
  }

  const watchDirs = ['engine', 'packages', 'apps/web/src', 'config', 'runners', 'types', 'infra'];
  const fullDirs = watchDirs
    .map(d => `${rootDir}/${d}`)
    .filter((d: string) => existsSync(d));

  if (fullDirs.length === 0) return;

  watcher = chokidar.watch(fullDirs, {
    ignored: [
      /(^|[\\/])(node_modules|.git|dist|build|.next|coverage|__pycache__)/,
      /\.(log|lock)$/,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on('all', (_event: string, filePath: string) => {
    pendingChanges.add(filePath);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const batch = Array.from(pendingChanges);
      pendingChanges.clear();
      for (const fp of batch) {
        onChange(_event, fp);
      }
    }, WATCHER_DEBOUNCE_MS);
  });
}

export function closeFileWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  pendingChanges.clear();
}
