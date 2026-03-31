type LogMeta = Record<string, unknown>

function log(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta) {
  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message
  console[level](payload)
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log('info', message, meta),
  warn: (message: string, meta?: LogMeta) => log('warn', message, meta),
  error: (message: string, meta?: LogMeta) => log('error', message, meta),
}
