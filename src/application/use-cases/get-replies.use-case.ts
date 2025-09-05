import { Injectable } from '@nestjs/common';
import {
  CommentRepository,
  PaginatedResult,
} from '../../domain/repositories/comment.repository';
import { GetRepliesQuery } from '../dtos/get-comments.dto';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';

@Injectable()
export class GetRepliesUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async execute(
    query: GetRepliesQuery,
  ): Promise<PaginatedResult<CommentEntity>> {
    // For cursor-based pagination, we'll use a simpler cache strategy
    // Only cache the first page (no cursor) since cursor pagination is dynamic
    const useCache = !query.cursor;

    // Try to get from cache first (only for first page without cursor)
    let cachedReplies: Awaited<
      ReturnType<typeof this.commentRepository.findRepliesByParentId>
    > | null = null;
    if (useCache) {
      cachedReplies =
        (await this.cacheService.getReplies(
          query.parentId,
          query.limit,
          query.sortOrder,
          query.depth,
        )) || null;
    }

    if (cachedReplies) {
      this.logger.debug('Returning replies from cache', 'GetRepliesUseCase');
      return cachedReplies;
    }

    this.logger.debug('Fetching replies from database', 'GetRepliesUseCase');

    const result = await this.commentRepository.findRepliesByParentId(
      query.parentId,
      {
        limit: query.limit,
        sortOrder: query.sortOrder,
        depth: query.depth,
        cursor: query.cursor,
      },
    );

    // Cache the result (only for first page without cursor)
    if (useCache) {
      await this.cacheService.setReplies(
        query.parentId,
        query.limit,
        result,
        query.sortOrder,
        query.depth,
      );
    }

    return result;
  }
}
