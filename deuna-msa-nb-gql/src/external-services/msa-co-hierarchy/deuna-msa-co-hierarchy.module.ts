import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { KafkaModule } from '@deuna/tl-kafka-nd';
import { HttpModule } from '@nestjs/axios';
import { getKafkaClientConfig } from '../../common/config/kafka.config';
import {
  hierarchyServiceProvider,
  MSA_CO_HIERARCHY_SERVICE,
} from './providers/hierarchy.provider';

@Module({
  imports: [
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      context: process.env.SERVICE_NAME || 'Microservice Service',
    }),
    KafkaModule.register(
      getKafkaClientConfig(new ConfigService(), 'hierarchy-service'),
    ),
    HttpModule,
  ],
  providers: [hierarchyServiceProvider, ConfigService],
  exports: [MSA_CO_HIERARCHY_SERVICE],
})
export class MsaCoHierarchyModule {}
