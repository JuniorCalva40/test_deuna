import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from 'src/infrastructure/exceptions/filters/global-exception.filter';
import { Logger } from '@deuna/tl-logger-nd';
import { VersioningType } from '@nestjs/common';
import { setupEnvironmentSync } from '@deuna/tl-environments-nd';
import { ConfigService } from '@nestjs/config';
import { getKafkaClientConfig } from 'src/infrastructure/config/kafka.config';
import { json, urlencoded } from 'express';

setupEnvironmentSync();

const logger = new Logger({ context: 'Cnb Orq  Api Microservice' });

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // Configurar límites de tamaño para body parser
    app.use(json({ limit: '50mb' }));
    app.use(urlencoded({ limit: '50mb', extended: true }));

    app.useGlobalFilters(new GlobalExceptionFilter(logger));

    // Configuración de Swagger
    const config = new DocumentBuilder()
      .setTitle('Cnb Orq Transaccion Api Microservice')
      .setDescription('Cnb Orq Transaccion Api Microservice')
      .setVersion('1.0')
      .addTag('document')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('doc', app, document);

    app.enableCors({
      origin: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    app.setGlobalPrefix('api', {
      exclude: ['service/health'],
    });

    app.enableVersioning({
      type: VersioningType.URI,
      prefix: '',
      defaultVersion: ['', 'v1', 'v2'],
    });

    // Configurar y conectar el microservicio Kafka
    app.connectMicroservice(getKafkaClientConfig(app.get(ConfigService)), {
      inheritAppConfig: true,
    });

    // Iniciar todos los microservicios
    await app.startAllMicroservices();

    await app.listen(process.env.SERVICE_PORT || 3020);

    console.log(`Application is running on: ${await app.getUrl()}`);
    logger.log('Todos los microservicios Kafka iniciados correctamente');
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

bootstrap();
