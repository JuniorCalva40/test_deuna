import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Config global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Config prefix for API versioning
  app.setGlobalPrefix('v1');

  const port = process.env.PORT || 3001;
  logger.log(`Starting Product Validation Service on port ${port}`);

  await app.listen(port);
}

bootstrap();
