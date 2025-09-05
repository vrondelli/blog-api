/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { CacheService } from '../../src/infrastructure/cache/cache.service';
import { E2ETestSetup } from '../setup/e2e-setup';

describe('Cache Integration (e2e)', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let cacheService: CacheService;

  beforeAll(async () => {
    app = await E2ETestSetup.getApp();
    databaseService = app.get(DatabaseService);
    cacheService = app.get(CacheService);
  });

  beforeEach(async () => {
    // Clear database and cache before each test
    await E2ETestSetup.resetDatabase();
    await cacheService.reset();
  });

  afterAll(async () => {
    await E2ETestSetup.cleanup();
  });

  describe('Blog Posts Caching', () => {
    it('should cache blog posts list on first request and serve from cache on second', async () => {
      // Create test data
      const postData = {
        title: 'Test Post',
        content: 'Test Content for caching validation',
      };

      await request(app.getHttpServer())
        .post('/api/posts')
        .send(postData)
        .expect(201);

      // Spy on database query to verify cache behavior
      const findManySpy = jest.spyOn(databaseService.blogPost, 'findMany');

      // First request - should hit database and cache the result
      const firstResponse = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(firstResponse.body).toHaveLength(1);
      expect(firstResponse.body[0].title).toBe(postData.title);

      // Reset spy
      findManySpy.mockClear();

      // Second request - should serve from cache, not hit database
      const secondResponse = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(findManySpy).not.toHaveBeenCalled();
      expect(secondResponse.body).toEqual(firstResponse.body);
    });

    it('should invalidate cache when creating a new post', async () => {
      // Create initial post
      await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'First Post',
          content: 'First Content for cache testing',
        })
        .expect(201);

      // Cache the posts list
      await request(app.getHttpServer()).get('/api/posts').expect(200);

      // Verify cache is populated
      const cachedList = await cacheService.getBlogPostsList();
      expect(cachedList).toHaveLength(1);

      // Create second post - should invalidate cache
      await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Second Post',
          content: 'Second Content for cache testing',
        })
        .expect(201);

      // Verify cache was invalidated
      const invalidatedCache = await cacheService.getBlogPostsList();
      expect(invalidatedCache).toBeUndefined();

      // New request should fetch fresh data
      const response = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('Single Post with Comments Caching', () => {
    let createdPostId: number;

    beforeEach(async () => {
      // Create a test post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Test Post for Comments',
          content: 'Test Content for cache testing',
        })
        .expect(201);

      createdPostId = postResponse.body.id;

      // Add some comments
      await request(app.getHttpServer())
        .post(`/api/posts/${createdPostId}/comments`)
        .send({
          content: 'First comment',
          author: 'Comment Author 1',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/posts/${createdPostId}/comments`)
        .send({
          content: 'Second comment',
          author: 'Comment Author 2',
        })
        .expect(201);
    });

    it('should cache post with comments and serve from cache on subsequent requests', async () => {
      // Spy on database queries
      const postFindUniqueSpy = jest.spyOn(
        databaseService.blogPost,
        'findUnique',
      );
      const commentFindManySpy = jest.spyOn(
        databaseService.comment,
        'findMany',
      );

      // First request - should hit database
      const firstResponse = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}?includeComments=true`)
        .expect(200);

      expect(postFindUniqueSpy).toHaveBeenCalled();
      expect(commentFindManySpy).toHaveBeenCalled();
      expect(firstResponse.body.post.title).toBe('Test Post for Comments');
      expect(firstResponse.body.comments.data).toHaveLength(2);

      // Reset spies
      postFindUniqueSpy.mockClear();
      commentFindManySpy.mockClear();

      // Second request - should serve from cache
      const secondResponse = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}?includeComments=true`)
        .expect(200);

      expect(postFindUniqueSpy).not.toHaveBeenCalled();
      expect(commentFindManySpy).not.toHaveBeenCalled();
      expect(secondResponse.body).toEqual(firstResponse.body);
    });

    it('should differentiate cache for post with and without comments', async () => {
      // Request with comments
      const withCommentsResponse = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}?includeComments=true`)
        .expect(200);

      // Request without comments
      const withoutCommentsResponse = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}?includeComments=false`)
        .expect(200);

      expect(withCommentsResponse.body.comments).toBeTruthy();
      expect(withoutCommentsResponse.body.comments).toBeNull();

      // Verify both are cached independently
      const cachedWithComments = await cacheService.getPostWithComments(
        createdPostId,
        true,
        10, // default commentsLimit
        undefined, // no cursor
        undefined, // default commentsSortOrder
      );
      const cachedWithoutComments = await cacheService.getPostWithComments(
        createdPostId,
        false,
        10, // default commentsLimit
        undefined, // no cursor
        undefined, // default commentsSortOrder
      );

      expect(cachedWithComments).toBeDefined();
      expect(cachedWithoutComments).toBeDefined();
      expect(cachedWithComments.comments).toBeTruthy();
      expect(cachedWithoutComments.comments).toBeNull();
    });

    it('should invalidate cache when adding a new comment', async () => {
      // Cache the post with comments
      await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}?includeComments=true`)
        .expect(200);

      // Verify cache is populated
      const cachedPost = await cacheService.getPostWithComments(
        createdPostId,
        true,
        10, // default commentsLimit
        undefined, // no cursor
        undefined, // default commentsSortOrder
      );
      expect(cachedPost).toBeDefined();
      expect(cachedPost.comments.data).toHaveLength(2);

      // Add a new comment - should invalidate cache
      await request(app.getHttpServer())
        .post(`/api/posts/${createdPostId}/comments`)
        .send({
          content: 'Third comment',
          author: 'Comment Author 3',
        })
        .expect(201);

      // Verify cache was invalidated
      const invalidatedCache = await cacheService.getPostWithComments(
        createdPostId,
        true,
        10, // default commentsLimit
        undefined, // no cursor
        undefined, // default commentsSortOrder
      );
      expect(invalidatedCache).toBeUndefined();

      // New request should fetch fresh data with 3 comments
      const response = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}?includeComments=true`)
        .expect(200);

      expect(response.body.comments.data).toHaveLength(3);
    });
  });

  describe('Comments Pagination Caching', () => {
    let createdPostId: number;

    beforeEach(async () => {
      // Create a test post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Test Post for Pagination',
          content: 'Test Content for pagination testing',
        })
        .expect(201);

      createdPostId = postResponse.body.id;

      // Add multiple comments for pagination testing
      for (let i = 1; i <= 15; i++) {
        await request(app.getHttpServer())
          .post(`/api/posts/${createdPostId}/comments`)
          .send({
            content: `Comment ${i}`,
            author: `Author ${i}`,
          })
          .expect(201);
      }
    });

    it('should cache different pages independently', async () => {
      // Clear cache and reset spies
      await cacheService.reset();

      // Spy on database query
      const commentFindManySpy = jest.spyOn(
        databaseService.comment,
        'findMany',
      );
      commentFindManySpy.mockClear();

      // Request first batch
      const firstResponse = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}/comments?limit=5&depth=0`)
        .expect(200);

      expect(commentFindManySpy).toHaveBeenCalledTimes(1);
      expect(firstResponse.body.data).toHaveLength(5);
      expect(firstResponse.body.hasNext).toBe(true);

      // Request second batch using cursor
      const secondResponse = await request(app.getHttpServer())
        .get(
          `/api/posts/${createdPostId}/comments?limit=5&depth=0&cursor=${firstResponse.body.nextCursor}`,
        )
        .expect(200);

      expect(commentFindManySpy).toHaveBeenCalledTimes(2);
      expect(secondResponse.body.data).toHaveLength(5);
      expect(secondResponse.body.hasNext).toBe(true); // Still more comments (11-15)

      // Reset spy
      commentFindManySpy.mockClear();

      // Request first batch again - should serve from cache (no cursor)
      const firstCachedResponse = await request(app.getHttpServer())
        .get(`/api/posts/${createdPostId}/comments?limit=5&depth=0`)
        .expect(200);

      expect(commentFindManySpy).not.toHaveBeenCalled();
      expect(firstCachedResponse.body).toEqual(firstResponse.body);

      // Request second batch again - should NOT be cached (has cursor)
      const secondNotCachedResponse = await request(app.getHttpServer())
        .get(
          `/api/posts/${createdPostId}/comments?limit=5&depth=0&cursor=${firstResponse.body.nextCursor}`,
        )
        .expect(200);

      expect(commentFindManySpy).toHaveBeenCalledTimes(1); // Should fetch from DB
      expect(secondNotCachedResponse.body).toEqual(secondResponse.body);
    });

    it('should cache different sort orders independently', async () => {
      // Clear cache first
      await cacheService.reset();

      // Request with most_recent sort
      const recentResponse = await request(app.getHttpServer())
        .get(
          `/api/posts/${createdPostId}/comments?sortOrder=most_recent&limit=5`,
        )
        .expect(200);

      // Request with oldest_first sort
      const oldestResponse = await request(app.getHttpServer())
        .get(
          `/api/posts/${createdPostId}/comments?sortOrder=oldest_first&limit=5`,
        )
        .expect(200);

      // Verify responses are valid
      expect(recentResponse.status).toBe(200);
      expect(oldestResponse.status).toBe(200);

      // Verify they're cached independently
      const cachedRecent = await cacheService.getComments(
        createdPostId,
        5,
        'most_recent',
        2, // default depth
      );
      const cachedOldest = await cacheService.getComments(
        createdPostId,
        5,
        'oldest_first',
        2, // default depth
      );

      expect(cachedRecent).toBeDefined();
      expect(cachedOldest).toBeDefined();
      expect(cachedRecent).not.toEqual(cachedOldest);
    });
  });

  describe('Hierarchical Comments Caching', () => {
    let createdPostId: number;
    let parentCommentId: number;

    beforeEach(async () => {
      // Create a test post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Test Post for Replies',
          content: 'Test Content for replies testing',
        })
        .expect(201);

      createdPostId = postResponse.body.id;

      // Create a parent comment
      const commentResponse = await request(app.getHttpServer())
        .post(`/api/posts/${createdPostId}/comments`)
        .send({
          content: 'Parent comment',
          author: 'Parent Author',
        })
        .expect(201);

      parentCommentId = commentResponse.body.id;

      // Add replies
      for (let i = 1; i <= 5; i++) {
        await request(app.getHttpServer())
          .post(`/api/posts/${createdPostId}/comments`)
          .send({
            content: `Reply ${i}`,
            author: `Reply Author ${i}`,
            parentId: parentCommentId,
          })
          .expect(201);
      }
    });

    it('should cache replies independently from top-level comments', async () => {
      // Spy on database query
      const commentFindManySpy = jest.spyOn(
        databaseService.comment,
        'findMany',
      );

      // Request replies
      const repliesResponse = await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies`)
        .expect(200);

      expect(commentFindManySpy).toHaveBeenCalled();
      expect(repliesResponse.body.data).toHaveLength(5);

      // Reset spy
      commentFindManySpy.mockClear();

      // Request replies again - should serve from cache
      const cachedRepliesResponse = await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies`)
        .expect(200);

      expect(commentFindManySpy).not.toHaveBeenCalled();
      expect(cachedRepliesResponse.body).toEqual(repliesResponse.body);
    });

    it('should invalidate replies cache when adding new reply', async () => {
      // Cache replies
      await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies?limit=10`)
        .expect(200);

      // Verify cache is populated
      const cachedReplies = await cacheService.getReplies(
        parentCommentId,
        10,
        undefined, // default sort order
        2, // default depth
      );
      expect(cachedReplies).toBeDefined();
      expect(cachedReplies.data).toHaveLength(5);

      // Add a new reply - should invalidate cache
      const createReplyResponse = await request(app.getHttpServer())
        .post(`/api/posts/${createdPostId}/comments`)
        .send({
          content: 'New reply',
          author: 'New Reply Author',
          parentId: parentCommentId,
        })
        .expect(201);

      // Verify the reply was created with correct parentId
      expect(createReplyResponse.body.parentId).toBe(parentCommentId);
      expect(createReplyResponse.body.content).toBe('New reply');

      // Verify cache was invalidated
      const invalidatedCache = await cacheService.getReplies(
        parentCommentId,
        10,
        undefined, // default sort order
        2, // default depth
      );
      expect(invalidatedCache).toBeUndefined();

      // New request should fetch fresh data with 6 replies
      const response = await request(app.getHttpServer())
        .get(`/api/comments/${parentCommentId}/replies?limit=10`)
        .expect(200);

      expect(response.body.data).toHaveLength(6);
      expect(response.body.total).toBe(6);
    });
  });

  describe('Cache TTL and Expiration', () => {
    it('should respect cache TTL for blog posts', async () => {
      // Create a post
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'TTL Test Post',
          content: 'TTL Test Content for cache expiration testing',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Set cache with very short TTL (1 second)
      await cacheService.setBlogPost(postId, postResponse.body, 1000);

      // Verify cache is populated
      const cached = await cacheService.getBlogPost(postId);
      expect(cached).toBeDefined();

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Verify cache has expired
      const expired = await cacheService.getBlogPost(postId);
      expect(expired).toBeUndefined();
    });
  });

  describe('Performance Testing', () => {
    it('should significantly improve response times with cache', async () => {
      // Create test data
      const postResponse = await request(app.getHttpServer())
        .post('/api/posts')
        .send({
          title: 'Performance Test Post',
          content: 'Performance Test Content for performance testing',
        })
        .expect(201);

      const postId = postResponse.body.id;

      // Add many comments to make database query slower
      for (let i = 1; i <= 50; i++) {
        await request(app.getHttpServer())
          .post(`/api/posts/${postId}/comments`)
          .send({
            content: `Performance test comment ${i}`,
            author: `Author ${i}`,
          });
      }

      // First request - measure time (cache miss)
      const start1 = Date.now();
      await request(app.getHttpServer())
        .get(`/api/posts/${postId}?includeComments=true`)
        .expect(200);
      const time1 = Date.now() - start1;

      // Second request - measure time (cache hit)
      const start2 = Date.now();
      await request(app.getHttpServer())
        .get(`/api/posts/${postId}?includeComments=true`)
        .expect(200);
      const time2 = Date.now() - start2;

      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.8); // At least 20% faster

      // Alternative check: cache hit should be reasonably fast (under 50ms)
      expect(time2).toBeLessThan(50);
    });
  });
});
