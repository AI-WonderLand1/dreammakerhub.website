type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, meta?: Record<string, any>) => void;
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
}

const isProduction = process.env.NODE_ENV === 'production';

const createLogger = (): Logger => {
  const log = (level: LogLevel, message: string, meta?: Record<string, any>) => {
    if (isProduction && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (meta) {
      console[level](logMessage, meta);
    } else {
      console[level](logMessage);
    }
  };

  return {
    debug: (message: string, meta?: Record<string, any>) => log('debug', message, meta),
    info: (message: string, meta?: Record<string, any>) => log('info', message, meta),
    warn: (message: string, meta?: Record<string, any>) => log('warn', message, meta),
    error: (message: string, meta?: Record<string, any>) => log('error', message, meta),
  };
};

export const logger = createLogger();
