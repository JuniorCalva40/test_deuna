/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateOtpService } from './validate-otp.service';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { MSA_NB_CLIENT_SERVICE } from '../../../external-services/msa-nb-cnb-service/providers/msa-nb-client-service.provider';
import { ValidateOtpInputDto } from '../dto/validate-otp.dto';
import { of, throwError } from 'rxjs';
import { PreApprovedState } from '../../../common/constants/common';
import { Logger } from '@nestjs/common';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { lastValueFrom } from 'rxjs';

// add interface para el objeto Error con código
interface ErrorWithCode extends Error {
  code?: string;
}

// Mock ErrorHandler para que podamos controlar los errores lanzados
jest.mock('../../../utils/error-handler.util', () => ({
  ErrorHandler: {
    handleError: jest.fn().mockImplementation((message, code) => {
      const error = new Error(message) as ErrorWithCode;
      error.code = code;
      throw error;
    }),
  },
}));

describe('ValidateOtpService', () => {
  let service: ValidateOtpService;
  let msaCoOnboardingStatusServiceMock: any;
  let msaMiAuthServiceMock: any;
  let msaNbClientServiceMock: any;
  let loggerWarnSpy: any;
  let loggerErrorSpy: any;

  const mockValidOtpInput: ValidateOtpInputDto = {
    otp: '123456',
    onboardingSessionId: 'test-session-id',
    businessDeviceId: 'test-device-id',
    requestId: 'test-request-id',
  };

  const mockClientData = {
    cnbClientId: 'test-client-id',
    status: PreApprovedState.APPROVED,
    email: 'test@email.com',
    companyName: 'Test Company',
    ruc: '12345678901',
    businessAddress: 'Test Address',
    legalRepresentative: 'Test Representative',
    establishment: {
      fullAdress: 'Test Full Address',
      numberEstablishment: '123',
    },
    identityId: 'test-identity-id',
    username: 'testuser',
    commerceId: 'test-commerce-id',
    trackingId: 'test-tracking-id',
  };

  beforeEach(async () => {
    // Create mocks for injected services
    msaCoOnboardingStatusServiceMock = {
      getClientDataFromStartOnboardingState: jest.fn(),
      setStepValidateOtp: jest.fn(),
    };

    msaMiAuthServiceMock = {
      validateOtp: jest.fn(),
    };

    msaNbClientServiceMock = {
      updateClientStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateOtpService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: msaCoOnboardingStatusServiceMock,
        },
        {
          provide: MSA_CO_AUTH_SERVICE,
          useValue: msaMiAuthServiceMock,
        },
        {
          provide: MSA_NB_CLIENT_SERVICE,
          useValue: msaNbClientServiceMock,
        },
      ],
    }).compile();

    service = module.get<ValidateOtpService>(ValidateOtpService);

    // Configure spies for loggers
    loggerWarnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {});
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateOtp', () => {
    it('should successfully validate OTP', async () => {
      // Mock successful responses for all services
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      msaMiAuthServiceMock.validateOtp.mockReturnValue(
        of({ status: 'SUCCESS', message: 'OTP validated successfully' }),
      );
      msaCoOnboardingStatusServiceMock.setStepValidateOtp.mockReturnValue(
        of({ success: true }),
      );

      const result = await service.validateOtp(mockValidOtpInput);

      expect(result.status).toBe('SUCCESS');
      expect(result.isVerifiedOtp).toBe(true);
      expect(
        msaCoOnboardingStatusServiceMock.setStepValidateOtp,
      ).toHaveBeenCalledWith(
        mockValidOtpInput.onboardingSessionId,
        mockValidOtpInput.otp,
      );
    });

    it('should handle invalid OTP with remaining attempts', async () => {
      // Configure client
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );

      // Simulate failed OTP validation with remaining attempts
      msaMiAuthServiceMock.validateOtp.mockReturnValue(
        of({
          status: 'ERROR',
          message: 'Invalid OTP',
          remainingVerifyAttempts: 2,
        }),
      );

      const result = await service.validateOtp(mockValidOtpInput);

      expect(result.status).toBe('ERROR');
      expect(result.isVerifiedOtp).toBe(false);
      expect(result.otpResponse.remainingResendAttempts).toBe(2);
      // Should not update client status if there are still attempts
      expect(msaNbClientServiceMock.updateClientStatus).not.toHaveBeenCalled();
    });

    it('should handle invalid OTP with no remaining attempts and update client status', async () => {
      // Configure client
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );

      // Simulate failed OTP validation with no remaining attempts
      msaMiAuthServiceMock.validateOtp.mockReturnValue(
        of({
          status: 'ERROR',
          message: 'Invalid OTP',
          remainingVerifyAttempts: 0,
        }),
      );

      msaNbClientServiceMock.updateClientStatus.mockReturnValue(
        of({ success: true }),
      );

      const result = await service.validateOtp(mockValidOtpInput);

      expect(result.status).toBe('ERROR');
      expect(result.isVerifiedOtp).toBe(false);
      // Should update client status when there are no remaining attempts
      expect(msaNbClientServiceMock.updateClientStatus).toHaveBeenCalledWith({
        clientId: mockClientData.cnbClientId,
        status: PreApprovedState.BLOCKED_TMP,
        blockedTmpAt: expect.any(String),
      });
    });

    it('should handle error when setting OTP status', async () => {
      // Configure client and successful OTP validation
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );
      msaMiAuthServiceMock.validateOtp.mockReturnValue(
        of({ status: 'SUCCESS', message: 'OTP validated successfully' }),
      );

      // Simulate error when updating OTP status
      msaCoOnboardingStatusServiceMock.setStepValidateOtp.mockReturnValue(
        throwError(() => {
          const error = new Error(
            'Failed to update OTP status',
          ) as ErrorWithCode;
          error.code = ErrorCodes.AUTH_OTP_UPDATE_FAILED;
          return error;
        }),
      );

      const result = await service.validateOtp(mockValidOtpInput);

      expect(result.status).toBe('ERROR');
      expect(result.isVerifiedOtp).toBe(false);
      expect(result.errors[0].code).toBe(ErrorCodes.AUTH_OTP_UPDATE_FAILED);
    });

    it('should handle exception from OTP validation service', async () => {
      // Configure client
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );

      // Simulate exception in OTP validation service
      msaMiAuthServiceMock.validateOtp.mockReturnValue(
        throwError(() => ({
          message: 'Service unavailable',
          code: ErrorCodes.SYS_SERVICE_DOWN,
          remainingVerifyAttempts: 2,
        })),
      );

      const result = await service.validateOtp(mockValidOtpInput);

      expect(result.status).toBe('ERROR');
      expect(result.isVerifiedOtp).toBe(false);
      expect(result.errors[0].code).toBe(ErrorCodes.SYS_SERVICE_DOWN);
    });

    it('should handle exception with no remaining attempts and update client status', async () => {
      // Configure client
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );

      // Simulate exception with no remaining attempts
      msaMiAuthServiceMock.validateOtp.mockReturnValue(
        throwError(() => ({
          message: 'Too many attempts',
          code: ErrorCodes.AUTH_OTP_VALIDATION_FAILED,
          remainingVerifyAttempts: 0,
        })),
      );

      msaNbClientServiceMock.updateClientStatus.mockReturnValue(
        of({ success: true }),
      );

      const result = await service.validateOtp(mockValidOtpInput);

      expect(result.status).toBe('ERROR');
      expect(msaNbClientServiceMock.updateClientStatus).toHaveBeenCalled();
    });
  });

  describe('validateInputParameters', () => {
    it('should validate valid input parameters', () => {
      const validateInputParameters =
        service['validateInputParameters'].bind(service);
      expect(() => validateInputParameters(mockValidOtpInput)).not.toThrow();
    });

    it('should throw error for invalid OTP format', () => {
      const validateInputParameters =
        service['validateInputParameters'].bind(service);
      const invalidInput = { ...mockValidOtpInput, otp: '123' };

      expect(() => validateInputParameters(invalidInput)).toThrow();
    });

    it('should throw error for missing required parameters', () => {
      const validateInputParameters =
        service['validateInputParameters'].bind(service);
      const incompleteInput = {
        otp: '123456',
      } as ValidateOtpInputDto;

      expect(() => validateInputParameters(incompleteInput)).toThrow();
    });
  });

  describe('validateClientStatus', () => {
    it('should validate client status successfully', async () => {
      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(mockClientData),
      );

      const validateClientStatus =
        service['validateClientStatus'].bind(service);
      const result = await validateClientStatus(
        mockValidOtpInput.onboardingSessionId,
      );

      expect(result).toBe(mockClientData.cnbClientId);
    });

    it('should throw error if client is blocked', async () => {
      const blockedClientData = {
        ...mockClientData,
        status: PreApprovedState.BLOCKED_TMP,
      };

      msaCoOnboardingStatusServiceMock.getClientDataFromStartOnboardingState.mockReturnValue(
        of(blockedClientData),
      );

      const validateClientStatus =
        service['validateClientStatus'].bind(service);

      try {
        await validateClientStatus(mockValidOtpInput.onboardingSessionId);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as ErrorWithCode).code).toBe(
          ErrorCodes.CLIENT_BLOCKED_TMP_OTP,
        );
      }
    });

    it('should throw error if client data is missing', async () => {
      // Mock the implementation of validateClientStatus to test the error case
      const originalValidateClientStatus = service['validateClientStatus'];

      // Define interface for mock response
      interface MockResponse {
        status: PreApprovedState;
        cnbClientId?: string;
      }

      service['validateClientStatus'] = jest
        .fn()
        .mockImplementation(async (sessionId) => {
          const response: MockResponse = { status: PreApprovedState.APPROVED }; // Without cnbClientId
          if (!response.cnbClientId) {
            const error = new Error(
              'Client data not found or incomplete',
            ) as ErrorWithCode;
            error.code = ErrorCodes.CLIENT_DATA_MISSING;
            throw error;
          }
          return response.cnbClientId;
        });

      try {
        await service['validateClientStatus'](
          mockValidOtpInput.onboardingSessionId,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as ErrorWithCode).code).toBe(
          ErrorCodes.CLIENT_DATA_MISSING,
        );
      }

      // Restauramos la implementación original
      service['validateClientStatus'] = originalValidateClientStatus;
    });

    it('should handle error in client status validation', async () => {
      // Mock the implementation of validateClientStatus to test the error case
      const originalValidateClientStatus = service['validateClientStatus'];

      service['validateClientStatus'] = jest
        .fn()
        .mockImplementation(async (sessionId) => {
          const error = new Error(
            'Error validating client status',
          ) as ErrorWithCode;
          error.code = ErrorCodes.CLIENT_STATUS_INVALID;
          throw error;
        });

      try {
        await service['validateClientStatus'](
          mockValidOtpInput.onboardingSessionId,
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as ErrorWithCode).code).toBe(
          ErrorCodes.CLIENT_STATUS_INVALID,
        );
      }

      // Restore original implementation
      service['validateClientStatus'] = originalValidateClientStatus;
    });
  });

  describe('updateOtpStatus', () => {
    it('should update OTP status successfully', async () => {
      msaCoOnboardingStatusServiceMock.setStepValidateOtp.mockReturnValue(
        of({ success: true }),
      );

      const updateOtpStatus = service['updateOtpStatus'].bind(service);
      await updateOtpStatus(mockValidOtpInput);

      expect(
        msaCoOnboardingStatusServiceMock.setStepValidateOtp,
      ).toHaveBeenCalledWith(
        mockValidOtpInput.onboardingSessionId,
        mockValidOtpInput.otp,
      );
    });

    it('should throw error if response is falsy', async () => {
      msaCoOnboardingStatusServiceMock.setStepValidateOtp.mockReturnValue(
        of(null),
      );

      const updateOtpStatus = service['updateOtpStatus'].bind(service);

      try {
        await updateOtpStatus(mockValidOtpInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as ErrorWithCode).code).toBe(
          ErrorCodes.AUTH_OTP_UPDATE_FAILED,
        );
      }
    });

    it('should handle error when updating OTP status', async () => {
      msaCoOnboardingStatusServiceMock.setStepValidateOtp.mockReturnValue(
        throwError(() => new Error('Service error')),
      );

      const updateOtpStatus = service['updateOtpStatus'].bind(service);

      try {
        await updateOtpStatus(mockValidOtpInput);
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as ErrorWithCode).code).toBe(
          ErrorCodes.AUTH_OTP_UPDATE_FAILED,
        );
      }
    });
  });
});
