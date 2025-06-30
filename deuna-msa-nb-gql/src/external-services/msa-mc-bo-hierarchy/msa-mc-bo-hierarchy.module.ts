import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '@deuna/tl-logger-nd';
import { KafkaModule } from '@deuna/tl-kafka-nd';
import { HttpModule } from '@nestjs/axios';
import { getKafkaClientConfig } from '../../common/config/kafka.config';
import {
  msaMcBoHierarchyServiceProvider,
  MSA_MC_BO_HIERARCHY_SERVICE,
} from './providers/msa-mc-bo-hierarchy.provider';

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
  providers: [msaMcBoHierarchyServiceProvider, ConfigService],
  exports: [MSA_MC_BO_HIERARCHY_SERVICE],
})
export class MsaMcBoHierarchyModule {}
