import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CacheService } from '../cache/cache.service';
import { RateLimitException } from '../exceptions/custom.exceptions';
import { WinstonLoggerService } from '../logging/winston-logger.service';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
  };

  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const config = this.getConfig(request.url);

    const key = this.generateKey(request, config);
    const currentCount = await this.getCurrentCount(key);

    if (currentCount >= config.maxRequests) {
      this.logger.warn(
        `Rate limit exceeded for ${request.ip}: ${currentCount}/${config.maxRequests}`,
        'RateLimitGuard',
      );
      throw new RateLimitException(config.maxRequests, config.windowMs);
    }

    // Increment counter
    await this.incrementCounter(key, config.windowMs);

    this.logger.debug(
      `Rate limit check passed for ${request.ip}: ${currentCount + 1}/${config.maxRequests}`,
      'RateLimitGuard',
    );

    return true;
  }

  private getConfig(endpoint: string): RateLimitConfig {
    // More permissive limits for testing environment
    const isTestEnv = process.env.NODE_ENV === 'test';

    if (endpoint.includes('/posts') && !endpoint.includes('/comments')) {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: isTestEnv ? 1000 : 5, // 1000 posts per minute in test, 5 in production
      };
    }

    if (endpoint.includes('/comments')) {
      return {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: isTestEnv ? 1000 : 20, // 1000 comments per minute in test, 20 in production
      };
    }

    return this.defaultConfig;
  }

  private generateKey(request: Request, config: RateLimitConfig): string {
    if (config.keyGenerator) {
      return config.keyGenerator(request);
    }

    // Default: use IP address and endpoint
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    const endpoint = `${request.method}:${request.route?.path || request.path}`;

    return `rate_limit:${ip}:${endpoint}`;
  }

  private async getCurrentCount(key: string): Promise<number> {
    try {
      const count = await this.cacheService.get<number>(key);
      return count || 0;
    } catch (error) {
      this.logger.warn(
        `Failed to get rate limit count for key ${key}: ${error}`,
        'RateLimitGuard',
      );
      // On cache failure, allow request to proceed
      return 0;
    }
  }

  private async incrementCounter(key: string, windowMs: number): Promise<void> {
    try {
      const current = await this.getCurrentCount(key);
      await this.cacheService.set(key, current + 1, windowMs);
    } catch (error) {
      this.logger.warn(
        `Failed to increment rate limit counter for key ${key}: ${error}`,
        'RateLimitGuard',
      );
      // On cache failure, allow request to proceed
    }
  }
}
