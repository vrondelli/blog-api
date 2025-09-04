import { Comment as CommentEntity } from './comment.entity';

export class BlogPost {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  comments?: CommentEntity[];

  constructor(
    id: number,
    title: string,
    content: string,
    createdAt: Date,
    updatedAt: Date,
    comments?: CommentEntity[],
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.comments = comments;
  }

  getCommentsCount(): number {
    return this.comments?.length || 0;
  }
}
