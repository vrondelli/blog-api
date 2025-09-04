import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { BlogPostRepository } from '../../domain/repositories/blog-post.repository';
import { Comment } from '../../domain/entities/comment.entity';
import { CreateCommentCommand } from '../dtos/create-comment.dto';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';
import {
  BlogPostNotFoundException,
  InvalidCommentParentException,
} from '../../infrastructure/exceptions/custom.exceptions';

@Injectable()
export class CreateCommentUseCase {
  constructor(
    private readonly commentRepository: CommentRepository,
    private readonly blogPostRepository: BlogPostRepository,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async execute(command: CreateCommentCommand): Promise<Comment> {
    // Verify blog post exists
    const blogPost = await this.blogPostRepository.findById(command.blogPostId);
    if (!blogPost) {
      throw new BlogPostNotFoundException(command.blogPostId);
    }

    // If this is a reply, verify parent comment exists and belongs to the same post
    if (command.parentId) {
      const parentComment = await this.commentRepository.findById(
        command.parentId,
      );
      if (!parentComment) {
        throw new InvalidCommentParentException(command.parentId);
      }

      // Ensure parent comment belongs to the same blog post
      if (parentComment.blogPostId !== command.blogPostId) {
        throw new InvalidCommentParentException(command.parentId);
      }
    }

    const newComment = await this.commentRepository.create(
      command.content,
      command.author,
      command.blogPostId,
      command.parentId,
    );

    // Invalidate related caches
    if (command.parentId) {
      // This is a reply - invalidate both comment and reply caches
      await this.cacheService.invalidateCommentCache(
        command.blogPostId,
        command.parentId,
      );
    } else {
      // This is a top-level comment - invalidate comment caches
      await this.cacheService.invalidateCommentCache(command.blogPostId);
    }

    this.logger.debug(
      'Cache invalidated after creating new comment',
      'CreateCommentUseCase',
    );

    return newComment;
  }
}
