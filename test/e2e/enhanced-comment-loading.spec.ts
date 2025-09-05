import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/*    it('should handle negative depth parameter gracefully', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/posts/${testBlogPostId}/comments?depth=-1`,
      );
      
      if (response.status !== 400) {
        console.log('Error response:', response.body);
      }
      expect(response.status).toBe(400); // Negative depth should be rejected by validation

      expect(response.body.message).toContain('depth must not be less than 0');
    });ble @typescript-eslint/no-unsafe-member-access */

describe('Enhanced Comment Loading (E2E)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let cacheService: CacheService;

  let testBlogPostId: number;
  let testComments: any[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    databaseService = moduleFixture.get<DatabaseService>(DatabaseService);
    cacheService = moduleFixture.get<CacheService>(CacheService);

    await app.init();

    // Clear cache and database
    await cacheService.reset();
    await databaseService.comment.deleteMany();
    await databaseService.blogPost.deleteMany();

    // Create test blog post
    const testPost = await databaseService.blogPost.create({
      data: {
        title: 'Test Post for Enhanced Comments',
        content: 'This is a test post for enhanced comment loading.',
      },
    });
    testBlogPostId = testPost.id;
  });

  afterAll(async () => {
    await databaseService.comment.deleteMany();
    await databaseService.blogPost.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    // Clear comments and cache before each test
    await databaseService.comment.deleteMany();
    await cacheService.reset();
    testComments = [];
  });

  describe('Depth-based comment loading', () => {
    beforeEach(async () => {
      // Create a hierarchical comment structure:
      // Comment 1 (top-level)
      //   ├── Reply 1-1 (depth 1)
      //   │   ├── Reply 1-1-1 (depth 2)
      //   │   └── Reply 1-1-2 (depth 2)
      //   └── Reply 1-2 (depth 1)
      // Comment 2 (top-level)
      //   └── Reply 2-1 (depth 1)

      // Create top-level comment 1
      const comment1 = await databaseService.comment.create({
        data: {
          content: 'Top-level comment 1',
          author: 'User1',
          blogPostId: testBlogPostId,
          parentId: null,
        },
      });
      testComments.push(comment1);

      // Create top-level comment 2
      const comment2 = await databaseService.comment.create({
        data: {
          content: 'Top-level comment 2',
          author: 'User2',
          blogPostId: testBlogPostId,
          parentId: null,
        },
      });
      testComments.push(comment2);

      // Create replies to comment 1
      const reply1_1 = await databaseService.comment.create({
        data: {
          content: 'Reply 1-1',
          author: 'User3',
          blogPostId: testBlogPostId,
          parentId: comment1.id,
        },
      });
      testComments.push(reply1_1);

      const reply1_2 = await databaseService.comment.create({
        data: {
          content: 'Reply 1-2',
          author: 'User4',
          blogPostId: testBlogPostId,
          parentId: comment1.id,
        },
      });
      testComments.push(reply1_2);

      // Create nested replies to reply 1-1
      const reply1_1_1 = await databaseService.comment.create({
        data: {
          content: 'Reply 1-1-1',
          author: 'User5',
          blogPostId: testBlogPostId,
          parentId: reply1_1.id,
        },
      });
      testComments.push(reply1_1_1);

      const reply1_1_2 = await databaseService.comment.create({
        data: {
          content: 'Reply 1-1-2',
          author: 'User6',
          blogPostId: testBlogPostId,
          parentId: reply1_1.id,
        },
      });
      testComments.push(reply1_1_2);

      // Create reply to comment 2
      const reply2_1 = await databaseService.comment.create({
        data: {
          content: 'Reply 2-1',
          author: 'User7',
          blogPostId: testBlogPostId,
          parentId: comment2.id,
        },
      });
      testComments.push(reply2_1);
    });

    it('should load comments with default depth of 2', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments`)
        .expect(200);

      expect(response.body.data).toHaveLength(2); // Two top-level comments

      // Check first comment has replies loaded
      const firstComment = response.body.data[0];
      expect(firstComment.replies).toBeDefined();
      expect(firstComment.replies).toHaveLength(2); // Reply 1-1 and Reply 1-2

      // Check nested replies are loaded (depth 2)
      const firstReply = firstComment.replies.find(
        (r: any) => r.content === 'Reply 1-1',
      );
      expect(firstReply.replies).toBeDefined();
      expect(firstReply.replies).toHaveLength(2); // Reply 1-1-1 and Reply 1-1-2

      // Check second reply doesn't have nested replies
      const secondReply = firstComment.replies.find(
        (r: any) => r.content === 'Reply 1-2',
      );
      expect(secondReply.replies).toBeUndefined();
    });

    it('should respect depth=0 parameter (no nested replies)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?depth=0`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);

      // Comments should not have replies loaded
      response.body.data.forEach((comment: any) => {
        expect(comment.replies).toBeUndefined();
      });
    });

    it('should respect depth=1 parameter (only direct replies)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?depth=1`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);

      const firstComment = response.body.data[0];
      expect(firstComment.replies).toBeDefined();
      expect(firstComment.replies).toHaveLength(2);

      // Direct replies should not have nested replies loaded
      firstComment.replies.forEach((reply: any) => {
        expect(reply.replies).toBeUndefined();
      });
    });

    it('should handle depth=3 parameter (deeper nesting)', async () => {
      // Create an even deeper nested comment
      const deepestReply = await databaseService.comment.create({
        data: {
          content: 'Very deep reply',
          author: 'User8',
          blogPostId: testBlogPostId,
          parentId: testComments.find((c) => c.content === 'Reply 1-1-1')?.id,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?depth=3`)
        .expect(200);

      const firstComment = response.body.data[0];
      const firstReply = firstComment.replies.find(
        (r: any) => r.content === 'Reply 1-1',
      );
      const nestedReply = firstReply.replies.find(
        (r: any) => r.content === 'Reply 1-1-1',
      );

      expect(nestedReply.replies).toBeDefined();
      expect(nestedReply.replies).toHaveLength(1);
      expect(nestedReply.replies[0].content).toBe('Very deep reply');
    });
  });

  describe('Cursor-based pagination', () => {
    beforeEach(async () => {
      // Create 10 top-level comments for pagination testing
      for (let i = 1; i <= 10; i++) {
        const comment = await databaseService.comment.create({
          data: {
            content: `Comment ${i}`,
            author: `User${i}`,
            blogPostId: testBlogPostId,
            parentId: null,
          },
        });
        testComments.push(comment);

        // Add some delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    it('should return first page with nextCursor when more comments exist', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?limit=3&depth=0`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.hasNext).toBe(true);
      expect(response.body.hasPrev).toBe(false);
      expect(response.body.nextCursor).toBeDefined();
      expect(typeof response.body.nextCursor).toBe('string');
    });

    it('should support cursor-based pagination with cursor parameter', async () => {
      // Get first page
      const firstPageResponse = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?limit=3&depth=0`)
        .expect(200);

      const nextCursor = firstPageResponse.body.nextCursor;
      expect(nextCursor).toBeDefined();

      // Get second page using cursor
      const secondPageResponse = await request(app.getHttpServer())
        .get(
          `/api/posts/${testBlogPostId}/comments?limit=3&depth=0&cursor=${nextCursor}`,
        )
        .expect(200);

      expect(secondPageResponse.body.data).toHaveLength(3);
      expect(secondPageResponse.body.hasPrev).toBe(true);
      expect(secondPageResponse.body.hasNext).toBe(true);

      // Ensure different comments are returned
      const firstPageIds = firstPageResponse.body.data.map((c: any) => c.id);
      const secondPageIds = secondPageResponse.body.data.map((c: any) => c.id);
      expect(firstPageIds).not.toEqual(secondPageIds);
    });

    it('should handle last page correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?limit=15&depth=0`) // Request more than available
        .expect(200);

      expect(response.body.data).toHaveLength(10); // Only 10 comments exist
      expect(response.body.hasNext).toBe(false);
      expect(response.body.nextCursor).toBeNull();
    });
  });

  describe('Reply endpoint with depth and cursor', () => {
    let parentCommentId: number;

    beforeEach(async () => {
      // Create a parent comment
      const parentComment = await databaseService.comment.create({
        data: {
          content: 'Parent comment',
          author: 'ParentUser',
          blogPostId: testBlogPostId,
          parentId: null,
        },
      });
      parentCommentId = parentComment.id;

      // Create 5 direct replies
      for (let i = 1; i <= 5; i++) {
        const reply = await databaseService.comment.create({
          data: {
            content: `Direct reply ${i}`,
            author: `ReplyUser${i}`,
            blogPostId: testBlogPostId,
            parentId: parentCommentId,
          },
        });

        // Create nested replies for first two direct replies
        if (i <= 2) {
          await databaseService.comment.create({
            data: {
              content: `Nested reply ${i}-1`,
              author: `NestedUser${i}`,
              blogPostId: testBlogPostId,
              parentId: reply.id,
            },
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    });

    it('should load replies with depth control', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies?depth=2`)
        .expect(200);

      expect(response.body.data).toHaveLength(5);

      // Check first two replies have nested replies
      const firstReply = response.body.data[0];
      const secondReply = response.body.data[1];

      expect(firstReply.replies).toBeDefined();
      expect(firstReply.replies).toHaveLength(1);
      expect(secondReply.replies).toBeDefined();
      expect(secondReply.replies).toHaveLength(1);

      // Check remaining replies don't have nested replies
      for (let i = 2; i < 5; i++) {
        expect(response.body.data[i].replies).toBeUndefined();
      }
    });

    it('should support cursor pagination for replies', async () => {
      const firstPageResponse = await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies?limit=2&depth=0`)
        .expect(200);

      expect(firstPageResponse.body.data).toHaveLength(2);
      expect(firstPageResponse.body.hasNext).toBe(true);
      expect(firstPageResponse.body.nextCursor).toBeDefined();

      // Get next page
      const nextCursor = firstPageResponse.body.nextCursor;
      const secondPageResponse = await request(app.getHttpServer())
        .get(
          `/api/comments/${parentCommentId}/replies?limit=2&depth=0&cursor=${nextCursor}`,
        )
        .expect(200);

      expect(secondPageResponse.body.data).toHaveLength(2);
      expect(secondPageResponse.body.hasPrev).toBe(true);

      // Verify different replies
      const firstPageIds = firstPageResponse.body.data.map((r: any) => r.id);
      const secondPageIds = secondPageResponse.body.data.map((r: any) => r.id);
      expect(firstPageIds).not.toEqual(secondPageIds);
    });

    it('should combine depth and cursor parameters correctly', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/comments/${parentCommentId}/replies?limit=2&depth=1`,
      );

      if (response.status !== 200) {
        console.log('Error response:', response.body);
      }
      expect(response.status).toBe(200);

      expect(response.body.data).toHaveLength(2);

      // First two replies should have nested replies loaded
      response.body.data.forEach((reply: any) => {
        if (
          reply.content.includes('Direct reply 1') ||
          reply.content.includes('Direct reply 2')
        ) {
          expect(reply.replies).toBeDefined();
          expect(reply.replies).toHaveLength(1);
        }
      });
    });
  });

  describe('Error handling for new parameters', () => {
    it('should handle invalid depth parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?depth=invalid`)
        .expect(400);

      expect(response.body.message).toContain(
        'depth must be an integer number',
      );
    });

    it('should handle invalid cursor parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${testBlogPostId}/comments?cursor=invalid`)
        .expect(200); // Invalid cursors are treated as no cursor, so it should succeed

      expect(response.body.data).toBeDefined();
    });

    it('should handle negative depth parameter gracefully', async () => {
      const response = await request(app.getHttpServer()).get(
        `/api/posts/${testBlogPostId}/comments?depth=-1`,
      );

      if (response.status !== 400) {
        console.log('Error response:', response.body);
      }
      expect(response.status).toBe(400);

      expect(response.body.message).toContain('depth must not be less than 0');
    });
  });

  describe('Performance and edge cases', () => {
    it('should handle large depth values efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer()).get(
        `/api/posts/${testBlogPostId}/comments?depth=10`,
      );

      if (response.status !== 200) {
        console.log('Error response:', response.body);
      }
      expect(response.status).toBe(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(responseTime).toBeLessThan(5000); // 5 seconds
      expect(response.body.data).toBeDefined();
    });

    it('should handle empty comment threads', async () => {
      // Create a blog post with no comments
      const emptyPost = await databaseService.blogPost.create({
        data: {
          title: 'Empty Post',
          content: 'Post with no comments',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/posts/${emptyPost.id}/comments?depth=2`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
      expect(response.body.total).toBe(0);
      expect(response.body.hasNext).toBe(false);
      expect(response.body.nextCursor).toBeNull();
    });

    it('should handle cursor for non-existent comment', async () => {
      const nonExistentCursor = Buffer.from(
        JSON.stringify({ createdAt: new Date(), id: 99999 }),
      ).toString('base64');

      const response = await request(app.getHttpServer())
        .get(
          `/api/posts/${testBlogPostId}/comments?cursor=${nonExistentCursor}`,
        )
        .expect(200);

      // Should return empty results or handle gracefully
      expect(response.body.data).toBeDefined();
      expect(response.body.data).toHaveLength(0);
    });
  });
});
