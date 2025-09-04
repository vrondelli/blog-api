import { Injectable } from '@nestjs/common';
import {
  CommentRepository,
  CommentQueryOptions,
  PaginatedResult,
  CommentSortOrder,
} from '../../domain/repositories/comment.repository';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private getOrderByClause(sortOrder?: CommentSortOrder) {
    switch (sortOrder) {
      case CommentSortOrder.MOST_RECENT:
        return { createdAt: 'desc' as const };
      case CommentSortOrder.OLDEST_FIRST:
        return { createdAt: 'asc' as const };
      case CommentSortOrder.MOST_LIKED:
        // For future implementation with likes
        return { createdAt: 'desc' as const }; // Fallback to recent for now
      default:
        return { createdAt: 'asc' as const };
    }
  }

  async findAll(): Promise<CommentEntity[]> {
    const comments = await this.databaseService.comment.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    return comments.map(
      (comment) =>
        new CommentEntity(
          comment.id,
          comment.content,
          comment.author,
          comment.createdAt,
          comment.updatedAt,
          comment.blogPostId,
          comment.parentId || undefined,
          undefined, // replies not loaded in findAll
          comment._count.replies,
        ),
    );
  }

  async findById(id: number): Promise<CommentEntity | null> {
    const comment = await this.databaseService.comment.findUnique({
      where: { id },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!comment) {
      return null;
    }

    return new CommentEntity(
      comment.id,
      comment.content,
      comment.author,
      comment.createdAt,
      comment.updatedAt,
      comment.blogPostId,
      comment.parentId || undefined,
      undefined, // replies not loaded by default
      comment._count.replies,
    );
  }

  async findByBlogPostId(
    blogPostId: number,
    options?: CommentQueryOptions,
  ): Promise<PaginatedResult<CommentEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const orderBy = this.getOrderByClause(options?.sortOrder);

    // Only get top-level comments (parentId is null)
    const [comments, total] = await Promise.all([
      this.databaseService.comment.findMany({
        where: {
          blogPostId,
          parentId: null, // Only top-level comments
        },
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { replies: true },
          },
        },
      }),
      this.databaseService.comment.count({
        where: {
          blogPostId,
          parentId: null,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: comments.map(
        (comment) =>
          new CommentEntity(
            comment.id,
            comment.content,
            comment.author,
            comment.createdAt,
            comment.updatedAt,
            comment.blogPostId,
            comment.parentId || undefined,
            undefined, // replies loaded separately
            comment._count.replies,
          ),
      ),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findRepliesByParentId(
    parentId: number,
    options?: CommentQueryOptions,
  ): Promise<PaginatedResult<CommentEntity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 5;
    const skip = (page - 1) * limit;
    const orderBy = this.getOrderByClause(options?.sortOrder);

    const [replies, total] = await Promise.all([
      this.databaseService.comment.findMany({
        where: { parentId },
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: { replies: true },
          },
        },
      }),
      this.databaseService.comment.count({
        where: { parentId },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: replies.map(
        (reply) =>
          new CommentEntity(
            reply.id,
            reply.content,
            reply.author,
            reply.createdAt,
            reply.updatedAt,
            reply.blogPostId,
            reply.parentId || undefined,
            undefined,
            reply._count.replies,
          ),
      ),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async create(
    content: string,
    author: string,
    blogPostId: number,
    parentId?: number,
  ): Promise<CommentEntity> {
    const comment = await this.databaseService.comment.create({
      data: {
        content,
        author,
        blogPostId,
        parentId,
      },
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    return new CommentEntity(
      comment.id,
      comment.content,
      comment.author,
      comment.createdAt,
      comment.updatedAt,
      comment.blogPostId,
      comment.parentId || undefined,
      undefined,
      comment._count.replies,
    );
  }

  async update(
    id: number,
    content?: string,
    author?: string,
  ): Promise<CommentEntity | null> {
    try {
      const comment = await this.databaseService.comment.update({
        where: { id },
        data: {
          ...(content && { content }),
          ...(author && { author }),
        },
        include: {
          _count: {
            select: { replies: true },
          },
        },
      });

      return new CommentEntity(
        comment.id,
        comment.content,
        comment.author,
        comment.createdAt,
        comment.updatedAt,
        comment.blogPostId,
        comment.parentId || undefined,
        undefined,
        comment._count.replies,
      );
    } catch (error) {
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.databaseService.comment.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCommentsCountByBlogPostId(blogPostId: number): Promise<number> {
    return this.databaseService.comment.count({
      where: {
        blogPostId,
        parentId: null, // Only count top-level comments
      },
    });
  }

  async getRepliesCountByParentId(parentId: number): Promise<number> {
    return this.databaseService.comment.count({
      where: { parentId },
    });
  }
}
