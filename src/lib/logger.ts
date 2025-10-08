/**
 * Centralized Logging Service
 * Provides consistent logging across the application with level control
 */

/* eslint-disable no-console */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogContext {
  [key: string]: any;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

class AppLogger implements Logger {
  private level: LogLevel;
  private isDevelopment: boolean;
  private isClient: boolean;

  constructor() {
    // Determine environment
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.isClient = typeof window !== 'undefined';

    // Set default log level based on environment
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

    // Allow override via environment variable
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
    if (envLevel) {
      const levelMap: Record<string, LogLevel> = {
        'debug': LogLevel.DEBUG,
        'info': LogLevel.INFO,
        'warn': LogLevel.WARN,
        'error': LogLevel.ERROR,
        'none': LogLevel.NONE,
      };
      this.level = levelMap[envLevel.toLowerCase()] ?? this.level;
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const env = this.isClient ? 'CLIENT' : 'SERVER';
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${env}] [${level}] ${message}${contextStr}`;
  }

  private sendToLoggingService(level: string, message: string, context?: LogContext, error?: Error | unknown): void {
    // In production, send to external logging service (e.g., Sentry, LogRocket, etc.)
    if (!this.isDevelopment && this.isClient) {
      // Example: Send to external service
      // window.errorTracker?.captureMessage(message, { level, context });
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const formatted = this.formatMessage('DEBUG', message, context);
    if (this.isDevelopment) {
      console.log(formatted);
    }
    this.sendToLoggingService('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const formatted = this.formatMessage('INFO', message, context);
    if (this.isDevelopment) {
      console.info(formatted);
    } else {
      console.log(formatted);
    }
    this.sendToLoggingService('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const formatted = this.formatMessage('WARN', message, context);
    console.warn(formatted);
    this.sendToLoggingService('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };

    const formatted = this.formatMessage('ERROR', message, errorContext);
    console.error(formatted);

    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }

    this.sendToLoggingService('error', message, errorContext, error);
  }
}

// Export singleton instance
export const logger = new AppLogger();

// Convenience exports for common patterns
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context);
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context);
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context);
export const logError = (message: string, error?: Error | unknown, context?: LogContext) =>
  logger.error(message, error, context);

// Development helper to log API responses
export function logAPIResponse(endpoint: string, status: number, data?: any): void {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`API Response: ${endpoint}`, {
      status,
      data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : data
    });
  }
}

// Development helper to log API errors
export function logAPIError(endpoint: string, error: Error | unknown, context?: LogContext): void {
  logger.error(`API Error: ${endpoint}`, error, context);
}

// Security event logging (always logged, even in production)
export function logSecurityEvent(eventType: string, severity: 'low' | 'medium' | 'high' | 'critical', details: LogContext): void {
  const message = `[SECURITY] ${eventType}`;
  const context = {
    severity,
    ...details,
    system: 'DNB_SVINDELSJEKK',
    timestamp: new Date().toISOString(),
  };

  if (severity === 'critical' || severity === 'high') {
    logger.error(message, undefined, context);
  } else {
    logger.warn(message, context);
  }
}

export default logger;