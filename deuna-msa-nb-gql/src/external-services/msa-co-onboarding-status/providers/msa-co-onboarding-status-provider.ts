import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoOnboardingStatusService } from '../services/rest-msa-co-onboarding-status.service';
import { IMsaCoOnboardingStatusService } from '../interfaces/msa-co-onboarding-status-service.interface';

export const MSA_CO_ONBOARDING_STATE_SERVICE =
  'MSA_CO_ONBOARDING_STATE_SERVICE';
/**
 * Factory function for creating the provider for the MSA_CO_ONBOARDING_STATE_SERVICE.
 * @param configService - The configuration service.
 * @param httpService - The HTTP service.
 * @returns An instance of the IMsaCoOnboardingStatusService.
 * @throws Error if MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE is not defined in the configuration or if the on boarding service type is unsupported.
 */
export const msaNbOnboardingStatusServiceProvider: Provider = {
  provide: MSA_CO_ONBOARDING_STATE_SERVICE,
  useFactory: (
    configService: ConfigService,
    httpService: HttpService,
  ): IMsaCoOnboardingStatusService => {
    return new RestMsaCoOnboardingStatusService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
