import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsBoolean,
  IsInt,
  IsString,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetPostQueryDto {
  @ApiPropertyOptional({
    description: 'Whether to include comments in the response',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  includeComments?: boolean = false;

  @ApiPropertyOptional({
    description: 'Maximum number of comments to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Comments limit must be at least 1' })
  @Max(100, { message: 'Comments limit cannot exceed 100' })
  @Transform(({ value }: { value: unknown }) => parseInt(value as string))
  commentsLimit?: number = 10;

  @ApiPropertyOptional({
    description: 'Cursor for pagination (base64 encoded)',
    example:
      'eyJjcmVhdGVkQXQiOiIyMDI1LTA5LTA1VDEwOjAwOjAwLjAwMFoiLCJpZCI6MTIzfQ==',
  })
  @IsOptional()
  @IsString()
  commentsCursor?: string;

  @ApiPropertyOptional({
    description: 'Sort order for comments',
    enum: ['most_recent', 'oldest_first', 'most_liked'],
    example: 'most_recent',
  })
  @IsOptional()
  @IsString()
  @IsIn(['most_recent', 'oldest_first', 'most_liked'], {
    message: 'Sort order must be most_recent, oldest_first, or most_liked',
  })
  commentsSortOrder?: string;

  @ApiPropertyOptional({
    description: 'Maximum depth for nested replies',
    example: 2,
    minimum: 0,
    maximum: 5,
    default: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Comments depth cannot be negative' })
  @Max(5, { message: 'Comments depth cannot exceed 5' })
  @Transform(({ value }: { value: unknown }) => parseInt(value as string))
  commentsDepth?: number = 2;
}
