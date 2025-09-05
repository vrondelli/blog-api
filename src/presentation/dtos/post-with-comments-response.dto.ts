import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BlogPostResponseDto } from './blog-post-response.dto';
import { CommentResponseDto } from './comment-response.dto';

export class PaginatedCommentsDto {
  @ApiProperty({
    description: 'Array of comments',
    type: [CommentResponseDto],
  })
  data: CommentResponseDto[];

  @ApiProperty({
    description: 'Total number of comments available',
    example: 50,
  })
  total: number;

  @ApiProperty({
    description: 'Number of comments per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Whether there are more comments available',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there are previous comments available',
    example: false,
  })
  hasPrev: boolean;

  @ApiPropertyOptional({
    description: 'Cursor for next page (base64 encoded)',
    example:
      'eyJjcmVhdGVkQXQiOiIyMDI1LTA5LTA1VDEwOjAwOjAwLjAwMFoiLCJpZCI6MTIzfQ==',
  })
  nextCursor?: string | null;

  constructor(
    data: CommentResponseDto[],
    total: number,
    limit: number,
    hasNext: boolean,
    hasPrev: boolean,
    nextCursor?: string | null,
  ) {
    this.data = data;
    this.total = total;
    this.limit = limit;
    this.hasNext = hasNext;
    this.hasPrev = hasPrev;
    this.nextCursor = nextCursor;
  }
}

export class PostWithCommentsResponseDto {
  @ApiProperty({
    description: 'The blog post details',
    type: BlogPostResponseDto,
  })
  post: BlogPostResponseDto;

  @ApiPropertyOptional({
    description: 'Paginated comments (null if includeComments=false)',
    type: PaginatedCommentsDto,
  })
  comments: PaginatedCommentsDto | null;

  constructor(
    post: BlogPostResponseDto,
    comments: PaginatedCommentsDto | null,
  ) {
    this.post = post;
    this.comments = comments;
  }
}
