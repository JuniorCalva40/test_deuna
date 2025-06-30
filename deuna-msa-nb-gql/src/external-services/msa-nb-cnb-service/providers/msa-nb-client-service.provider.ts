import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaNbClientService } from '../services/rest-msa-nb-client.service';
import { FakeMsaNbClientService } from '../services/fake-msa-nb-client.service';

export const MSA_NB_CLIENT_SERVICE = 'MSA_NB_CLIENT_SERVICE';

export const msaNbClientServiceProvider: Provider = {
  provide: MSA_NB_CLIENT_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const msaNbClientServiceType = configService.get<string>(
      'MSA_NB_CLIENT_SERVICE_TYPE',
    );

    if (msaNbClientServiceType === 'mock') {
      return new FakeMsaNbClientService();
    }

    return new RestMsaNbClientService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
