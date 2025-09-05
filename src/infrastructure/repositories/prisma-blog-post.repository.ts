import { Injectable } from '@nestjs/common';
import { BlogPostRepository } from '../../domain/repositories/blog-post.repository';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { DatabaseService } from '../database/database.service';
import { WinstonLoggerService } from '../logging/winston-logger.service';

@Injectable()
export class PrismaBlogPostRepository implements BlogPostRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async findAll(): Promise<BlogPost[]> {
    const posts = await this.databaseService.blogPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            comments: {
              where: {
                parentId: null, // Only count top-level comments
              },
            },
          },
        },
      },
    });

    return posts.map(
      (post) =>
        new BlogPost(
          post.id,
          post.title,
          post.content,
          post.createdAt,
          post.updatedAt,
          undefined, // comments not loaded in findAll
        ),
    );
  }

  async findById(id: number): Promise<BlogPost | null> {
    const post = await this.databaseService.blogPost.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            comments: {
              where: {
                parentId: null, // Only count top-level comments
              },
            },
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    return new BlogPost(
      post.id,
      post.title,
      post.content,
      post.createdAt,
      post.updatedAt,
      undefined, // comments loaded separately for performance
    );
  }

  async create(title: string, content: string): Promise<BlogPost> {
    const post = await this.databaseService.blogPost.create({
      data: {
        title,
        content,
      },
    });

    return new BlogPost(
      post.id,
      post.title,
      post.content,
      post.createdAt,
      post.updatedAt,
      [], // new post has no comments
    );
  }

  async update(
    id: number,
    title?: string,
    content?: string,
  ): Promise<BlogPost | null> {
    try {
      const post = await this.databaseService.blogPost.update({
        where: { id },
        data: {
          ...(title && { title }),
          ...(content && { content }),
        },
        include: {
          comments: true,
        },
      });

      return new BlogPost(
        post.id,
        post.title,
        post.content,
        post.createdAt,
        post.updatedAt,
        post.comments.map(
          (comment) =>
            new CommentEntity(
              comment.id,
              comment.content,
              comment.author,
              comment.createdAt,
              comment.updatedAt,
              comment.blogPostId,
            ),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to update blog post with ID ${id}`,
        error instanceof Error ? error.stack : 'Unknown error',
        'PrismaBlogPostRepository',
      );
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.databaseService.blogPost.delete({
        where: { id },
      });
      this.logger.debug(
        `Successfully deleted blog post with ID ${id}`,
        'PrismaBlogPostRepository',
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete blog post with ID ${id}`,
        error instanceof Error ? error.stack : 'Unknown error',
        'PrismaBlogPostRepository',
      );
      return false;
    }
  }
}
