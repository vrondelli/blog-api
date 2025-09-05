import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as fs from 'fs';

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
          ({ timestamp, level, message, context, stack }) => {
            const contextStr = context ? `[${String(context)}] ` : '';
            const stackStr = stack ? `\n${String(stack)}` : '';
            return `${String(timestamp)} ${String(level)}: ${contextStr}${String(message)}${stackStr}`;
          },
        ),
      ),
      transports: [
        new winston.transports.Console({
          level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
    });

    // Create logs directory if it doesn't exist
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
  }

  log(message: string, context?: string) {
    this.logger.info(String(message), {
      context: context ? String(context) : undefined,
    });
  }

  error(message: string, stack?: string, context?: string) {
    this.logger.error(String(message), {
      context: context ? String(context) : undefined,
      stack: stack ? String(stack) : undefined,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(String(message), {
      context: context ? String(context) : undefined,
    });
  }

  debug(message: string, context?: string) {
    this.logger.debug(String(message), {
      context: context ? String(context) : undefined,
    });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(String(message), {
      context: context ? String(context) : undefined,
    });
  }
}
