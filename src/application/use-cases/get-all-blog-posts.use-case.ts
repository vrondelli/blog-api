import { Injectable } from '@nestjs/common';
import { BlogPostRepository } from '../../domain/repositories/blog-post.repository';
import { BlogPost } from '../../domain/entities/blog-post.entity';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { WinstonLoggerService } from '../../infrastructure/logging/winston-logger.service';

@Injectable()
export class GetAllBlogPostsUseCase {
  constructor(
    private readonly blogPostRepository: BlogPostRepository,
    private readonly cacheService: CacheService,
    private readonly logger: WinstonLoggerService,
  ) {}

  async execute(): Promise<BlogPost[]> {
    // Try to get from cache first
    const cachedPosts = await this.cacheService.getBlogPostsList();
    if (cachedPosts) {
      this.logger.debug(
        'Returning blog posts from cache',
        'GetAllBlogPostsUseCase',
      );
      return cachedPosts;
    }

    // If not in cache, get from database
    this.logger.debug(
      'Fetching blog posts from database',
      'GetAllBlogPostsUseCase',
    );
    const posts = await this.blogPostRepository.findAll();

    // Cache the result
    await this.cacheService.setBlogPostsList(posts);

    return posts;
  }
}
