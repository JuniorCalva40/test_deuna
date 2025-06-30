import { Test, TestingModule } from '@nestjs/testing';
import { GetOnboardingStateUseCase } from './get-onboarding-state.use-case';
import { ONBOARDING_CLIENT_PORT } from '../../ports/out/clients/onboarding-client.port';
import { Logger } from '@nestjs/common';
import { GetStateOnboardingResponseDto } from '../../dto/onboarding/get-state-onboarding-response.dto';

describe('GetOnboardingStateUseCase', () => {
  let useCase: GetOnboardingStateUseCase;
  let onboardingClientMock: any;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    onboardingClientMock = {
      getOnboardingState: jest.fn(),
    };

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetOnboardingStateUseCase,
        {
          provide: ONBOARDING_CLIENT_PORT,
          useValue: onboardingClientMock,
        },
      ],
    }).compile();

    useCase = module.get<GetOnboardingStateUseCase>(GetOnboardingStateUseCase);

    (useCase as any).logger = loggerMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return onboarding state for valid sessionId', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const onboardingState: GetStateOnboardingResponseDto = {
        id: 123,
        sessionId: 'test-session-id',
        securitySeed: 'test-seed',
        identityId: 'test-identity',
        onbType: 'CNB',
        data: {
          startOnbCnb: {
            status: 'STARTED',
            data: {
              ruc: 123456789,
              message: 'Onboarding started',
              cnbClientId: 'client-1',
            },
          },
        },
        status: 'IN_PROGRESS',
        publicKey: 'test-public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onboardingClientMock.getOnboardingState.mockResolvedValue(
        onboardingState,
      );

      // Act
      const result = await useCase.execute(sessionId);

      // Assert
      expect(onboardingClientMock.getOnboardingState).toHaveBeenCalledWith(
        sessionId,
      );
      expect(result).toEqual(onboardingState);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting onboarding state for sessionId: ${sessionId}`,
      );
    });

    it('should propagate error if onboarding client fails', async () => {
      // Arrange
      const sessionId = 'test-session-id';
      const expectedError = new Error('Failed to get onboarding state');

      onboardingClientMock.getOnboardingState.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toThrow(expectedError);
      expect(onboardingClientMock.getOnboardingState).toHaveBeenCalledWith(
        sessionId,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting onboarding state for sessionId: ${sessionId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error getting onboarding state: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should log and propagate error for invalid sessionId', async () => {
      // Arrange
      const sessionId = '';
      const expectedError = new Error('Invalid sessionId');

      onboardingClientMock.getOnboardingState.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(sessionId)).rejects.toThrow(expectedError);
      expect(onboardingClientMock.getOnboardingState).toHaveBeenCalledWith(
        sessionId,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting onboarding state for sessionId: ${sessionId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error getting onboarding state: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should handle null or undefined response from client', async () => {
      // Arrange
      const sessionId = 'non-existent-session-id';

      onboardingClientMock.getOnboardingState.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(sessionId);

      // Assert
      expect(onboardingClientMock.getOnboardingState).toHaveBeenCalledWith(
        sessionId,
      );
      expect(result).toBeNull();
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting onboarding state for sessionId: ${sessionId}`,
      );
    });
  });
});
