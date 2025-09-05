import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentRequestDto {
  @ApiProperty({
    description: 'The content of the comment',
    example: 'This is a great blog post! Thanks for sharing.',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(5000, { message: 'Content cannot exceed 5,000 characters' })
  content: string;

  @ApiProperty({
    description: 'The name of the comment author',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
    pattern: '^[a-zA-Z0-9\\s\\-_.]+$',
  })
  @IsString({ message: 'Author must be a string' })
  @IsNotEmpty({ message: 'Author is required' })
  @MinLength(2, { message: 'Author name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Author name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.]+$/, {
    message: 'Author name contains invalid characters',
  })
  author: string;

  @ApiPropertyOptional({
    description: 'The ID of the parent comment (for replies)',
    example: 123,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Parent ID must be an integer' })
  @Min(1, { message: 'Parent ID must be a positive integer' })
  parentId?: number;
}
