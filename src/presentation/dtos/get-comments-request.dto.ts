import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommentSortOrder } from '../../domain/repositories/comment.repository';

export class GetCommentsRequestDto {
  @ApiProperty({
    description: 'Number of comments to return per page',
    minimum: 1,
    maximum: 50,
    default: 10,
    required: false,
    example: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Sort order for comments',
    enum: CommentSortOrder,
    required: false,
    example: CommentSortOrder.MOST_RECENT,
  })
  @IsEnum(CommentSortOrder)
  @IsOptional()
  sortOrder?: CommentSortOrder;

  @ApiProperty({
    description: 'Maximum depth of nested replies to include',
    minimum: 0,
    maximum: 10,
    default: 2,
    required: false,
    example: 2,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  depth?: number = 2;

  @ApiProperty({
    description: 'Cursor for pagination to get next set of results',
    required: false,
    example: 'eyJpZCI6MTAsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTVUMTA6MDA6MDBaIn0=',
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}

export class GetRepliesRequestDto {
  @ApiProperty({
    description: 'Number of replies to return per page',
    minimum: 1,
    maximum: 20,
    default: 5,
    required: false,
    example: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit?: number = 5;

  @ApiProperty({
    description: 'Sort order for replies',
    enum: CommentSortOrder,
    required: false,
    example: CommentSortOrder.MOST_RECENT,
  })
  @IsEnum(CommentSortOrder)
  @IsOptional()
  sortOrder?: CommentSortOrder;

  @ApiProperty({
    description: 'Maximum depth of nested replies to include',
    minimum: 0,
    maximum: 10,
    default: 2,
    required: false,
    example: 2,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  depth?: number = 2;

  @ApiProperty({
    description: 'Cursor for pagination to get next set of results',
    required: false,
    example: 'eyJpZCI6MTAsImNyZWF0ZWRBdCI6IjIwMjQtMDEtMTVUMTA6MDA6MDBaIn0=',
  })
  @IsString()
  @IsOptional()
  cursor?: string;
}
