import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonLoggerService } from './infrastructure/logging/winston-logger.service';
import { AllExceptionsFilter } from './infrastructure/exceptions/all-exceptions.filter';
import { CustomValidationPipe } from './infrastructure/validation/custom-validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set Winston as the logger
  const logger = app.get(WinstonLoggerService);
  app.useLogger(logger);

  // Apply global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Apply global validation pipe
  app.useGlobalPipes(new CustomValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
