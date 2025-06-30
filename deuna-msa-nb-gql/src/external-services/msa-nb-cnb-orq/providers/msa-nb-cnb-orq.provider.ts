import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

import { MSA_NB_CNB_ORQ_SERVICE } from '../interfaces/msa-nb-cnb-orq-service.interface';
import { RestMsaNbCnbOrqService } from '../services/rest-msa-nb-cnb-orq.service';
import { KafkaService } from '@deuna/tl-kafka-nd';

export const msaNbCnbOrqServiceProvider: Provider = {
  provide: MSA_NB_CNB_ORQ_SERVICE,
  useFactory: (
    configService: ConfigService,
    httpService: HttpService,
    kafkaService: KafkaService,
  ) => {
    return new RestMsaNbCnbOrqService(httpService, configService, kafkaService);
  },
  inject: [ConfigService, HttpService, KafkaService],
};
