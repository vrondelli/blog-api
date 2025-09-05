import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBlogPostRequestDto {
  @ApiProperty({
    description: 'The title of the blog post',
    example: 'My Amazing Blog Post',
    minLength: 5,
    maxLength: 200,
    pattern: '^[a-zA-Z0-9\\s\\-_.,!?]+$',
  })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.,!?]+$/, {
    message: 'Title contains invalid characters',
  })
  title: string;

  @ApiProperty({
    description: 'The content/body of the blog post',
    example:
      'This is the main content of my blog post. It can contain multiple paragraphs and various formatting.',
    minLength: 10,
    maxLength: 50000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  @MaxLength(50000, { message: 'Content cannot exceed 50,000 characters' })
  content: string;
}
