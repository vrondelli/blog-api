import { Injectable } from '@nestjs/common';

export interface RateLimitConfig {
  windowMs: number;
  posts: {
    maxRequests: number;
  };
  comments: {
    maxRequests: number;
  };
  default: {
    maxRequests: number;
  };
}

@Injectable()
export class RateLimitConfigService {
  private config: RateLimitConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  getConfig(): RateLimitConfig {
    return this.config;
  }

  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private getDefaultConfig(): RateLimitConfig {
    return {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      posts: {
        maxRequests: parseInt(process.env.RATE_LIMIT_POSTS_MAX || '5'),
      },
      comments: {
        maxRequests: parseInt(process.env.RATE_LIMIT_COMMENTS_MAX || '20'),
      },
      default: {
        maxRequests: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '100'),
      },
    };
  }

  reset(): void {
    this.config = this.getDefaultConfig();
  }
}
