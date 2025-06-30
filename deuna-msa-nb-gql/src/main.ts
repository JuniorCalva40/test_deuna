import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@deuna/tl-logger-nd';
import { json } from 'express';

const logger = new Logger({
  context: process.env.SERVICE_NAME || 'Microservice Gql',
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

  await app.listen(parseInt(process.env.PORT, 10) || 80);

  logger.log(`##### Microservice is listening on:: ${await app.getUrl()}`);
}

bootstrap();
