import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RestMsaCoOnboardingStatusService } from '../services/rest-msa-co-onboarding-status.service';
import {
  MSA_CO_ONBOARDING_STATE_SERVICE,
  msaNbOnboardingStatusServiceProvider,
} from './msa-co-onboarding-status-provider';

describe('msaNbOnboardingStatusServiceProvider', () => {
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    configService = {
      get: jest.fn(),
    } as any;

    httpService = {} as any;
  });

  it('should provide RestMsaCoOnboardingStatusService when MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE is not "mock"', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbOnboardingStatusServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoOnboardingStatusService);
  });

  it('should provide RestMsaCoOnboardingStatusService when MSA_CO_ONBOARDING_STATUS_SERVICE_TYPE is undefined', async () => {
    configService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbOnboardingStatusServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoOnboardingStatusService);
  });

  it('should inject ConfigService and HttpService', async () => {
    configService.get.mockReturnValue('rest');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        msaNbOnboardingStatusServiceProvider,
        { provide: ConfigService, useValue: configService },
        { provide: HttpService, useValue: httpService },
      ],
    }).compile();

    const service = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    expect(service).toBeInstanceOf(RestMsaCoOnboardingStatusService);
  });
});
