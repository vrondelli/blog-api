import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BlogPostResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the blog post',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'Title of the blog post',
    example: 'My Amazing Blog Post',
  })
  title: string;

  @ApiProperty({
    description: 'Content/body of the blog post',
    example: 'This is the main content of my blog post...',
  })
  content: string;

  @ApiProperty({
    description: 'Timestamp when the post was created',
    example: '2025-09-05T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the post was last updated',
    example: '2025-09-05T12:30:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Number of top-level comments on this post',
    example: 5,
  })
  commentsCount?: number;

  constructor(
    id: number,
    title: string,
    content: string,
    createdAt: Date,
    updatedAt: Date,
    commentsCount?: number,
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.commentsCount = commentsCount;
  }
}
