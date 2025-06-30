import { Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestMsaNbConfigurationService } from '../services/rest-msa-nb-configuration.service';
import { FakeMsaNbConfigurationService } from '../services/fake-msa-nb-configuration.service';

export const MSA_NB_CONFIGURATION_SERVICE = 'MSA_NB_CONFIGURATION_SERVICE';

type ConfigurtionServiceType = 'rest' | 'mock';

/**
 * Factory function for creating the provider for the MSA_NB_CONFIGURATION_SERVICE.
 * @param configService - The configuration service.
 * @param httpService - The HTTP service.
 * @returns An instance of the IMsaNbConfigurationService.
 * @throws Error if MSA_NB_CONFIGURATION_SERVICE_TYPE is not defined in the configuration or if the configuration service type is unsupported.
 */
export const msaNbConfigurationServiceProvider: Provider = {
  provide: MSA_NB_CONFIGURATION_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const configurationServiceType = configService.get<ConfigurtionServiceType>(
      'MSA_NB_CONFIGURATION_SERVICE_TYPE',
    );

    if (configurationServiceType === 'mock') {
      return new FakeMsaNbConfigurationService();
    }

    return new RestMsaNbConfigurationService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
