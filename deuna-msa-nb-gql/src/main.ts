import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { Logger } from '@deuna/tl-logger-nd';
import { AppModule } from './app.module';
import { SERVICE_NAME } from './common/constants/common';
// Add this line to import the reflect-metadata package for helper/FieldWithApiProperty.ts
import 'reflect-metadata';

const logger = new Logger({
  context: SERVICE_NAME,
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.use(json({ limit: '10mb' }));

  app.use(
    (
      req: any,
      res: { header: (arg0: string, arg1: string) => void },
      next: () => void,
    ) => {
      res.header('x-content-type-options', 'nosniff');
      res.header('Access-Control-Allow-Origin', '*');
      next();
    },
  );

  await app.listen(parseInt(process.env.SERVICE_PORT, 10) || 80);

  logger.log(`##### Microservice is listening on:: ${await app.getUrl()}`);
}

bootstrap();
