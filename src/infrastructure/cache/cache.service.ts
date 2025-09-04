import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WinstonLoggerService } from '../logging/winston-logger.service';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: WinstonLoggerService,
  ) {}

  // Blog post caching
  async getBlogPost(id: number): Promise<any> {
    try {
      return await this.cacheManager.get(`blog_post:${id}`);
    } catch (error) {
      this.logger.debug(`Cache get error for blog_post:${id}`, 'CacheService');
      return undefined;
    }
  }

  async setBlogPost(id: number, post: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(`blog_post:${id}`, post, ttl || 30 * 60 * 1000); // 30 minutes
  }

  async deleteBlogPost(id: number): Promise<void> {
    await this.cacheManager.del(`blog_post:${id}`);
  }

  // Blog post list caching
  async getBlogPostsList(): Promise<any> {
    try {
      return await this.cacheManager.get('blog_posts:list');
    } catch (error) {
      this.logger.debug('Cache get error for blog_posts:list', 'CacheService');
      return undefined;
    }
  }

  async setBlogPostsList(posts: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(
      'blog_posts:list',
      posts,
      ttl || 10 * 60 * 1000,
    ); // 10 minutes
  }

  async deleteBlogPostsList(): Promise<void> {
    await this.cacheManager.del('blog_posts:list');
  }

  // Comments caching
  async getComments(
    postId: number,
    page: number,
    limit: number,
    sortOrder?: string,
  ): Promise<any> {
    try {
      const key = `comments:${postId}:${page}:${limit}:${sortOrder || 'default'}`;
      return await this.cacheManager.get(key);
    } catch (error) {
      this.logger.debug(
        `Cache get error for comments:${postId}`,
        'CacheService',
      );
      return undefined;
    }
  }

  async setComments(
    postId: number,
    page: number,
    limit: number,
    comments: any,
    sortOrder?: string,
    ttl?: number,
  ): Promise<void> {
    const key = `comments:${postId}:${page}:${limit}:${sortOrder || 'default'}`;
    await this.cacheManager.set(key, comments, ttl || 15 * 60 * 1000); // 15 minutes
  }

  async deleteCommentsForUser(userId: number): Promise<void> {
    // Clear common comment patterns for this user
    const commonPatterns = [
      `user:${userId}:comments:1:10:default`,
      `user:${userId}:comments:1:10:most_recent`,
      `user:${userId}:comments:1:10:oldest_first`,
      `user:${userId}:comments:2:10:default`,
      `user:${userId}:comments:2:10:most_recent`,
      `user:${userId}:comments:2:10:oldest_first`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
  }

  async deleteCommentsForPost(postId: number): Promise<void> {
    // Clear common comment patterns for this post
    const commonPatterns = [
      `comments:${postId}:1:10:default`,
      `comments:${postId}:1:10:most_recent`,
      `comments:${postId}:1:10:oldest_first`,
      `comments:${postId}:2:10:default`,
      `comments:${postId}:2:10:most_recent`,
      `comments:${postId}:2:10:oldest_first`,
      `comments:${postId}:1:5:default`,
      `comments:${postId}:1:5:most_recent`,
      `comments:${postId}:1:5:oldest_first`,
      `comments:${postId}:2:5:default`,
      `comments:${postId}:2:5:most_recent`,
      `comments:${postId}:2:5:oldest_first`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
  }

  // Replies caching
  async getReplies(
    commentId: number,
    page: number,
    limit: number,
    sortOrder?: string,
  ): Promise<any> {
    try {
      const key = `replies:${commentId}:${page}:${limit}:${sortOrder || 'default'}`;
      return await this.cacheManager.get(key);
    } catch (error) {
      this.logger.debug(
        `Cache get error for replies:${commentId}`,
        'CacheService',
      );
      return undefined;
    }
  }

  async setReplies(
    commentId: number,
    page: number,
    limit: number,
    replies: any,
    sortOrder?: string,
    ttl?: number,
  ): Promise<void> {
    const key = `replies:${commentId}:${page}:${limit}:${sortOrder || 'default'}`;
    await this.cacheManager.set(key, replies, ttl || 15 * 60 * 1000); // 15 minutes
  }

  async deleteRepliesForComment(commentId: number): Promise<void> {
    // Try to clear common reply cache patterns for this comment
    const commonPatterns = [
      `replies:${commentId}:1:5:default`,
      `replies:${commentId}:1:5:most_recent`,
      `replies:${commentId}:1:5:oldest_first`,
      `replies:${commentId}:2:5:default`,
      `replies:${commentId}:2:5:most_recent`,
      `replies:${commentId}:2:5:oldest_first`,
      `replies:${commentId}:1:10:default`,
      `replies:${commentId}:1:10:most_recent`,
      `replies:${commentId}:1:10:oldest_first`,
      `replies:${commentId}:2:10:default`,
      `replies:${commentId}:2:10:most_recent`,
      `replies:${commentId}:2:10:oldest_first`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
  }

  // Post with comments caching
  async getPostWithComments(
    postId: number,
    includeComments: boolean,
    commentsLimit?: number,
    commentsPage?: number,
    commentsSortOrder?: string,
  ): Promise<any> {
    try {
      const key = `post_with_comments:${postId}:${includeComments}:${commentsLimit || 0}:${commentsPage || 0}:${commentsSortOrder || 'default'}`;
      return await this.cacheManager.get(key);
    } catch (error) {
      this.logger.debug(
        `Cache get error for post with comments: ${postId}`,
        'CacheService',
      );
      return undefined;
    }
  }

  async setPostWithComments(
    postId: number,
    includeComments: boolean,
    data: any,
    commentsLimit?: number,
    commentsPage?: number,
    commentsSortOrder?: string,
    ttl?: number,
  ): Promise<void> {
    const key = `post_with_comments:${postId}:${includeComments}:${commentsLimit || 0}:${commentsPage || 0}:${commentsSortOrder || 'default'}`;
    await this.cacheManager.set(key, data, ttl || 20 * 60 * 1000); // 20 minutes
  }

  async deletePostWithComments(postId: number): Promise<void> {
    // Delete all variations of this cache key
    const commonPatterns = [
      `post_with_comments:${postId}:true:0:0:default`,
      `post_with_comments:${postId}:false:0:0:default`,
      `post_with_comments:${postId}:true:10:1:default`,
      `post_with_comments:${postId}:false:10:1:default`,
      `post_with_comments:${postId}:true:10:1:most_recent`,
      `post_with_comments:${postId}:false:10:1:most_recent`,
      `post_with_comments:${postId}:true:10:1:oldest_first`,
      `post_with_comments:${postId}:false:10:1:oldest_first`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }
  }

  // Cache invalidation helpers
  async invalidatePostCache(postId: number): Promise<void> {
    this.logger.debug(
      `Invalidating post cache for post ${postId}`,
      'CacheService',
    );
    await Promise.all([
      this.deleteBlogPost(postId),
      this.deleteBlogPostsList(),
      this.deletePostWithComments(postId),
      this.deleteCommentsForPost(postId),
    ]);
  }

  async invalidateCommentCache(
    postId: number,
    commentId?: number,
  ): Promise<void> {
    this.logger.debug(
      `Invalidating comment cache for post ${postId}, comment ${commentId}`,
      'CacheService',
    );
    await Promise.all([
      this.deleteCommentsForPost(postId),
      this.deletePostWithComments(postId),
      commentId ? this.deleteRepliesForComment(commentId) : Promise.resolve(),
    ]);
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.debug(`Cache get error for key: ${key}`, 'CacheService');
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Note: reset() might not be available in all cache implementations
    // This is mainly for testing purposes
    if (
      'reset' in this.cacheManager &&
      typeof this.cacheManager.reset === 'function'
    ) {
      await (this.cacheManager as any).reset();
    }
  }
}
