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
    enabled: true,
    level: 'info',
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
    return `[${system}] ${message}`;
  }

  debug(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', system, message), ...args);
    }
  }

  info(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', system, message), ...args);
    }
  }

  warn(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', system, message), ...args);
    }
  }

  error(system: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', system, message), ...args);
    }
  }
}

export const logger = Logger.getInstance();
