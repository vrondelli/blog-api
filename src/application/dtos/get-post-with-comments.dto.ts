export enum CommentSortOrder {
  MOST_RECENT = 'most_recent',
  OLDEST_FIRST = 'oldest_first',
  MOST_LIKED = 'most_liked', // For future likes feature
}

export class GetPostWithCommentsQuery {
  constructor(
    public readonly postId: number,
    public readonly includeComments: boolean = false,
    public readonly commentsLimit?: number,
    public readonly commentsSortOrder?: CommentSortOrder,
    public readonly commentsDepth?: number,
    public readonly commentsCursor?: string,
  ) {}
}
