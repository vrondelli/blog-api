export class Comment {
  id: number;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  blogPostId: number;
  parentId?: number;
  replies?: Comment[];
  repliesCount?: number;

  constructor(
    id: number,
    content: string,
    author: string,
    createdAt: Date,
    updatedAt: Date,
    blogPostId: number,
    parentId?: number,
    replies?: Comment[],
    repliesCount?: number,
  ) {
    this.id = id;
    this.content = content;
    this.author = author;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.blogPostId = blogPostId;
    this.parentId = parentId;
    this.replies = replies;
    this.repliesCount = repliesCount;
  }

  isReply(): boolean {
    return this.parentId !== null && this.parentId !== undefined;
  }

  getRepliesCount(): number {
    return this.repliesCount || this.replies?.length || 0;
  }
}
