import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaMcBoHierarchyService } from '../services/rest-msa-mc-bo-hierarchy.service';
import { FakeMsaMcBoHierarchyService } from '../services/fake-msa-mc-bo-hierarchy.service';

export const MSA_MC_BO_HIERARCHY_SERVICE = 'MSA_MC_BO_HIERARCHY_SERVICE';

export const msaMcBoHierarchyServiceProvider: Provider = {
  provide: MSA_MC_BO_HIERARCHY_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const serviceType = configService.get<string>('HIERARCHY_SERVICE_TYPE');

    if (serviceType === 'mock') {
      return new FakeMsaMcBoHierarchyService();
    }

    return new RestMsaMcBoHierarchyService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
