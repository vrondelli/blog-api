import { Injectable } from '@nestjs/common';
import { BlogPostRepository } from '../../domain/repositories/blog-post.repository';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { Comment as CommentEntity } from '../../domain/entities/comment.entity';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PrismaBlogPostRepository implements BlogPostRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<BlogPost[]> {
    const posts = await this.databaseService.blogPost.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get comment counts separately for performance
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const commentsCount = await this.databaseService.comment.count({
          where: {
            blogPostId: post.id,
            parentId: null, // Only count top-level comments
          },
        });

        return new BlogPost(
          post.id,
          post.title,
          post.content,
          post.createdAt,
          post.updatedAt,
          undefined, // comments not loaded in findAll
        );
      }),
    );

    return postsWithCounts;
  }

  async findById(id: number): Promise<BlogPost | null> {
    const post = await this.databaseService.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      return null;
    }

    // Get comment count separately
    const commentsCount = await this.databaseService.comment.count({
      where: {
        blogPostId: post.id,
        parentId: null, // Only count top-level comments
      },
    });

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
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.databaseService.blogPost.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
