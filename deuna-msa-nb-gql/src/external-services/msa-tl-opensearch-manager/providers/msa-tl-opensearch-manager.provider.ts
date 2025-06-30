import { HttpService } from '@nestjs/axios';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MsaTlOpensearchManagerService } from '../services/msa-tl-opensearch-manager.service';
export const MSA_TL_OPENSEARCH_MANAGER_SERVICE =
  'MSA_TL_OPENSEARCH_MANAGER_SERVICE';

export const msaTlOpensearchManagerProvider: Provider = {
  provide: MSA_TL_OPENSEARCH_MANAGER_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    return new MsaTlOpensearchManagerService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
