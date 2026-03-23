const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('error')) {
      console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('warn')) {
      console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('info')) {
      console.info(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (shouldLog('debug')) {
      console.debug(JSON.stringify({ level: 'debug', message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
};
