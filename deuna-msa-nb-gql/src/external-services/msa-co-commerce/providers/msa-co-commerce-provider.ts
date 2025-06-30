import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoCommerceService } from '../service/rest-msa-co-commerce.service';
import { FakeRestMsaCoCommerceService } from '../service/fake-rest-msa-co-commerce.service';

export const MSA_CO_COMMERCE_SERVICE = 'MSA_CO_COMMERCE_SERVICE';

type CommerceServiceType = 'rest' | 'mock';

export const msaCoCommerceServiceProvider: Provider = {
  provide: MSA_CO_COMMERCE_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const commerceServiceType = configService.get<CommerceServiceType>(
      'MSA_CO_COMMERCE_SERVICE_TYPE',
    );

    if (commerceServiceType === 'mock') {
      return new FakeRestMsaCoCommerceService();
    }

    return new RestMsaCoCommerceService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
