import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaMcBoClientService } from '../service/rest-msa-mc-bo-client.service';
import { FakeMsaBoMcClientService } from '../service/fake-msa-mc-bo-client.service';

export const MSA_MC_BO_CLIENT_SERVICE = 'MSA_MC_BO_CLIENT_SERVICE';

export const msaBoMcClientServiceProvider: Provider = {
  provide: MSA_MC_BO_CLIENT_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const serviceType = configService.get<string>(
      'MSA_MC_BO_CLIENT_SERVICE_TYPE',
    );

    if (serviceType === 'mock') {
      return new FakeMsaBoMcClientService();
    }

    return new RestMsaMcBoClientService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
