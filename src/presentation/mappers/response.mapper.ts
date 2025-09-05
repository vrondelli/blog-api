import { BlogPost } from '../../domain/entities/blog-post.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { BlogPostResponseDto } from '../dtos/blog-post-response.dto';
import { CommentResponseDto } from '../dtos/comment-response.dto';
import {
  PaginatedCommentsDto,
  PostWithCommentsResponseDto,
} from '../dtos/post-with-comments-response.dto';

export class BlogPostMapper {
  static toDto(entity: BlogPost): BlogPostResponseDto {
    return new BlogPostResponseDto(
      entity.id,
      entity.title,
      entity.content,
      entity.createdAt,
      entity.updatedAt,
      entity.getCommentsCount(),
    );
  }

  static toDtoList(entities: BlogPost[]): BlogPostResponseDto[] {
    return entities.map((entity) => this.toDto(entity));
  }
}

export class CommentMapper {
  static toDto(entity: Comment): CommentResponseDto {
    return new CommentResponseDto(
      entity.id,
      entity.content,
      entity.author,
      entity.createdAt,
      entity.updatedAt,
      entity.blogPostId,
      entity.parentId,
      entity.replies
        ? entity.replies.map((reply) => this.toDto(reply))
        : undefined,
      entity.getRepliesCount(),
    );
  }

  static toDtoList(entities: Comment[]): CommentResponseDto[] {
    return entities.map((entity) => this.toDto(entity));
  }

  static toPaginatedDto(
    entities: Comment[],
    total: number,
    limit: number,
    hasNext: boolean,
    hasPrev: boolean,
    nextCursor?: string | null,
  ): PaginatedCommentsDto {
    return new PaginatedCommentsDto(
      this.toDtoList(entities),
      total,
      limit,
      hasNext,
      hasPrev,
      nextCursor,
    );
  }
}

export class PostWithCommentsMapper {
  static toDto(
    blogPost: BlogPost,
    comments: {
      data: Comment[];
      total: number;
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string | null;
    } | null,
  ): PostWithCommentsResponseDto {
    const postDto = BlogPostMapper.toDto(blogPost);
    const commentsDto = comments
      ? CommentMapper.toPaginatedDto(
          comments.data,
          comments.total,
          comments.limit,
          comments.hasNext,
          comments.hasPrev,
          comments.nextCursor,
        )
      : null;

    return new PostWithCommentsResponseDto(postDto, commentsDto);
  }
}
