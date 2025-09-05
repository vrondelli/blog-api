import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { BlogPostController } from './controllers/blog-post.controller';
import { CommentsController } from './controllers/comments.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [ApplicationModule, InfrastructureModule],
  controllers: [BlogPostController, CommentsController, HealthController],
})
export class PresentationModule {}
