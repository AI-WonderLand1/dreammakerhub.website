type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const ENABLED_LEVEL: LogLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info';

const DEBUG_ENV = process.env.DEBUG || '';

const NAMESPACE_PATTERNS = DEBUG_ENV.split(',').map(s => {
  const pattern = s.trim().replace(/\*/g, '.*');
  try { return new RegExp(`^${pattern}$`); } catch { return null; }
}).filter(Boolean) as RegExp[];

function namespaceMatches(pattern: string): boolean {
  if (!DEBUG_ENV) return false;
  if (NAMESPACE_PATTERNS.some(r => r.test(pattern))) return true;
  if (NAMESPACE_PATTERNS.some(r => r.test(pattern.replace(/:[\w-]+$/, ':*')))) return true;
  return false;
}

function structuredArgs(level: LogLevel, namespace: string, message: string, data?: unknown) {
  if (LEVEL_RANK[level] < LEVEL_RANK[ENABLED_LEVEL]) return null;
  if (level === 'debug' && !namespaceMatches(namespace)) return null;
  return { level, namespace, message, data, timestamp: new Date().toISOString() };
}

function sanitizeForLog(input: string): string {
  return input.replace(/[\n\r\t\0\b\f\v\\"]/g, (ch) => {
    switch (ch) {
      case '\n': return '\\n';
      case '\r': return '\\r';
      case '\t': return '\\t';
      case '\0': return '\\0';
      case '\b': return '\\b';
      case '\f': return '\\f';
      case '\v': return '\\v';
      case '\\': return '\\\\';
      case '"': return '\\"';
      default: return ch;
    }
  });
}

function formatOutput(args: NonNullable<ReturnType<typeof structuredArgs>>) {
  const { level, namespace, message, data, timestamp } = args;
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${sanitizeForLog(namespace)}]`;
  if (data !== undefined) {
    let dataStr: string;
    try {
      dataStr = JSON.stringify(data, (_key, value) => {
        if (typeof value === 'string') return sanitizeForLog(value);
        return value;
      });
    } catch {
      dataStr = String(data);
    }
    return `${prefix} ${sanitizeForLog(message)} ${dataStr}`;
  }
  return `${prefix} ${sanitizeForLog(message)}`;
}

function log(level: LogLevel, namespace: string, message: string, data?: unknown) {
  const args = structuredArgs(level, namespace, message, data);
  if (!args) return;
  const output = formatOutput(args);
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
  const make =
    (level: LogLevel) =>
    (message: string, data?: unknown) =>
      log(level, namespace, message, data);

  return {
    debug: make('debug'),
    info: make('info'),
    warn: make('warn'),
    error: make('error'),
    child: (sub: string) => createLogger(`${namespace}:${sub}`),
  };
}

const rootLogger = createLogger('dreammakerhub');

export const logger = rootLogger;
export default logger;