import { Test, TestingModule } from '@nestjs/testing';
import { AcceptContractService } from './accept-contract.service';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { AcceptContractDataInputDto } from '../dto/accept-contract-input.dto';
import {
  GetStateOnboardingResponseDto,
  ConfirmDataResponseDto,
} from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { of, throwError } from 'rxjs';
import { ApolloError } from 'apollo-server-express';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { Logger, LoggerService } from '@nestjs/common';

describe('AcceptContractService', () => {
  let service: AcceptContractService;
  let msaCoOnboardingStatusService: IMsaCoOnboardingStatusService;
  let msaCoAuthService: IMsaCoAuthService;

  const mockOnboardingState: GetStateOnboardingResponseDto = {
    id: 1,
    sessionId: '123e4567-e89b-12d3-a456-426614174000',
    securitySeed: 'security-seed',
    identityId: 'identity-id',
    onbType: 'cnb',
    data: {
      startOnbCnb: {
        status: 'SUCCESS',
        data: {
          ruc: 123456789,
          message: 'Success message',
          cnbClientId: 'cnb-client-id',
        },
      },
    },
    status: 'SUCCESS',
    publicKey: 'public-key',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInput: AcceptContractDataInputDto = {
    sessionId: '123e4567-e89b-12d3-a456-426614174000',
    businessDeviceId: '123e4567-e89b-12d3-a456-426614174001',
    deviceName: '123e4567-e89b-12d3-a456-426614174002',
  };

  const mockEmail = 'test@example.com';

  const mockOtpResponse = {
    expirationDate: '2024-10-30T12:00:00Z',
    remainingResendAttempts: 3,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcceptContractService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: {
            getOnboardingState: jest.fn(),
            setStepAcceptContract: jest.fn(),
          },
        },
        {
          provide: MSA_CO_AUTH_SERVICE,
          useValue: {
            generateOtp: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AcceptContractService>(AcceptContractService);
    msaCoOnboardingStatusService = module.get(MSA_CO_ONBOARDING_STATE_SERVICE);
    msaCoAuthService = module.get(MSA_CO_AUTH_SERVICE);

    // Mock del ErrorHandler para controlar los códigos de error
    jest
      .spyOn(ErrorHandler, 'handleError')
      .mockImplementation((message: string, context: string) => {
        throw new ApolloError(message, context, {
          errorResponse: {
            status: 'ERROR',
            errors: [
              {
                code: context,
                message: message,
              },
            ],
          },
        });
      });
  });

  describe('startAcceptContract', () => {
    it('should successfully process contract acceptance', async () => {
      jest.spyOn(ErrorHandler, 'handleError').mockClear();

      // Mock with the correct structure according to StartOnbCnbData
      const mockStateData: GetStateOnboardingResponseDto = {
        id: 1,
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        securitySeed: 'security-seed',
        identityId: 'identity-id',
        onbType: 'cnb',
        data: {
          startOnbCnb: {
            status: 'SUCCESS',
            data: {
              ruc: 123456789,
              message: 'Success Message',
              cnbClientId: 'cnb-client-id',
            },
          },
        },
        status: 'SUCCESS',
        publicKey: 'public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock directly the commerceName property
      Object.defineProperty(service, 'commerceName', {
        get: jest.fn(() => 'Test Commerce'),
        set: jest.fn(),
      });

      const spyOnboardingState = jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockStateData));

      const spyGenerateOtp = jest
        .spyOn(msaCoAuthService, 'generateOtp')
        .mockReturnValue(of(mockOtpResponse));

      const mockConfirmResponse: ConfirmDataResponseDto = {
        successSteps: ['start-onb-cnb', 'confirm-data', 'accept-billing'],
        requiredSteps: ['accept-contract', 'sign-contract'],
        optionalSteps: [],
        failureSteps: [],
        successIdentityValidationSteps: [],
        standbyIdentityValidationSteps: [],
        processingFailure: [],
        status: 'SUCCESS',
        onbType: 'cnb',
      };

      const spySetStepAcceptContract = jest
        .spyOn(msaCoOnboardingStatusService, 'setStepAcceptContract')
        .mockReturnValue(of(mockConfirmResponse));

      // Mock validateOnboardingState to do nothing
      jest
        .spyOn<any, string>(service, 'validateOnboardingState')
        .mockImplementation(() => {});

      const result = await service.startAcceptContract(mockInput, mockEmail);

      expect(spyOnboardingState).toHaveBeenCalledWith(mockInput.sessionId);
      expect(spyGenerateOtp).toHaveBeenCalled();
      expect(spySetStepAcceptContract).toHaveBeenCalled();

      expect(result).toEqual(
        expect.objectContaining({
          sessionId: mockInput.sessionId,
          requestId: expect.any(String),
          otpResponse: mockOtpResponse,
          email: expect.any(String),
          status: 'SUCCESS',
        }),
      );
    });

    it('should handle null OTP response', async () => {
      // Mock successful onboarding state
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState));

      // Mock null OTP response
      jest.spyOn(msaCoAuthService, 'generateOtp').mockReturnValue(of(null));

      try {
        await service.startAcceptContract(mockInput, mockEmail);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          'NB_ERR_905',
        );
        expect(error.message).toBe(
          'Invalid onboarding state: the start-onb-cnb step has not been completed successfully',
        );
      }
    });

    it('should handle failed onboarding state update', async () => {
      // Mock successful responses for prerequisites
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState));

      jest
        .spyOn(msaCoAuthService, 'generateOtp')
        .mockReturnValue(of(mockOtpResponse));

      // Mock failed onboarding state update
      jest
        .spyOn(msaCoOnboardingStatusService, 'setStepAcceptContract')
        .mockReturnValue(of(null));

      try {
        await service.startAcceptContract(mockInput, mockEmail);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          'NB_ERR_905',
        );
        expect(error.message).toBe(
          'Invalid onboarding state: the start-onb-cnb step has not been completed successfully',
        );
      }
    });

    it('should handle invalid onboarding state', async () => {
      // Mock invalid onboarding state
      const invalidState: GetStateOnboardingResponseDto = {
        id: 1,
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        securitySeed: 'security-seed',
        identityId: 'identity-id',
        onbType: 'cnb',
        data: {
          startOnbCnb: {
            status: 'FAILED',
            data: {
              ruc: 123456789,
              message: 'Failed message',
              cnbClientId: 'cnb-client-id',
            },
          },
        },
        status: 'FAILED',
        publicKey: 'public-key',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(invalidState));

      try {
        await service.startAcceptContract(mockInput, mockEmail);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          'NB_ERR_905',
        );
        expect(error.message).toBe(
          'Invalid onboarding state: the start-onb-cnb step has not been completed successfully',
        );
      }
    });

    it('should handle OTP generation error', async () => {
      // Mock successful onboarding state
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(of(mockOnboardingState));

      // Mock OTP generation error
      jest
        .spyOn(msaCoAuthService, 'generateOtp')
        .mockReturnValue(
          throwError(
            () =>
              new Error(
                'Invalid onboarding state: the start-onb-cnb step has not been completed successfully',
              ),
          ),
        );

      try {
        await service.startAcceptContract(mockInput, mockEmail);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          'NB_ERR_905',
        );
        expect(error.message).toBe(
          'Invalid onboarding state: the start-onb-cnb step has not been completed successfully',
        );
      }
    });

    it('should handle system errors', async () => {
      // Mock system error
      jest
        .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
        .mockReturnValue(throwError(() => new Error('System error')));

      try {
        await service.startAcceptContract(mockInput, mockEmail);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.extensions.errorResponse.errors[0].code).toBe(
          'NB_ERR_905',
        );
        expect(error.message).toBe('System error');
      }
    });
  });

  it('should handle null OTP response and return NOTIF_SEND_FAILED error', async () => {
    // Mock successful onboarding state with correct structure
    const mockStateData: GetStateOnboardingResponseDto = {
      id: 1,
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      securitySeed: 'security-seed',
      identityId: 'identity-id',
      onbType: 'cnb',
      data: {
        startOnbCnb: {
          status: 'SUCCESS',
          data: {
            ruc: 123456789,
            message: 'Success message',
            cnbClientId: 'cnb-client-id',
          },
        },
      },
      status: 'SUCCESS',
      publicKey: 'public-key',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock directly the commerceName property
    Object.defineProperty(service, 'commerceName', {
      get: jest.fn(() => 'Test Commerce'),
      set: jest.fn(),
    });

    // Mock successful getOnboardingState
    jest
      .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
      .mockReturnValue(of(mockStateData));

    // Mock generateOtp to return null
    jest.spyOn(msaCoAuthService, 'generateOtp').mockReturnValue(of(null));

    // Mock validateOnboardingState to do nothing (since it's private)
    jest
      .spyOn<any, string>(service, 'validateOnboardingState')
      .mockImplementation(() => {});

    try {
      await service.startAcceptContract(mockInput, mockEmail);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe('Error sending OTP');
      expect(error.extensions.errorResponse.errors[0].code).toBe('NB_ERR_905'); // ErrorCodes.NOTIF_SEND_FAILED
      expect(error.extensions.errorResponse.errors[0].message).toBe(
        'Error sending OTP',
      );
    }
  });

  it('should handle null updateOnboardingState response and return ONB_STATUS_INVALID error', async () => {
    // Mock successful onboarding state with correct structure
    const mockStateData: GetStateOnboardingResponseDto = {
      id: 1,
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      securitySeed: 'security-seed',
      identityId: 'identity-id',
      onbType: 'cnb',
      data: {
        startOnbCnb: {
          status: 'SUCCESS',
          data: {
            ruc: 123456789,
            message: 'Success message',
            cnbClientId: 'cnb-client-id',
          },
        },
      },
      status: 'SUCCESS',
      publicKey: 'public-key',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock successful OTP response
    const mockOtpResponse = {
      expirationDate: '2024-10-30T12:00:00Z',
      remainingResendAttempts: 3,
    };

    // Mock directly the commerceName property
    Object.defineProperty(service, 'commerceName', {
      get: jest.fn(() => 'Test Commerce'),
      set: jest.fn(),
    });

    // Mock successful getOnboardingState
    jest
      .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
      .mockReturnValue(of(mockStateData));

    // Mock successful generateOtp
    jest
      .spyOn(msaCoAuthService, 'generateOtp')
      .mockReturnValue(of(mockOtpResponse));

    // Mock validateOnboardingState to do nothing (since it's private)
    jest
      .spyOn<any, string>(service, 'validateOnboardingState')
      .mockImplementation(() => {});

    // Mock setStepAcceptContract to return null - This is what we're testing
    jest
      .spyOn(msaCoOnboardingStatusService, 'setStepAcceptContract')
      .mockReturnValue(of(null));

    try {
      await service.startAcceptContract(mockInput, mockEmail);
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe('Error updating onboarding state');
      expect(error.extensions.errorResponse.errors[0].code).toBe('NB_ERR_905'); // ErrorCodes.ONB_STATUS_INVALID
      expect(error.extensions.errorResponse.errors[0].message).toBe(
        'Error updating onboarding state',
      );

      // Verify that all the necessary methods were called
      expect(
        msaCoOnboardingStatusService.getOnboardingState,
      ).toHaveBeenCalledWith(mockInput.sessionId);
      expect(msaCoAuthService.generateOtp).toHaveBeenCalled();
      expect(
        msaCoOnboardingStatusService.setStepAcceptContract,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: expect.any(String),
          email: mockEmail,
          deviceName: mockInput.deviceName,
          commerceName: 'Test Commerce',
          notificationChannel: ['SMS', 'EMAIL'],
          sessionId: mockInput.sessionId,
          businessDeviceId: mockInput.businessDeviceId,
          status: 'PENDING',
        }),
      );
    }
  });

  it('should handle error when generating OTP and return NOTIF_SEND_FAILED error', async () => {
    // Mock successful onboarding state with correct structure
    const mockStateData: GetStateOnboardingResponseDto = {
      id: 1,
      sessionId: '123e4567-e89b-12d3-a456-426614174000',
      securitySeed: 'security-seed',
      identityId: 'identity-id',
      onbType: 'cnb',
      data: {
        startOnbCnb: {
          status: 'SUCCESS',
          data: {
            ruc: 123456789,
            message: 'Success message',
            cnbClientId: 'cnb-client-id',
          },
        },
      },
      status: 'SUCCESS',
      publicKey: 'public-key',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const errorMessage = 'Failed to generate OTP';

    // Mock directly the commerceName property
    Object.defineProperty(service, 'commerceName', {
      get: jest.fn(() => 'Test Commerce'),
      set: jest.fn(),
    });

    // Mock successful getOnboardingState
    jest
      .spyOn(msaCoOnboardingStatusService, 'getOnboardingState')
      .mockReturnValue(of(mockStateData));

    // Mock validateOnboardingState to do nothing (since it's private)
    jest
      .spyOn<any, string>(service, 'validateOnboardingState')
      .mockImplementation(() => {});

    // Mock generateOtp to throw an error
    jest
      .spyOn(msaCoAuthService, 'generateOtp')
      .mockReturnValue(throwError(() => new Error(errorMessage)));

    try {
      await service.startAcceptContract(mockInput, mockEmail);
      fail('Should have thrown an error');
    } catch (error) {
      // Verify error structure
      expect(error).toBeInstanceOf(ApolloError);
      expect(error.message).toBe(errorMessage);
      // El código de error debe ser SYS_ERROR_UNKNOWN ya que es capturado en el catch general
      expect(error.extensions.errorResponse.errors[0].code).toBe('NB_ERR_905'); // ErrorCodes.SYS_ERROR_UNKNOWN
      expect(error.extensions.errorResponse.errors[0].message).toBe(
        errorMessage,
      );

      // Verify the OTP request was made with correct parameters
      expect(msaCoAuthService.generateOtp).toHaveBeenCalledWith({
        businessDeviceId: mockInput.businessDeviceId,
        requestId: expect.any(String),
        email: mockEmail,
        deviceName: mockInput.deviceName,
        commerceName: 'Test Commerce',
        notificationChannel: ['SMS', 'EMAIL'],
      });
    }

    // Verify setStepAcceptContract was not called due to the error
    expect(
      msaCoOnboardingStatusService.setStepAcceptContract,
    ).not.toHaveBeenCalled();
  });

  describe('handleError', () => {
    let service: AcceptContractService;
    let loggerMock: Partial<LoggerService>;

    beforeEach(async () => {
      // Create mock logger
      loggerMock = {
        error: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AcceptContractService,
          {
            provide: MSA_CO_ONBOARDING_STATE_SERVICE,
            useValue: {
              getOnboardingState: jest.fn(),
              setStepAcceptContract: jest.fn(),
            },
          },
          {
            provide: MSA_CO_AUTH_SERVICE,
            useValue: {
              generateOtp: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<AcceptContractService>(AcceptContractService);

      // Replace the logger
      jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(loggerMock.error);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should log error and call ErrorHandler.handleError with correct parameters', async () => {
      const errorMessage = 'Test error message';
      const errorCode = 'NB_ERR_905';

      // Mock ErrorHandler.handleError
      const mockErrorHandler = jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((msg: string, code: string) => {
          throw new ApolloError(msg, code, {
            errorResponse: {
              status: 'ERROR',
              errors: [
                {
                  code: code,
                  message: msg,
                },
              ],
            },
          });
        });

      try {
        await (service as any).handleError(errorMessage, errorCode);
        fail('Should have thrown an error');
      } catch (error) {
        // Verify logger was called
        expect(loggerMock.error).toHaveBeenCalledWith(`Error: ${errorMessage}`);

        // Verify ErrorHandler was called
        expect(mockErrorHandler).toHaveBeenCalledWith(errorMessage, errorCode);

        // Verify error structure
        expect(error).toBeInstanceOf(ApolloError);
        expect(error.message).toBe(errorMessage);
        expect(error.extensions.errorResponse.errors[0].code).toBe(errorCode);
        expect(error.extensions.errorResponse.errors[0].message).toBe(
          errorMessage,
        );
      }
    });

    it('should handle multiple error cases with different error codes', async () => {
      const testCases = [
        {
          message: 'Authentication failed',
          code: 'NB_ERR_001',
        },
        {
          message: 'Invalid onboarding state',
          code: 'NB_ERR_101',
        },
        {
          message: 'Notification failed',
          code: 'NB_ERR_601',
        },
      ];

      for (const testCase of testCases) {
        // Mock ErrorHandler for each test case
        const mockErrorHandler = jest
          .spyOn(ErrorHandler, 'handleError')
          .mockImplementation((msg: string, code: string) => {
            throw new ApolloError(msg, code, {
              errorResponse: {
                status: 'ERROR',
                errors: [{ code, message: msg }],
              },
            });
          });

        try {
          await (service as any).handleError(testCase.message, testCase.code);
          fail('Should have thrown an error');
        } catch (error) {
          // Verify logger was called
          expect(loggerMock.error).toHaveBeenCalledWith(
            `Error: ${testCase.message}`,
          );

          // Verify error structure
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.message).toBe(testCase.message);
          expect(error.extensions.errorResponse.errors[0].code).toBe(
            testCase.code,
          );
          expect(error.extensions.errorResponse.errors[0].message).toBe(
            testCase.message,
          );

          mockErrorHandler.mockClear();
        }
      }
    });

    it('should handle logger failure and still call ErrorHandler', async () => {
      // Setup
      const errorMessage = 'Test error message';

      // Mock the getOnboardingState method to force an error
      jest
        .spyOn(service['msaCoOnboardingStateService'], 'getOnboardingState')
        .mockImplementation(() => {
          throw new Error(errorMessage);
        });

      // Mock ErrorHandler
      const mockErrorHandler = jest
        .spyOn(ErrorHandler, 'handleError')
        .mockImplementation((msg: string, code: string) => {
          throw new ApolloError(msg, code);
        });

      try {
        // Act - Call the method that will eventually call handleError
        await service.startAcceptContract(
          {
            sessionId: 'test-session',
            businessDeviceId: 'test-device',
            deviceName: 'test-name',
          },
          'test@email.com',
        );
        fail('Should have thrown an error');
      } catch (error) {
        // Assert - Verify that ErrorHandler was called with the correct parameters
        expect(mockErrorHandler).toHaveBeenCalledWith(
          errorMessage,
          'NB_ERR_905', // ErrorCodes.SYS_ERROR_UNKNOWN
        );
      } finally {
        mockErrorHandler.mockRestore();
      }
    });
  });
});
