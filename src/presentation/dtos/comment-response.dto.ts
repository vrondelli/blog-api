import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the comment',
    example: 456,
  })
  id: number;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This is a great blog post! Thanks for sharing.',
  })
  content: string;

  @ApiProperty({
    description: 'Name of the comment author',
    example: 'John Doe',
  })
  author: string;

  @ApiProperty({
    description: 'Timestamp when the comment was created',
    example: '2025-09-05T11:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the comment was last updated',
    example: '2025-09-05T11:15:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'ID of the blog post this comment belongs to',
    example: 123,
  })
  blogPostId: number;

  @ApiPropertyOptional({
    description: 'ID of the parent comment (for replies)',
    example: 455,
  })
  parentId?: number;

  @ApiPropertyOptional({
    description: 'Array of reply comments',
    type: () => [CommentResponseDto],
  })
  replies?: CommentResponseDto[];

  @ApiPropertyOptional({
    description: 'Number of replies to this comment',
    example: 3,
  })
  repliesCount?: number;

  constructor(
    id: number,
    content: string,
    author: string,
    createdAt: Date,
    updatedAt: Date,
    blogPostId: number,
    parentId?: number,
    replies?: CommentResponseDto[],
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
}
