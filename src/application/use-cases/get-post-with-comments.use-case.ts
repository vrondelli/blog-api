import { Injectable } from '@nestjs/common';
import { BlogPostRepository } from '../../domain/repositories/blog-post.repository';
import {
  CommentRepository,
  CommentQueryOptions,
} from '../../domain/repositories/comment.repository';
import { GetPostWithCommentsQuery } from '../dtos/get-post-with-comments.dto';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';
import { BlogPostNotFoundException } from '../../infrastructure/exceptions/custom.exceptions';

export interface PostWithCommentsResult {
  post: BlogPost;
  comments: {
    data: CommentEntity[];
    total: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string | null;
  } | null;
}

@Injectable()
export class GetPostWithCommentsUseCase {
  constructor(
    private readonly blogPostRepository: BlogPostRepository,
    private readonly commentRepository: CommentRepository,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async execute(
    query: GetPostWithCommentsQuery,
  ): Promise<PostWithCommentsResult> {
    // Try to get the complete result from cache first
    const cachedResult: PostWithCommentsResult | null =
      (await this.cacheService.getPostWithComments(
        query.postId,
        query.includeComments,
        query.commentsLimit,
        query.commentsCursor,
        query.commentsSortOrder,
      )) || null;

    if (cachedResult) {
      this.logger.debug(
        'Returning post with comments from cache',
        'GetPostWithCommentsUseCase',
      );
      return cachedResult;
    }

    this.logger.debug(
      'Fetching post with comments from database',
      'GetPostWithCommentsUseCase',
    );

    // Get the post (try cache first for individual post)
    let post: BlogPost | null =
      (await this.cacheService.getBlogPost(query.postId)) || null;
    if (!post) {
      post = (await this.blogPostRepository.findById(query.postId)) || null;
      if (post) {
        await this.cacheService.setBlogPost(query.postId, post);
      }
    }

    if (!post) {
      throw new BlogPostNotFoundException(query.postId);
    }

    // Business logic: decide whether to load comments
    let comments: {
      data: CommentEntity[];
      total: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string | null;
    } | null = null;
    if (query.includeComments) {
      const commentOptions: CommentQueryOptions = {
        limit: query.commentsLimit || 10,
        sortOrder: query.commentsSortOrder,
        cursor: query.commentsCursor,
        depth: query.commentsDepth ?? 2, // default depth
      };

      // Try to get comments from cache (only for first page/no cursor)
      if (!commentOptions.cursor) {
        comments =
          (await this.cacheService.getComments(
            query.postId,
            commentOptions.limit,
            commentOptions.sortOrder,
            commentOptions.depth,
          )) || null;
      }

      if (!comments) {
        comments = await this.commentRepository.findByBlogPostId(
          query.postId,
          commentOptions,
        );

        if (comments && !commentOptions.cursor) {
          await this.cacheService.setComments(
            query.postId,
            commentOptions.limit,
            comments,
            commentOptions.sortOrder,
            commentOptions.depth,
          );
        }
      }
    }

    const result = {
      post,
      comments,
    };

    // Cache the complete result
    await this.cacheService.setPostWithComments(
      query.postId,
      query.includeComments,
      result,
      query.commentsLimit,
      query.commentsCursor,
      query.commentsSortOrder,
    );

    return result;
  }
}
