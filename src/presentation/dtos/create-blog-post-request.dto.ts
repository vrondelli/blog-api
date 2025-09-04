import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateBlogPostRequestDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  @MaxLength(200, { message: 'Title cannot exceed 200 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.,!?]+$/, {
    message: 'Title contains invalid characters',
  })
  title: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(10, { message: 'Content must be at least 10 characters long' })
  @MaxLength(50000, { message: 'Content cannot exceed 50,000 characters' })
  content: string;
}
