import { Provider } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { RestMsaCoTransferOrchestrationService } from '../services/rest-msa-co-transfer-orchestration.service';
import { FakeMsaCoTransferOrchestrationService } from '../services/fake-msa-co-transfer-orchestration.service';

export const MSA_CO_TRANSFER_ORCHESTRATION_SERVICE =
  'MSA_CO_TRANSFER_ORCHESTRATION_SERVICE';

type ConfigurtionServiceType = 'rest' | 'mock';

/**
 * Factory function for creating the provider for the MSA_CO_TRANSFER_ORCHESTRATION_SERVICE.
 * @param configService - The configuration service.
 * @param httpService - The HTTP service.
 * @returns An instance of the IMsaCoTransferOrchestrationService.
 * @throws Error if MSA_CO_TRANSFER_ORCHESTRATION_SERVICE_TYPE is not defined in the configuration or if the configuration service type is unsupported.
 */
export const msaCoTransferOrchestrationServiceProvider: Provider = {
  provide: MSA_CO_TRANSFER_ORCHESTRATION_SERVICE,
  useFactory: (configService: ConfigService, httpService: HttpService) => {
    const configurationServiceType = configService.get<ConfigurtionServiceType>(
      'MSA_CO_TRANSFER_ORCHESTRATION_SERVICE_TYPE',
    );

    if (configurationServiceType === 'mock') {
      return new FakeMsaCoTransferOrchestrationService();
    }

    return new RestMsaCoTransferOrchestrationService(
      httpService,
      configService,
    );
  },
  inject: [ConfigService, HttpService],
};
