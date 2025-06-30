import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoCalificationService } from '../service/rest-msa-co-calification.service';
import { FakeMsaCoCalificationService } from '../service/fake-msa-co-calification.service';

export const MSA_CO_CALIFICATION_SERVICE = 'MSA_CO_CALIFICATION_SERVICE';

export const msaCoCalificationServiceProvider: Provider = {
  provide: MSA_CO_CALIFICATION_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const serviceType = configService.get<string>(
      'MSA_CO_CALIFICATION_SERVICE_TYPE',
    );

    if (serviceType === 'mock') {
      return new FakeMsaCoCalificationService();
    }

    return new RestMsaCoCalificationService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
