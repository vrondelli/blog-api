import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService } from './cache.service';
import { WinstonLoggerService } from '../logging/winston-logger.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: Cache;
  let mockLogger: jest.Mocked<WinstonLoggerService>;

  beforeEach(async () => {
    // Create mock logger
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          ttl: 60 * 1000, // 1 minute for tests
        }),
      ],
      providers: [
        CacheService,
        {
          provide: WinstonLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(async () => {
    // Clear cache after each test
    if (
      cacheManager &&
      'reset' in cacheManager &&
      typeof cacheManager.reset === 'function'
    ) {
      await (cacheManager as any).reset();
    }
  });

  describe('Blog Post Caching', () => {
    const mockPost = {
      id: 1,
      title: 'Test Post',
      content: 'Test Content',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should cache and retrieve a blog post', async () => {
      // Set cache
      await service.setBlogPost(1, mockPost);

      // Get from cache
      const cached = await service.getBlogPost(1);

      expect(cached).toEqual(mockPost);
    });

    it('should return undefined for non-existent blog post', async () => {
      const cached = await service.getBlogPost(999);
      expect(cached).toBeUndefined();
    });

    it('should delete blog post from cache', async () => {
      // Set cache
      await service.setBlogPost(1, mockPost);

      // Verify it's cached
      expect(await service.getBlogPost(1)).toEqual(mockPost);

      // Delete from cache
      await service.deleteBlogPost(1);

      // Verify it's gone
      expect(await service.getBlogPost(1)).toBeUndefined();
    });

    it('should cache blog posts list', async () => {
      const mockPosts = [mockPost, { ...mockPost, id: 2, title: 'Post 2' }];

      await service.setBlogPostsList(mockPosts);
      const cached = await service.getBlogPostsList();

      expect(cached).toEqual(mockPosts);
    });

    it('should delete blog posts list from cache', async () => {
      const mockPosts = [mockPost];

      await service.setBlogPostsList(mockPosts);
      expect(await service.getBlogPostsList()).toEqual(mockPosts);

      await service.deleteBlogPostsList();
      expect(await service.getBlogPostsList()).toBeUndefined();
    });
  });

  describe('Comments Caching', () => {
    const mockComments = {
      data: [
        {
          id: 1,
          content: 'Test comment',
          author: 'Test Author',
          blogPostId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };

    it('should cache and retrieve comments with pagination', async () => {
      await service.setComments(1, 1, 10, mockComments, 'most_recent');
      const cached = await service.getComments(1, 1, 10, 'most_recent');

      expect(cached).toEqual(mockComments);
    });

    it('should handle different pagination parameters as different cache keys', async () => {
      await service.setComments(1, 1, 10, mockComments, 'most_recent');
      await service.setComments(
        1,
        2,
        10,
        { ...mockComments, page: 2 },
        'most_recent',
      );

      const page1 = await service.getComments(1, 1, 10, 'most_recent');
      const page2 = await service.getComments(1, 2, 10, 'most_recent');

      expect(page1.page).toBe(1);
      expect(page2.page).toBe(2);
    });

    it('should handle different sort orders as different cache keys', async () => {
      const mockCommentsRecent = {
        ...mockComments,
        data: [{ ...mockComments.data[0], id: 1 }],
      };
      const mockCommentsOldest = {
        ...mockComments,
        data: [{ ...mockComments.data[0], id: 2 }],
      };

      await service.setComments(1, 1, 10, mockCommentsRecent, 'most_recent');
      await service.setComments(1, 1, 10, mockCommentsOldest, 'oldest_first');

      const recent = await service.getComments(1, 1, 10, 'most_recent');
      const oldest = await service.getComments(1, 1, 10, 'oldest_first');

      expect(recent.data[0].id).toBe(1);
      expect(oldest.data[0].id).toBe(2);
    });
  });

  describe('Replies Caching', () => {
    const mockReplies = {
      data: [
        {
          id: 2,
          content: 'Test reply',
          author: 'Reply Author',
          blogPostId: 1,
          parentId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    };

    it('should cache and retrieve replies', async () => {
      await service.setReplies(1, 1, 5, mockReplies);
      const cached = await service.getReplies(1, 1, 5);

      expect(cached).toEqual(mockReplies);
    });

    it('should delete replies for comment', async () => {
      await service.setReplies(1, 1, 5, mockReplies);
      expect(await service.getReplies(1, 1, 5)).toEqual(mockReplies);

      await service.deleteRepliesForComment(1);
      expect(await service.getReplies(1, 1, 5)).toBeUndefined();
    });
  });

  describe('Post with Comments Caching', () => {
    const mockPostWithComments = {
      post: {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      comments: {
        data: [
          {
            id: 1,
            content: 'Test comment',
            author: 'Test Author',
            blogPostId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      },
    };

    it('should cache and retrieve post with comments', async () => {
      await service.setPostWithComments(
        1,
        true,
        mockPostWithComments,
        10,
        1,
        'most_recent',
      );
      const cached = await service.getPostWithComments(
        1,
        true,
        10,
        1,
        'most_recent',
      );

      expect(cached).toEqual(mockPostWithComments);
    });

    it('should differentiate cache keys for different parameters', async () => {
      const withComments = mockPostWithComments;
      const withoutComments = {
        post: mockPostWithComments.post,
        comments: null,
      };

      await service.setPostWithComments(1, true, withComments);
      await service.setPostWithComments(1, false, withoutComments);

      const cached1 = await service.getPostWithComments(1, true);
      const cached2 = await service.getPostWithComments(1, false);

      expect(cached1.comments).toBeTruthy();
      expect(cached2.comments).toBeNull();
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate all post-related caches', async () => {
      const mockPost = { id: 1, title: 'Test' };
      const mockComments = { data: [], total: 0 };
      const mockPostWithComments = { post: mockPost, comments: mockComments };

      // Set all caches
      await service.setBlogPost(1, mockPost);
      await service.setBlogPostsList([mockPost]);
      await service.setPostWithComments(1, true, mockPostWithComments);
      await service.setComments(1, 1, 10, mockComments);

      // Verify they're cached
      expect(await service.getBlogPost(1)).toEqual(mockPost);
      expect(await service.getBlogPostsList()).toEqual([mockPost]);
      expect(await service.getPostWithComments(1, true)).toEqual(
        mockPostWithComments,
      );
      expect(await service.getComments(1, 1, 10)).toEqual(mockComments);

      // Invalidate post cache
      await service.invalidatePostCache(1);

      // Verify invalidation
      expect(await service.getBlogPost(1)).toBeUndefined();
      expect(await service.getBlogPostsList()).toBeUndefined();
      expect(await service.getPostWithComments(1, true)).toBeUndefined();
    });

    it('should invalidate comment-related caches', async () => {
      const mockComments = { data: [], total: 0 };
      const mockPostWithComments = { post: {}, comments: mockComments };
      const mockReplies = { data: [], total: 0 };

      // Set caches
      await service.setComments(1, 1, 10, mockComments);
      await service.setPostWithComments(1, true, mockPostWithComments);
      await service.setReplies(1, 1, 5, mockReplies);

      // Verify they're cached
      expect(await service.getComments(1, 1, 10)).toEqual(mockComments);
      expect(await service.getPostWithComments(1, true)).toEqual(
        mockPostWithComments,
      );
      expect(await service.getReplies(1, 1, 5)).toEqual(mockReplies);

      // Invalidate comment cache
      await service.invalidateCommentCache(1, 1);

      // Verify invalidation
      expect(await service.getPostWithComments(1, true)).toBeUndefined();
    });
  });

  describe('Generic Cache Operations', () => {
    it('should perform generic get/set/delete operations', async () => {
      const testData = { test: 'data', number: 42 };

      // Set
      await service.set('test:key', testData);

      // Get
      const retrieved = await service.get('test:key');
      expect(retrieved).toEqual(testData);

      // Delete
      await service.del('test:key');
      expect(await service.get('test:key')).toBeUndefined();
    });

    it('should handle TTL correctly', async () => {
      const testData = { test: 'data' };

      // Set with very short TTL
      await service.set('test:ttl', testData, 100); // 100ms

      // Should be available immediately
      expect(await service.get('test:ttl')).toEqual(testData);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(await service.get('test:ttl')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      // Mock cache error
      jest
        .spyOn(cacheManager, 'get')
        .mockRejectedValueOnce(new Error('Cache error'));

      // Should not throw but return undefined
      const result = await service.getBlogPost(1);
      expect(result).toBeUndefined();
    });

    it('should handle reset operation safely', async () => {
      // Should not throw even if reset is not available
      await expect(service.reset()).resolves.not.toThrow();
    });
  });
});
