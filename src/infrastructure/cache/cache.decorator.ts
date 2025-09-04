import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_PREFIX = 'cache_key_prefix';
export const CACHE_TTL = 'cache_ttl';

export const CachePrefix = (prefix: string) =>
  SetMetadata(CACHE_KEY_PREFIX, prefix);
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL, ttl);

// Example usage:
// @CachePrefix('blog_posts')
// @CacheTTL(300000) // 5 minutes
// async getSomething() { ... }
