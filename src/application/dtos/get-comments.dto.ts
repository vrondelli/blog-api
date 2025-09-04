import { CommentSortOrder } from '../../domain/repositories/comment.repository';

export class GetCommentsQuery {
  constructor(
    public readonly blogPostId: number,
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly sortOrder?: CommentSortOrder,
  ) {}
}

export class GetRepliesQuery {
  constructor(
    public readonly parentId: number,
    public readonly page: number = 1,
    public readonly limit: number = 5,
    public readonly sortOrder?: CommentSortOrder,
  ) {}
}
