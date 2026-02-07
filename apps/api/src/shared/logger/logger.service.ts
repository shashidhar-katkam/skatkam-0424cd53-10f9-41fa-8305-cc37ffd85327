import { Injectable } from '@nestjs/common';
import { createLogger, type LoggerInterface } from './logger.util';

/**
 * Nest-injectable logger. Use setContext() in constructor or on first use.
 */
@Injectable()
export class AppLoggerService implements LoggerInterface {
  private logger = createLogger();

  setContext(ctx: string): void {
    this.logger.setContext(ctx);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  error(message: string, err?: Error | unknown, meta?: Record<string, unknown>): void {
    this.logger.error(message, err, meta);
  }
}
