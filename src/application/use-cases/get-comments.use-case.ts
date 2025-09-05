import { Injectable } from '@nestjs/common';
import {
  CommentRepository,
  PaginatedResult,
} from '../../domain/repositories/comment.repository';
import { GetCommentsQuery } from '../dtos/get-comments.dto';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';

@Injectable()
export class GetCommentsUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async execute(
    query: GetCommentsQuery,
  ): Promise<PaginatedResult<CommentEntity>> {
    // For cursor-based pagination, we'll use a simpler cache strategy
    // Only cache the first page (no cursor) since cursor pagination is dynamic
    const useCache = !query.cursor;

    // Try to get from cache first (only for first page without cursor)
    let cachedComments: {
      data: CommentEntity[];
      total: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string | null;
    } | null = null;
    if (useCache) {
      cachedComments =
        (await this.cacheService.getComments(
          query.blogPostId,
          query.limit,
          query.sortOrder,
          query.depth,
        )) || null;
    }

    if (cachedComments) {
      this.logger.debug('Returning comments from cache', 'GetCommentsUseCase');
      return cachedComments;
    }

    this.logger.debug('Fetching comments from database', 'GetCommentsUseCase');

    const result = await this.commentRepository.findByBlogPostId(
      query.blogPostId,
      {
        limit: query.limit,
        sortOrder: query.sortOrder,
        depth: query.depth,
        cursor: query.cursor,
      },
    );

    // Cache the result (only for first page without cursor)
    if (useCache) {
      await this.cacheService.setComments(
        query.blogPostId,
        query.limit,
        result,
        query.sortOrder,
        query.depth,
      );
    }

    return result;
  }
}
