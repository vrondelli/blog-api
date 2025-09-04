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
    // Try to get from cache first
    const cachedComments = await this.cacheService.getComments(
      query.blogPostId,
      query.page,
      query.limit,
      query.sortOrder,
    );

    if (cachedComments) {
      this.logger.debug('Returning comments from cache', 'GetCommentsUseCase');
      return cachedComments;
    }

    this.logger.debug('Fetching comments from database', 'GetCommentsUseCase');

    const result = await this.commentRepository.findByBlogPostId(
      query.blogPostId,
      {
        page: query.page,
        limit: query.limit,
        sortOrder: query.sortOrder,
      },
    );

    // Cache the result
    await this.cacheService.setComments(
      query.blogPostId,
      query.page,
      query.limit,
      result,
      query.sortOrder,
    );

    return result;
  }
}
