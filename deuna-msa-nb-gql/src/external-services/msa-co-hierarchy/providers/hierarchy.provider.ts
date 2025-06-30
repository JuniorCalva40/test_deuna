import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaService } from '@deuna/tl-kafka-nd';
import { HttpService } from '@nestjs/axios';
import { RestHierarchyService } from '../services/rest-hierarchy.service';
import { FakeHierarchyService } from '../services/fake-hierarchy.service';

export const MSA_CO_HIERARCHY_SERVICE = 'HIERARCHY_SERVICE';

export const hierarchyServiceProvider: Provider = {
  provide: MSA_CO_HIERARCHY_SERVICE,
  useFactory: (
    configService: ConfigService,
    kafkaClient: KafkaService,
    httpService: HttpService,
  ) => {
    const serviceType = configService.get<string>('HIERARCHY_SERVICE_TYPE');

    if (serviceType === 'mock') {
      return new FakeHierarchyService();
    }

    return new RestHierarchyService(kafkaClient, httpService, configService);
  },
  inject: [ConfigService, KafkaService, HttpService],
};
