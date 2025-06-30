import { Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestMsaNbAliasManagementService } from '../services/rest-msa-nb-alias-management.service';

export const MSA_NB_ALIAS_MANAGEMENT_SERVICE =
  'MSA_NB_ALIAS_MANAGEMENT_SERVICE';

export const msaNbAliasManagementServiceProvider: Provider = {
  provide: MSA_NB_ALIAS_MANAGEMENT_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    return new RestMsaNbAliasManagementService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
