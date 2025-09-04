import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const isTest = process.env.NODE_ENV === 'test';

        if (isTest) {
          // Use in-memory cache for tests
          return {
            ttl: 60 * 1000, // 1 minute TTL for tests
          };
        }

        // Use Redis for development/production
        return {
          store: await redisStore({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
          }),
          ttl: 60 * 60 * 1000, // 1 hour default TTL
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}
