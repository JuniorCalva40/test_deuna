import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoOnboardingStatusService } from '../services/rest-msa-co-onboarding-status.service';
import { IMsaCoOnboardingStatusService } from '../interfaces/msa-co-onboarding-status-service.interface';
import { FakeMsaCoOnboardingStatusService } from '../services/mock-msa-co-onboarding-status.service';

export const MSA_CO_ONBOARDING_STATE_SERVICE =
  'MSA_CO_ONBOARDING_STATE_SERVICE';

type OnboardingServiceType = 'rest' | 'mock';

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
    const onboardingServiceType = configService.get<OnboardingServiceType>(
      'MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE',
    );

    if (onboardingServiceType === 'mock') {
      return new FakeMsaCoOnboardingStatusService();
    }
    return new RestMsaCoOnboardingStatusService(httpService, configService);
  },
  inject: [ConfigService, HttpService],
};
