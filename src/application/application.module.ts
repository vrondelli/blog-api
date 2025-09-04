import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { GetAllBlogPostsUseCase } from './use-cases/get-all-blog-posts.use-case';
import { GetPostWithCommentsUseCase } from './use-cases/get-post-with-comments.use-case';
import { CreateBlogPostUseCase } from './use-cases/create-blog-post.use-case';
import { CreateCommentUseCase } from './use-cases/create-comment.use-case';
import { GetCommentsUseCase } from './use-cases/get-comments.use-case';
import { GetRepliesUseCase } from './use-cases/get-replies.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    GetAllBlogPostsUseCase,
    GetPostWithCommentsUseCase,
    CreateBlogPostUseCase,
    CreateCommentUseCase,
    GetCommentsUseCase,
    GetRepliesUseCase,
  ],
  exports: [
    GetAllBlogPostsUseCase,
    GetPostWithCommentsUseCase,
    CreateBlogPostUseCase,
    CreateCommentUseCase,
    GetCommentsUseCase,
    GetRepliesUseCase,
  ],
})
export class ApplicationModule {}
