type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const ENABLED_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

const DEBUG_ENV = process.env.DEBUG || '';
const NAMESPACE_PATTERNS = DEBUG_ENV.split(',').map(s => {
  const pattern = s.trim().replace(/\*/g, '.*');
  try { return new RegExp(`^${pattern}$`); } catch { return null; }
}).filter(Boolean) as RegExp[];

function namespaceMatches(pattern: string): boolean {
  if (!DEBUG_ENV) return false;
  return NAMESPACE_PATTERNS.some(r => r.test(pattern) || r.test(pattern.replace(/:[\w-]+$/, ':*')));
}

function formatArgs(level: LogLevel, namespace: string, message: string, data?: unknown) {
  if (LEVEL_RANK[level] < LEVEL_RANK[ENABLED_LEVEL]) return null;
  if (level === 'debug' && !namespaceMatches(namespace)) return null;
  return `[${new Date().toISOString()}] [${level.toUpperCase()}] [${namespace}] ${message}` +
    (data !== undefined ? ' ' + JSON.stringify(data) : '');
}

function log(level: LogLevel, namespace: string, message: string, data?: unknown) {
  const output = formatArgs(level, namespace, message, data);
  if (!output) return;
  switch (level) {
    case 'error': console.error(output); break;
    case 'warn':  console.warn(output);  break;
    case 'debug': console.debug(output); break;
    default:      console.log(output);
  }
}

export interface Logger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  child: (subNamespace: string) => Logger;
}

export function createLogger(namespace: string): Logger {
  return {
    debug: (msg, data?) => log('debug', namespace, msg, data),
    info: (msg, data?) => log('info', namespace, msg, data),
    warn: (msg, data?) => log('warn', namespace, msg, data),
    error: (msg, data?) => log('error', namespace, msg, data),
    child: (sub: string) => createLogger(`${namespace}:${sub}`),
  };
}

export const logger = createLogger('infra');
export default logger;
