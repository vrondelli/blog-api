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
    // Try to get from cache first
    const cachedReplies = await this.cacheService.getReplies(
      query.parentId,
      query.page,
      query.limit,
      query.sortOrder,
    );

    if (cachedReplies) {
      this.logger.debug('Returning replies from cache', 'GetRepliesUseCase');
      return cachedReplies;
    }

    this.logger.debug('Fetching replies from database', 'GetRepliesUseCase');

    const result = await this.commentRepository.findRepliesByParentId(
      query.parentId,
      {
        page: query.page,
        limit: query.limit,
        sortOrder: query.sortOrder,
      },
    );

    // Cache the result
    await this.cacheService.setReplies(
      query.parentId,
      query.page,
      query.limit,
      result,
      query.sortOrder,
    );

    return result;
  }
}
