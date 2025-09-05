import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WinstonLoggerService } from '../logging/winston-logger.service';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { Comment } from '../../domain/entities/comment.entity';

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: WinstonLoggerService,
  ) {}

  // Blog post caching
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      return await this.cacheManager.get(`blog_post:${id}`);
    } catch {
      this.logger.debug(`Cache get error for blog_post:${id}`, 'CacheService');
      return undefined;
    }
  }

  async setBlogPost(id: number, post: BlogPost, ttl?: number): Promise<void> {
    await this.cacheManager.set(`blog_post:${id}`, post, ttl || 30 * 60 * 1000); // 30 minutes
  }

  async deleteBlogPost(id: number): Promise<void> {
    await this.cacheManager.del(`blog_post:${id}`);
  }

  // Blog post list caching
  async getBlogPostsList(): Promise<BlogPost[] | undefined> {
    try {
      return await this.cacheManager.get('blog_posts:list');
    } catch {
      this.logger.debug('Cache get error for blog_posts:list', 'CacheService');
      return undefined;
    }
  }

  async setBlogPostsList(posts: BlogPost[], ttl?: number): Promise<void> {
    await this.cacheManager.set(
      'blog_posts:list',
      posts,
      ttl || 10 * 60 * 1000,
    ); // 10 minutes
  }

  async deleteBlogPostsList(): Promise<void> {
    await this.cacheManager.del('blog_posts:list');
  }

  // Comments caching (simplified for cursor pagination)
  async getComments(
    postId: number,
    limit: number,
    sortOrder?: string,
    depth?: number,
  ): Promise<
    | {
        data: Comment[];
        total: number;
        limit: number;
        hasNext: boolean;
        hasPrev: boolean;
        nextCursor?: string | null;
      }
    | undefined
  > {
    try {
      // Only cache first page (no cursor)
      const key = `comments:${postId}:first:${limit}:${sortOrder || 'default'}:${depth ?? 2}`;
      return await this.cacheManager.get(key);
    } catch {
      this.logger.debug(
        `Cache get error for comments:${postId}`,
        'CacheService',
      );
      return undefined;
    }
  }

  async setComments(
    postId: number,
    limit: number,
    comments: {
      data: Comment[];
      total: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string | null;
    },
    sortOrder?: string,
    depth?: number,
    ttl?: number,
  ): Promise<void> {
    // Only cache first page (no cursor)
    const key = `comments:${postId}:first:${limit}:${sortOrder || 'default'}:${depth ?? 2}`;
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
      } catch {
        // Ignore errors for non-existent keys
      }
    }
  }

  async deleteCommentsForPost(postId: number): Promise<void> {
    // Clear common comment patterns for this post
    const commonPatterns = [
      `comments:${postId}:first:10:default:2`,
      `comments:${postId}:first:10:most_recent:2`,
      `comments:${postId}:first:10:oldest_first:2`,
      `comments:${postId}:first:5:default:2`,
      `comments:${postId}:first:5:most_recent:2`,
      `comments:${postId}:first:5:oldest_first:2`,
      `comments:${postId}:first:10:default:0`,
      `comments:${postId}:first:10:most_recent:0`,
      `comments:${postId}:first:10:oldest_first:0`,
      `comments:${postId}:first:5:default:0`,
      `comments:${postId}:first:5:most_recent:0`,
      `comments:${postId}:first:5:oldest_first:0`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch {
        // Ignore errors for non-existent keys
      }
    }
  }

  // Replies caching (simplified for cursor pagination)
  async getReplies(
    commentId: number,
    limit: number,
    sortOrder?: string,
    depth?: number,
  ): Promise<any> {
    try {
      // Only cache first page (no cursor)
      const key = `replies:${commentId}:first:${limit}:${sortOrder || 'default'}:${depth || 2}`;
      return await this.cacheManager.get(key);
    } catch {
      this.logger.debug(
        `Cache get error for replies:${commentId}`,
        'CacheService',
      );
      return undefined;
    }
  }

  async setReplies(
    commentId: number,
    limit: number,
    replies: any,
    sortOrder?: string,
    depth?: number,
    ttl?: number,
  ): Promise<void> {
    // Only cache first page (no cursor)
    const key = `replies:${commentId}:first:${limit}:${sortOrder || 'default'}:${depth || 2}`;
    await this.cacheManager.set(key, replies, ttl || 15 * 60 * 1000); // 15 minutes
  }

  async deleteRepliesForComment(commentId: number): Promise<void> {
    // Try to clear common reply cache patterns for this comment
    const commonPatterns = [
      `replies:${commentId}:first:5:default:2`,
      `replies:${commentId}:first:5:most_recent:2`,
      `replies:${commentId}:first:5:oldest_first:2`,
      `replies:${commentId}:first:10:default:2`,
      `replies:${commentId}:first:10:most_recent:2`,
      `replies:${commentId}:first:10:oldest_first:2`,
      `replies:${commentId}:first:5:default:0`,
      `replies:${commentId}:first:5:most_recent:0`,
      `replies:${commentId}:first:5:oldest_first:0`,
      `replies:${commentId}:first:10:default:0`,
      `replies:${commentId}:first:10:most_recent:0`,
      `replies:${commentId}:first:10:oldest_first:0`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch {
        // Ignore errors for non-existent keys
      }
    }
  }

  // Post with comments caching
  async getPostWithComments(
    postId: number,
    includeComments: boolean,
    commentsLimit?: number,
    commentsCursor?: string,
    commentsSortOrder?: string,
  ): Promise<any> {
    try {
      const key = `post_with_comments:${postId}:${includeComments}:${commentsLimit || 0}:${commentsCursor || 'none'}:${commentsSortOrder || 'default'}`;
      return await this.cacheManager.get(key);
    } catch {
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
    commentsCursor?: string,
    commentsSortOrder?: string,
    ttl?: number,
  ): Promise<void> {
    const key = `post_with_comments:${postId}:${includeComments}:${commentsLimit || 0}:${commentsCursor || 'none'}:${commentsSortOrder || 'default'}`;
    await this.cacheManager.set(key, data, ttl || 20 * 60 * 1000); // 20 minutes
  }

  async deletePostWithComments(postId: number): Promise<void> {
    // Delete all variations of this cache key
    const commonPatterns = [
      `post_with_comments:${postId}:true:0:none:default`,
      `post_with_comments:${postId}:false:0:none:default`,
      `post_with_comments:${postId}:true:10:none:default`,
      `post_with_comments:${postId}:false:10:none:default`,
      `post_with_comments:${postId}:true:10:none:most_recent`,
      `post_with_comments:${postId}:false:10:none:most_recent`,
      `post_with_comments:${postId}:true:10:none:oldest_first`,
      `post_with_comments:${postId}:false:10:none:oldest_first`,
    ];

    for (const pattern of commonPatterns) {
      try {
        await this.cacheManager.del(pattern);
      } catch {
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
    } catch {
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
      await (this.cacheManager as { reset(): Promise<void> }).reset();
    }
  }
}
