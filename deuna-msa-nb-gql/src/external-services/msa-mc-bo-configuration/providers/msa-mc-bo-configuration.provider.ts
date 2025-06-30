import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaMcBoConfigurationService } from '../services/rest-msa-mc-bo-configuration.service';

export const MSA_MC_BO_CONFIGURATION_SERVICE =
  'MSA_MC_BO_CONFIGURATION_SERVICE';

export const msaMcBoConfigurationProvider: Provider = {
  provide: MSA_MC_BO_CONFIGURATION_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    return new RestMsaMcBoConfigurationService(configService, httpService);
  },
  inject: [ConfigService, HttpService],
};
