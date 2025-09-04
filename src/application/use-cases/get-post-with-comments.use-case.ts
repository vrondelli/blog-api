import { Injectable, NotFoundException } from '@nestjs/common';
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
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
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
    const cachedResult = await this.cacheService.getPostWithComments(
      query.postId,
      query.includeComments,
      query.commentsLimit,
      query.commentsPage,
      query.commentsSortOrder,
    );

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
    let post = await this.cacheService.getBlogPost(query.postId);
    if (!post) {
      post = await this.blogPostRepository.findById(query.postId);
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
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    } | null = null;
    if (query.includeComments) {
      const commentOptions: CommentQueryOptions = {
        page: query.commentsPage || 1,
        limit: query.commentsLimit || 10,
        sortOrder: query.commentsSortOrder,
      };

      // Try to get comments from cache
      comments = await this.cacheService.getComments(
        query.postId,
        commentOptions.page,
        commentOptions.limit,
        commentOptions.sortOrder,
      );

      if (!comments) {
        comments = await this.commentRepository.findByBlogPostId(
          query.postId,
          commentOptions,
        );

        if (comments) {
          await this.cacheService.setComments(
            query.postId,
            commentOptions.page,
            commentOptions.limit,
            comments,
            commentOptions.sortOrder,
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
      query.commentsPage,
      query.commentsSortOrder,
    );

    return result;
  }
}
