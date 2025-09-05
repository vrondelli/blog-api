import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PresentationModule } from './presentation/presentation.module';
import { LoggingMiddleware } from './infrastructure/middleware/logging.middleware';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import rateLimitConfig from './infrastructure/config/rate-limit.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rateLimitConfig],
    }),
    InfrastructureModule,
    PresentationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
