import { Comment } from '../entities/comment.entity';

export interface PaginationOptions {
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string | null; // For cursor-based pagination (opaque string)
}

export enum CommentSortOrder {
  MOST_RECENT = 'most_recent',
  OLDEST_FIRST = 'oldest_first',
  MOST_LIKED = 'most_liked',
}

export interface CommentQueryOptions extends PaginationOptions {
  sortOrder?: CommentSortOrder;
  cursor?: string;
  depth?: number;
}

export abstract class CommentRepository {
  abstract findAll(): Promise<Comment[]>;
  abstract findById(id: number): Promise<Comment | null>;
  abstract findByBlogPostId(
    blogPostId: number,
    options?: CommentQueryOptions & { depth?: number; cursor?: string },
  ): Promise<PaginatedResult<Comment>>;
  abstract findRepliesByParentId(
    parentId: number,
    options?: CommentQueryOptions & { depth?: number; cursor?: string },
  ): Promise<PaginatedResult<Comment>>;
  abstract create(
    content: string,
    author: string,
    blogPostId: number,
    parentId?: number,
  ): Promise<Comment>;
  abstract update(
    id: number,
    content?: string,
    author?: string,
  ): Promise<Comment | null>;
  abstract delete(id: number): Promise<boolean>;
  abstract getCommentsCountByBlogPostId(blogPostId: number): Promise<number>;
  abstract getRepliesCountByParentId(parentId: number): Promise<number>;
}
