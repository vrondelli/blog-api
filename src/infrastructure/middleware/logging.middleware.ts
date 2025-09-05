import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WinstonLoggerService } from '../logging/winston-logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: WinstonLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    // Log the incoming request
    this.logger.log(
      `${method} ${originalUrl} - ${ip} - ${userAgent}`,
      'HTTP Request',
    );

    // Log response when it finishes
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('Content-Length') || '0';

      this.logger.log(
        `${method} ${originalUrl} - ${statusCode} - ${contentLength}bytes - ${responseTime}ms`,
        'HTTP Response',
      );
    });

    next();
  }
}
