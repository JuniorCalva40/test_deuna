import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { QueryOnboardingStatusService } from './query-onboarding-status.service';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';

describe('QueryOnboardingStatusService', () => {
  let service: QueryOnboardingStatusService;
  let mockMsaCoOnboardingStatusService: jest.Mocked<IMsaCoOnboardingStatusService>;

  beforeEach(async () => {
    mockMsaCoOnboardingStatusService = {
      getOnboardingState: jest.fn(),
      updateOnboardingState: jest.fn(),
      initOnboarding: jest.fn(),
      startOnboarding: jest.fn(),
      getClientDataFromStartOnboardingState: jest.fn(),
      setStepAcceptContract: jest.fn(),
      completeOnboarding: jest.fn(),
      getOtpDataFromValidateOtpState: jest.fn(),
      setStepValidateOtp: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryOnboardingStatusService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockMsaCoOnboardingStatusService,
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueryOnboardingStatusService>(
      QueryOnboardingStatusService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOnboardingStatus', () => {
    const mockSessionId = '0df370be-b335-466f-a240-8ef1c389f6ff';

    it('should throw an error when onboarding state is null', async () => {
      mockMsaCoOnboardingStatusService.getOnboardingState.mockReturnValue(
        of(null),
      );

      await expect(service.getOnboardingStatus(mockSessionId)).rejects.toThrow(
        '[QUERY-ONBOARDING-STATUS] Error: Failed to retrieve onboarding status for sessionId: 0df370be-b335-466f-a240-8ef1c389f6ff',
      );
    });

    it('should throw an error when getOnboardingState throws an error', async () => {
      const testError = new Error('Test error');
      mockMsaCoOnboardingStatusService.getOnboardingState.mockReturnValue(
        throwError(() => testError),
      );

      await expect(service.getOnboardingStatus(mockSessionId)).rejects.toThrow(
        'Test error',
      );
    });
  });
});
