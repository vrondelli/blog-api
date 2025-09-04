import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

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
            const contextStr = context ? `[${context}] ` : '';
            const stackStr = stack ? `\n${stack}` : '';
            return `${timestamp} ${level}: ${contextStr}${message}${stackStr}`;
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
    const fs = require('fs');
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs');
    }
  }

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, stack?: string, context?: string) {
    this.logger.error(message, { context, stack });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }
}
