import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { msaNbCnbOrqServiceProvider } from './providers/msa-nb-cnb-orq.provider';
import { getKafkaClientConfig } from 'src/common/config/kafka.config';
import { KafkaModule } from '@deuna/tl-kafka-nd';
import { MSA_NB_CNB_ORQ_SERVICE } from './interfaces/msa-nb-cnb-orq-service.interface';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot(),
    KafkaModule.register(
      getKafkaClientConfig(new ConfigService(), 'cnb-orq-service'),
    ),
  ],
  providers: [msaNbCnbOrqServiceProvider, ConfigService],
  exports: [MSA_NB_CNB_ORQ_SERVICE],
})
export class MsaNbCnbOrqModule {}
