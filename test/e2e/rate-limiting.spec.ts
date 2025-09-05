/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unused-vars */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../src/infrastructure/logging/winston-logger.service';
import { AllExceptionsFilter } from '../../src/infrastructure/exceptions/all-exceptions.filter';
import { CustomValidationPipe } from '../../src/infrastructure/validation/custom-validation.pipe';

describe('Rate Limiting (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let cacheService: CacheService;
  let configService: ConfigService;

  async function createAppWithConfig(
    overrides: Record<string, any> = {},
  ): Promise<void> {
    // Set environment variables for this test
    const originalEnv = { ...process.env };

    // Apply overrides to environment
    Object.assign(process.env, overrides);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    cacheService = moduleFixture.get<CacheService>(CacheService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    // Apply the same configuration as main.ts bootstrap
    const logger = app.get(WinstonLoggerService);
    app.useLogger(logger);

    // Apply global exception filter
    app.useGlobalFilters(new AllExceptionsFilter(logger));

    // Apply global validation pipe
    app.useGlobalPipes(new CustomValidationPipe());

    await app.init();

    // Restore original environment
    process.env = originalEnv;
  }

  async function closeApp(): Promise<void> {
    if (app) {
      await app.close();
    }
  }

  beforeEach(async () => {
    // Clear cache and database
    if (cacheService) {
      await cacheService.reset();
    }
    if (databaseService) {
      await databaseService.comment.deleteMany();
      await databaseService.blogPost.deleteMany();
    }
  });

  afterEach(async () => {
    await closeApp();
  });

  describe('Post Creation Rate Limiting', () => {
    it('should enforce rate limits for post creation', async () => {
      // Create app with low post limits and high comment limits
      await createAppWithConfig({
        RATE_LIMIT_POSTS_MAX: '5',
        RATE_LIMIT_COMMENTS_MAX: '1000',
        RATE_LIMIT_WINDOW_MS: '60000',
      });

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

  describe('Comment Creation Rate Limiting', () => {
    it('should enforce rate limits for comment creation', async () => {
      // Create app with high post limits and low comment limits
      await createAppWithConfig({
        RATE_LIMIT_POSTS_MAX: '1000',
        RATE_LIMIT_COMMENTS_MAX: '20',
        RATE_LIMIT_WINDOW_MS: '60000',
      });

      // First create a blog post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Test Post for Comments',
          content: 'Content for testing comment rate limits',
        })
        .expect(201);

      // Create comments up to the limit (20 per minute)
      const responses: any[] = [];
      for (let i = 0; i < 21; i++) {
        const response = await request(app.getHttpServer())
          .post(`/api/posts/${postResponse.body.id}/comments`)
          .send({
            content: `Test comment ${i}`,
            author: `Author ${i}`,
          });
        responses.push(response);
      }

      // First 20 should succeed
      for (let i = 0; i < 20; i++) {
        expect(responses[i].status).toBe(201);
      }

      // 21st should be rate limited
      expect(responses[20].status).toBe(429);
      expect(responses[20].body).toMatchObject({
        error: 'Rate Limit Exceeded',
        statusCode: 429,
      });
    });
  });
});
