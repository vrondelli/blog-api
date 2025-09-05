import { Injectable } from '@nestjs/common';
import {
  CommentRepository,
  CommentQueryOptions,
  PaginatedResult,
  CommentSortOrder,
} from '../../domain/repositories/comment.repository';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { DatabaseService } from '../database/database.service';
import { CursorService, CursorData } from '../pagination/cursor.service';

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cursorService: CursorService,
  ) {}

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
    options?: CommentQueryOptions & { depth?: number; cursor?: string },
  ): Promise<PaginatedResult<CommentEntity>> {
    const limit = options?.limit || 10;
    const depth = options?.depth ?? 2;
    const cursor = options?.cursor;
    const orderBy = this.getOrderByClause(options?.sortOrder);

    // Decode cursor if provided
    let cursorData: CursorData | null = null;
    if (cursor) {
      cursorData = this.cursorService.decodeCursor(cursor);
      // If cursor is invalid, treat it as no cursor (graceful degradation)
      if (!cursorData) {
        cursorData = null;
      }
    }

    // Build cursor condition for seek pagination
    let cursorCondition = {};
    if (cursorData) {
      if (orderBy.createdAt === 'desc') {
        // For DESC order: (createdAt < cursor.createdAt) OR (createdAt = cursor.createdAt AND id < cursor.id)
        cursorCondition = {
          OR: [
            { createdAt: { lt: cursorData.createdAt } },
            {
              AND: [
                { createdAt: { equals: cursorData.createdAt } },
                { id: { lt: cursorData.id } },
              ],
            },
          ],
        };
      } else {
        // For ASC order: (createdAt > cursor.createdAt) OR (createdAt = cursor.createdAt AND id > cursor.id)
        cursorCondition = {
          OR: [
            { createdAt: { gt: cursorData.createdAt } },
            {
              AND: [
                { createdAt: { equals: cursorData.createdAt } },
                { id: { gt: cursorData.id } },
              ],
            },
          ],
        };
      }
    }

    // Fetch top-level comments with cursor pagination
    const topLevelComments = await this.databaseService.comment.findMany({
      where: {
        blogPostId,
        parentId: null,
        ...cursorCondition,
      },
      orderBy: [{ createdAt: orderBy.createdAt }, { id: orderBy.createdAt }],
      take: limit + 1, // Fetch one extra to check if there are more
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    // Check if there are more items for pagination
    const hasMore = topLevelComments.length > limit;
    const items = hasMore ? topLevelComments.slice(0, limit) : topLevelComments;

    // Generate next cursor from the last item
    const nextCursor =
      hasMore && items.length > 0
        ? this.cursorService.encodeCursor({
            createdAt: items[items.length - 1].createdAt,
            id: items[items.length - 1].id,
          })
        : null;

    const hasPrev = !!cursorData;

    // Load nested replies for each top-level comment
    const commentEntities = await Promise.all(
      items.map(async (comment) => {
        const replies =
          depth > 0
            ? await this.loadRepliesRecursively(comment.id, depth - 1, options)
            : undefined;

        return new CommentEntity(
          comment.id,
          comment.content,
          comment.author,
          comment.createdAt,
          comment.updatedAt,
          comment.blogPostId,
          comment.parentId || undefined,
          replies,
          comment._count.replies,
        );
      }),
    );

    // Get total count for pagination info
    const total = await this.databaseService.comment.count({
      where: {
        blogPostId,
        parentId: null,
      },
    });

    return {
      data: commentEntities,
      total,
      limit,
      hasNext: hasMore,
      hasPrev,
      nextCursor,
    };
  }

  async findRepliesByParentId(
    parentId: number,
    options?: CommentQueryOptions & { depth?: number; cursor?: string },
  ): Promise<PaginatedResult<CommentEntity>> {
    const limit = options?.limit || 5;
    const depth = Math.max(0, options?.depth ?? 2);
    const cursorString = options?.cursor;
    const orderBy = this.getOrderByClause(options?.sortOrder);

    // Decode cursor if provided
    let cursorData: CursorData | null = null;
    if (cursorString) {
      cursorData = this.cursorService.decodeCursor(cursorString);
      // If cursor is invalid, treat it as no cursor (graceful degradation)
      if (!cursorData) {
        cursorData = null;
      }
    }

    // Build cursor condition for seek pagination
    let cursorCondition = {};
    if (cursorData) {
      if (orderBy.createdAt === 'desc') {
        cursorCondition = {
          OR: [
            { createdAt: { lt: cursorData.createdAt } },
            {
              AND: [
                { createdAt: { equals: cursorData.createdAt } },
                { id: { lt: cursorData.id } },
              ],
            },
          ],
        };
      } else {
        cursorCondition = {
          OR: [
            { createdAt: { gt: cursorData.createdAt } },
            {
              AND: [
                { createdAt: { equals: cursorData.createdAt } },
                { id: { gt: cursorData.id } },
              ],
            },
          ],
        };
      }
    }

    // Get direct replies with cursor pagination
    const directReplies = await this.databaseService.comment.findMany({
      where: {
        parentId,
        ...cursorCondition,
      },
      orderBy: [{ createdAt: orderBy.createdAt }, { id: orderBy.createdAt }],
      take: limit + 1, // Take one extra to check if there are more
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    // Check if there are more items for pagination
    const hasMore = directReplies.length > limit;
    const items = hasMore ? directReplies.slice(0, limit) : directReplies;

    // Generate next cursor from the last item
    const nextCursor =
      hasMore && items.length > 0
        ? this.cursorService.encodeCursor({
            createdAt: items[items.length - 1].createdAt,
            id: items[items.length - 1].id,
          })
        : null;

    const hasPrev = !!cursorData;

    // Load nested replies for each comment using iterative approach
    const commentEntities = await Promise.all(
      items.map(async (comment) => {
        const replies =
          depth > 0
            ? await this.loadRepliesRecursively(comment.id, depth - 1, options)
            : undefined;

        return new CommentEntity(
          comment.id,
          comment.content,
          comment.author,
          comment.createdAt,
          comment.updatedAt,
          comment.blogPostId,
          comment.parentId || undefined,
          replies,
          comment._count.replies,
        );
      }),
    );

    // Get total count for pagination info
    const total = await this.databaseService.comment.count({
      where: { parentId },
    });

    return {
      data: commentEntities,
      total,
      limit,
      hasNext: hasMore,
      hasPrev,
      nextCursor,
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
    } catch {
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.databaseService.comment.delete({
        where: { id },
      });
      return true;
    } catch {
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

  private async loadRepliesRecursively(
    parentId: number,
    depth: number,
    options?: CommentQueryOptions,
  ): Promise<CommentEntity[] | undefined> {
    if (depth < 0) return undefined;

    const orderBy = this.getOrderByClause(options?.sortOrder);

    const replies = await this.databaseService.comment.findMany({
      where: { parentId },
      orderBy: [orderBy, { id: orderBy.createdAt }],
      take: 10, // Reasonable limit for nested replies
      include: {
        _count: {
          select: { replies: true },
        },
      },
    });

    if (replies.length === 0) return undefined;

    return Promise.all(
      replies.map(async (reply) => {
        const nestedReplies =
          depth > 0
            ? await this.loadRepliesRecursively(reply.id, depth - 1, options)
            : undefined;

        return new CommentEntity(
          reply.id,
          reply.content,
          reply.author,
          reply.createdAt,
          reply.updatedAt,
          reply.blogPostId,
          reply.parentId || undefined,
          nestedReplies,
          reply._count.replies,
        );
      }),
    );
  }
}
