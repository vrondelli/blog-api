import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './infrastructure/logging/winston-logger.service';
import { AllExceptionsFilter } from './infrastructure/exceptions/all-exceptions.filter';
import { CustomValidationPipe } from './infrastructure/validation/custom-validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Winston as the logger
  const logger = app.get(WinstonLoggerService);
  app.useLogger(logger);

  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Apply global validation pipe
  app.useGlobalPipes(new CustomValidationPipe());

  // Swagger API Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription(
      'A comprehensive NestJS blog API with comments, replies, and caching',
    )
    .setVersion('1.0.0')
    .addTag('blog-posts', 'Blog post management endpoints')
    .addTag('Blog Post Comments', 'Get comments for blog posts')
    .addTag('Comment Replies', 'Get replies to specific comments')
    .addTag('health', 'Health check and monitoring endpoints')
    .setContact(
      'API Support',
      'https://github.com/vrondelli/blog-api',
      'support@blogapi.com',
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
    customSiteTitle: 'Blog API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(
    `🚀 Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
  logger.log(
    `📚 API Documentation available at: http://localhost:${port}/api-docs`,
    'Bootstrap',
  );
}

void bootstrap();
