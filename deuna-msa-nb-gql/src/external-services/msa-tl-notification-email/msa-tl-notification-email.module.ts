// src/external-services/msa-tl-notification-email/msa-tl-notification-email.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { KafkaModule } from '@deuna/tl-kafka-nd';
import { getKafkaClientConfig } from '../../common/config/kafka.config';
import {
  msaTlNotificationEmailServiceProvider,
  MSA_TL_NOTIFICATION_EMAIL_SERVICE,
} from './providers/msa-tl-notification-email.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      context: process.env.SERVICE_NAME || 'Microservice Service',
    }),
    KafkaModule.register(
      getKafkaClientConfig(new ConfigService(), 'notification-service'),
    ),
  ],
  providers: [msaTlNotificationEmailServiceProvider, ConfigService],
  exports: [MSA_TL_NOTIFICATION_EMAIL_SERVICE],
})
export class MsaTlNotificationEmailModule {}
