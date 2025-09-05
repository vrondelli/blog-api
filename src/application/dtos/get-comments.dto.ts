import { CommentSortOrder } from '../../domain/repositories/comment.repository';

export class GetCommentsQuery {
  constructor(
    public readonly blogPostId: number,
    public readonly limit: number = 10,
    public readonly sortOrder?: CommentSortOrder,
    public readonly depth?: number,
    public readonly cursor?: string,
  ) {}
}

export class GetRepliesQuery {
  constructor(
    public readonly parentId: number,
    public readonly limit: number = 5,
    public readonly sortOrder?: CommentSortOrder,
    public readonly depth?: number,
    public readonly cursor?: string,
  ) {}
}
