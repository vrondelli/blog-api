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

export class CreateCommentRequestDto {
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(5000, { message: 'Content cannot exceed 5,000 characters' })
  content: string;

  @IsString({ message: 'Author must be a string' })
  @IsNotEmpty({ message: 'Author is required' })
  @MinLength(2, { message: 'Author name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Author name cannot exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.]+$/, {
    message: 'Author name contains invalid characters',
  })
  author: string;

  @IsOptional()
  @IsInt({ message: 'Parent ID must be an integer' })
  @Min(1, { message: 'Parent ID must be a positive integer' })
  parentId?: number;
}
