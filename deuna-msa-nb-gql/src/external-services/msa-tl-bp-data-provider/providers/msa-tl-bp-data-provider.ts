import { HttpService } from '@nestjs/axios';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MsaTlBpDataProviderService } from '../services/msa-tl-bp-data-provider.service';

export const MSA_TL_BP_DATA_PROVIDER_SERVICE =
  'MSA_TL_BP_DATA_PROVIDER_SERVICE';

export const msaTlBpDataProvider: Provider = {
  provide: MSA_TL_BP_DATA_PROVIDER_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) =>
    new MsaTlBpDataProviderService(httpService, configService),
  inject: [ConfigService, HttpService],
};
