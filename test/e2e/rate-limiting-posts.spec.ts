/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../src/infrastructure/logging/winston-logger.service';
import { AllExceptionsFilter } from '../../src/infrastructure/exceptions/all-exceptions.filter';
import { CustomValidationPipe } from '../../src/infrastructure/validation/custom-validation.pipe';

describe('Rate Limiting - Posts (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let cacheService: CacheService;

  beforeAll(async () => {
    // Set rate limiting environment variables before creating the app
    process.env.RATE_LIMIT_POSTS_MAX = '5'; // Low limit for posts
    process.env.RATE_LIMIT_COMMENTS_MAX = '1000'; // High limit for comments
    process.env.RATE_LIMIT_WINDOW_MS = '60000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    cacheService = moduleFixture.get<CacheService>(CacheService);

    // Apply the same configuration as main.ts bootstrap
    const logger = app.get(WinstonLoggerService);
    app.useLogger(logger);

    // Apply global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(logger));

    // Apply global validation pipe
    app.useGlobalPipes(new CustomValidationPipe());

    await app.init();
  });

  beforeEach(async () => {
    // Clear cache and database before each test
    await cacheService.reset();
    await databaseService.comment.deleteMany();
    await databaseService.blogPost.deleteMany();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    // Restore original environment variables
    delete process.env.RATE_LIMIT_POSTS_MAX;
    delete process.env.RATE_LIMIT_COMMENTS_MAX;
    delete process.env.RATE_LIMIT_WINDOW_MS;
  });

  describe('Post Creation Rate Limiting', () => {
    it('should enforce rate limits for post creation', async () => {
      // Create posts up to the limit (5 per minute)
      const responses: any[] = [];
      for (let i = 0; i < 6; i++) {
        const response = await request(app.getHttpServer())
          .post('/api/posts')
          .send({
            title: `Test Post ${i}`,
            content: `Content for test post ${i} that is long enough`,
          });
        responses.push(response);
      }

      // First 5 should succeed
      for (let i = 0; i < 5; i++) {
        expect(responses[i].status).toBe(201);
      }

      // 6th should be rate limited
      expect(responses[5].status).toBe(429);
      expect(responses[5].body).toMatchObject({
        error: 'Rate Limit Exceeded',
        message: expect.stringContaining('Too many requests'),
        statusCode: 429,
      });
      expect(responses[5].headers['retry-after']).toBeDefined();
    });
  });
});
