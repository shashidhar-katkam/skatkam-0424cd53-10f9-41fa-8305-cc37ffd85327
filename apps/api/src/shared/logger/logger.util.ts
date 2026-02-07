/**
 * Enterprise-grade shared logger utility.
 * Supports log levels (error, warn, info, debug), context, and optional metadata.
 * LOG_LEVEL env: error | warn | info | debug (default: info in production, debug otherwise).
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

function getMinLevel(): LogLevel {
  const env = process.env['LOG_LEVEL']?.toLowerCase();
  if (env && (env === 'error' || env === 'warn' || env === 'info' || env === 'debug')) {
    return env as LogLevel;
  }
  return process.env['NODE_ENV'] === 'production' ? 'info' : 'debug';
}

let minLevelOrder = LEVEL_ORDER[getMinLevel()];

export function setLogLevel(level: LogLevel): void {
  minLevelOrder = LEVEL_ORDER[level];
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] <= minLevelOrder;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  meta?: Record<string, unknown>;
  err?: { message: string; name?: string; stack?: string };
}

function formatEntry(entry: LogEntry): string {
  const isProd = process.env['NODE_ENV'] === 'production';
  if (isProd) {
    return JSON.stringify(entry);
  }
  const meta = entry.meta ? ` ${JSON.stringify(entry.meta)}` : '';
  const err = entry.err ? ` ${entry.err.message}` : '';
  const ctx = entry.context ? `[${entry.context}] ` : '';
  return `${entry.timestamp} ${entry.level.toUpperCase()} ${ctx}${entry.message}${meta}${err}`;
}

function write(level: LogLevel, entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
  if (!shouldLog(level)) return;
  const full: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
    level,
  };
  const out = formatEntry(full);
  if (level === 'error' && full.err?.stack) {
    console.error(out);
    console.error(full.err.stack);
  } else if (level === 'error') {
    console.error(out);
  } else if (level === 'warn') {
    console.warn(out);
  } else {
    console.log(out);
  }
}

export interface LoggerInterface {
  setContext(ctx: string): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, err?: Error | unknown, meta?: Record<string, unknown>): void;
}

export function createLogger(context?: string): LoggerInterface {
  let ctx = context;
  return {
    setContext(c: string) {
      ctx = c;
    },
    debug(message: string, meta?: Record<string, unknown>) {
      write('debug', { context: ctx, message, meta });
    },
    info(message: string, meta?: Record<string, unknown>) {
      write('info', { context: ctx, message, meta });
    },
    warn(message: string, meta?: Record<string, unknown>) {
      write('warn', { context: ctx, message, meta });
    },
    error(message: string, err?: Error | unknown, meta?: Record<string, unknown>) {
      const errPayload =
        err instanceof Error
          ? { message: err.message, name: err.name, stack: err.stack }
          : err != null
            ? { message: String(err) }
            : undefined;
      write('error', { context: ctx, message, err: errPayload, meta });
    },
  };
}

export const rootLogger = createLogger('App');
