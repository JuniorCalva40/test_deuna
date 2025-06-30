import { Test, TestingModule } from '@nestjs/testing';
import { UpdateOnboardingStateUseCase } from './update-onboarding-state.use-case';
import {
  ONBOARDING_CLIENT_PORT,
  OnboardingClientPort,
} from '../../ports/out/clients/onboarding-client.port';
import { Logger } from '@nestjs/common';
import { OnboardingStatusUpdateRequestDto } from '../../dto/onboarding/onboarding-status-update-request.dto';
import { OnboardingStatusUpdateResponseDto } from '../../dto/onboarding/onboarding-status-update-response.dto';

describe('UpdateOnboardingStateUseCase', () => {
  let useCase: UpdateOnboardingStateUseCase;
  let onboardingClientMock: jest.Mocked<OnboardingClientPort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    onboardingClientMock = {
      updateOnboardingState: jest.fn(),
      getOnboardingState: jest.fn(),
    } as unknown as jest.Mocked<OnboardingClientPort>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOnboardingStateUseCase,
        {
          provide: ONBOARDING_CLIENT_PORT,
          useValue: onboardingClientMock,
        },
      ],
    }).compile();

    useCase = module.get<UpdateOnboardingStateUseCase>(
      UpdateOnboardingStateUseCase,
    );

    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should update onboarding state successfully', async () => {
      // Arrange
      const updateData: OnboardingStatusUpdateRequestDto = {
        data: {
          onboardingSessionId: 'test-session-id',
          statusResultValidation: 'finalized_ok',
          comment: 'Validation successful',
        },
        status: 'APPROVED',
      };
      const step = 'kycValidation';

      const expectedResponse: OnboardingStatusUpdateResponseDto = {
        successSteps: ['kycValidation'],
        requiredSteps: ['documentVerification', 'faceVerification'],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: ['kycValidation'],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'IN_PROGRESS',
        onbType: 'CNB',
      };

      onboardingClientMock.updateOnboardingState.mockResolvedValue(
        expectedResponse,
      );

      // Act
      const result = await useCase.execute(updateData, step);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(onboardingClientMock.updateOnboardingState).toHaveBeenCalledWith(
        updateData,
        step,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Updating onboarding step ${step} for session: ${updateData.data.onboardingSessionId}`,
      );
    });

    it('should handle rejected status', async () => {
      // Arrange
      const updateData: OnboardingStatusUpdateRequestDto = {
        data: {
          onboardingSessionId: 'test-session-id',
          statusResultValidation: 'finalized_fail',
          comment: 'Validation failed: Document forgery detected',
        },
        status: 'REJECTED',
      };
      const step = 'kycValidation';

      const expectedResponse: OnboardingStatusUpdateResponseDto = {
        successSteps: [],
        requiredSteps: ['documentVerification', 'faceVerification'],
        optionalSteps: [],
        failureSteps: ['kycValidation'],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'REJECTED',
        onbType: 'CNB',
      };

      onboardingClientMock.updateOnboardingState.mockResolvedValue(
        expectedResponse,
      );

      // Act
      const result = await useCase.execute(updateData, step);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(onboardingClientMock.updateOnboardingState).toHaveBeenCalledWith(
        updateData,
        step,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Updating onboarding step ${step} for session: ${updateData.data.onboardingSessionId}`,
      );
    });

    it('should propagate error if onboarding client fails', async () => {
      // Arrange
      const updateData: OnboardingStatusUpdateRequestDto = {
        data: {
          onboardingSessionId: 'test-session-id',
          statusResultValidation: 'finalized_ok',
          comment: 'Validation successful',
        },
        status: 'APPROVED',
      };
      const step = 'kycValidation';
      const expectedError = new Error('Failed to update onboarding state');

      onboardingClientMock.updateOnboardingState.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(updateData, step)).rejects.toThrow(
        expectedError,
      );
      expect(onboardingClientMock.updateOnboardingState).toHaveBeenCalledWith(
        updateData,
        step,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Updating onboarding step ${step} for session: ${updateData.data.onboardingSessionId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error updating onboarding state: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should handle invalid sessionId', async () => {
      // Arrange
      const updateData: OnboardingStatusUpdateRequestDto = {
        data: {
          onboardingSessionId: '',
          statusResultValidation: 'finalized_ok',
          comment: 'Validation successful',
        },
        status: 'APPROVED',
      };
      const step = 'kycValidation';
      const expectedError = new Error('Invalid sessionId');

      onboardingClientMock.updateOnboardingState.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(updateData, step)).rejects.toThrow(
        expectedError,
      );
      expect(onboardingClientMock.updateOnboardingState).toHaveBeenCalledWith(
        updateData,
        step,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Updating onboarding step ${step} for session: ${updateData.data.onboardingSessionId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error updating onboarding state: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should handle invalid step', async () => {
      // Arrange
      const updateData: OnboardingStatusUpdateRequestDto = {
        data: {
          onboardingSessionId: 'test-session-id',
          statusResultValidation: 'finalized_ok',
          comment: 'Validation successful',
        },
        status: 'APPROVED',
      };
      const step = 'invalidStep';
      const expectedError = new Error('Invalid step');

      onboardingClientMock.updateOnboardingState.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(updateData, step)).rejects.toThrow(
        expectedError,
      );
      expect(onboardingClientMock.updateOnboardingState).toHaveBeenCalledWith(
        updateData,
        step,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Updating onboarding step ${step} for session: ${updateData.data.onboardingSessionId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error updating onboarding state: ${expectedError.message}`,
        expectedError,
      );
    });
  });
});
