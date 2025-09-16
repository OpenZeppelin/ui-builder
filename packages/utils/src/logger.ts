/**
 * Logger utility for consistent logging across the application.
 * Supports different log levels and can be disabled for testing.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  enabled: boolean;
  level: LogLevel;
}

class Logger {
  private static instance: Logger;
  private options: LoggerOptions = {
    enabled: getDefaultLoggerEnabled(),
    level: 'debug',
  };

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  configure(options: Partial<LoggerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.options.enabled) return false;

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configuredLevelIndex = levels.indexOf(this.options.level);
    const currentLevelIndex = levels.indexOf(level);

    return currentLevelIndex >= configuredLevelIndex;
  }

  private formatMessage(level: LogLevel, system: string, message: string): string {
    return `[${level.toUpperCase()}][${system}] ${message}`;
  }

  debug(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('debug', system, message), ...args);
    }
  }

  info(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.log(this.formatMessage('info', system, message), ...args);
    }
  }

  warn(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('warn', system, message), ...args);
    }
  }

  error(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      // eslint-disable-next-line no-console
      console.error(this.formatMessage('error', system, message), ...args);
    }
  }
}

export const logger = Logger.getInstance();

/**
 * Determine whether logging should be enabled by default.
 *
 * - In Vite/browser contexts, use `import.meta.env.DEV`.
 * - In Node/tsup contexts, use `process.env.NODE_ENV`.
 *
 * Defaults to disabled outside development to avoid runtime overhead and noise.
 */
function getDefaultLoggerEnabled(): boolean {
  // Vite/browser: `import.meta.env.DEV` is true in dev, false in prod builds
  try {
    // Use a narrow, typed access pattern to avoid depending on Vite types in this package
    const viteEnvDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (typeof viteEnvDev === 'boolean') {
      return viteEnvDev;
    }
  } catch {
    // Ignore environments where import.meta is not available or lacks env
  }

  // Node/tsup: consider development as the only environment with default logging
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
    const nodeEnv = process.env.NODE_ENV;
    return nodeEnv === 'development' || nodeEnv === undefined;
  }

  // Safe fallback: disabled
  return false;
}
