import { registerAs } from '@nestjs/config';

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

export default registerAs(
  'rateLimit',
  (): RateLimitConfig => ({
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
  }),
);
