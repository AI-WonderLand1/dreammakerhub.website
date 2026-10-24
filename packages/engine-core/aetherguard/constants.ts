export const SUPPORTED_EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.txt', '.yml', '.yaml', '.env']);
export const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.cache', 'coverage', '__pycache__', '.venv', 'public', '.coder']);
export const MAX_CONTENT_LENGTH = 5000;
export const MAX_AUTOFIX_LOG = 200;

export const FAST_INTERVAL_MS = 5 * 60 * 1000;
export const MEDIUM_INTERVAL_MS = 15 * 60 * 1000;
export const SLOW_INTERVAL_MS = 60 * 60 * 1000;
export const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

export const WATCHER_DEBOUNCE_MS = 2000;
