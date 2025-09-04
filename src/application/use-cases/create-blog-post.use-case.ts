import { Injectable } from '@nestjs/common';
import { BlogPostRepository } from '../../domain/repositories/blog-post.repository';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { CreateBlogPostCommand } from '../dtos/create-blog-post.dto';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';

@Injectable()
export class CreateBlogPostUseCase {
  constructor(
    private readonly blogPostRepository: BlogPostRepository,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async execute(command: CreateBlogPostCommand): Promise<BlogPost> {
    const newPost = await this.blogPostRepository.create(
      command.title,
      command.content,
    );

    // Invalidate the blog posts list cache since we added a new post
    await this.cacheService.deleteBlogPostsList();

    this.logger.debug(
      'Cache invalidated after creating new blog post',
      'CreateBlogPostUseCase',
    );

    return newPost;
  }
}
