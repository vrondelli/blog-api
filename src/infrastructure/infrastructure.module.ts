import { Module } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { BlogPostRepository } from '../domain/repositories/blog-post.repository';
import { CommentRepository } from '../domain/repositories/comment.repository';
import { PrismaBlogPostRepository } from './repositories/prisma-blog-post.repository';
import { PrismaCommentRepository } from './repositories/prisma-comment.repository';
import { CacheConfigModule } from './cache/cache-config.module';
import { CacheService } from './cache/cache.service';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [CacheConfigModule, LoggingModule],
  providers: [
    DatabaseService,
    CacheService,
    {
      provide: BlogPostRepository,
      useClass: PrismaBlogPostRepository,
    },
    {
      provide: CommentRepository,
      useClass: PrismaCommentRepository,
    },
  ],
  exports: [BlogPostRepository, CommentRepository, CacheService],
})
export class InfrastructureModule {}
