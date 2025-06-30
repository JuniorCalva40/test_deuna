import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { IMsaCoAuthService } from '../interfaces/msa-co-auth-service.interface';

import { RestMsaCoAuthService } from '../services/rest-msa-co-auth.service';
import { FakeMsaCoAuthService } from '../services/fake-msa-co-auth.service';

export const MSA_CO_AUTH_SERVICE = 'MSA_CO_AUTH_SERVICE';

export const msaCoAuthServiceProvider: Provider = {
  provide: MSA_CO_AUTH_SERVICE,
  useFactory: (
    configService: ConfigService,
    httpService: HttpService,
  ): IMsaCoAuthService => {
    const deunaMsaMiAuthServiceType = configService.get<string>(
      'MSA_CO_AUTH_SERVICE_TYPE',
    );

    if (deunaMsaMiAuthServiceType === 'mock') {
      return new FakeMsaCoAuthService();
    }

    return new RestMsaCoAuthService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
