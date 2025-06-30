/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateOtpService } from './validate-otp.service';
import { MSA_CO_ONBOARDING_STATE_SERVICE } from '../../../external-services/msa-co-onboarding-status/providers/msa-co-onboarding-status-provider';
import { MSA_CO_AUTH_SERVICE } from '../../../external-services/msa-co-auth/providers/msa-co-auth.provider';
import { IMsaCoOnboardingStatusService } from '../../../external-services/msa-co-onboarding-status/interfaces/msa-co-onboarding-status-service.interface';
import { IMsaCoAuthService } from '../../../external-services/msa-co-auth/interfaces/msa-co-auth-service.interface';
import { ValidateOtpInputDto } from '../dto/validate-otp.dto';
import { Observable, of } from 'rxjs';
import { ApolloError } from 'apollo-server-express';

describe('ValidateOtpService', () => {
  let service: ValidateOtpService;
  let msaCoOnboardingStatusService: IMsaCoOnboardingStatusService;
  let msaCoAuthService: IMsaCoAuthService;

  const mockValidateOtpInput: ValidateOtpInputDto = {
    otp: '123456',
    sessionId: 'test-session-id',
    businessDeviceId: 'test-business-device-id',
    requestId: 'test-request-id',
  };

  const mockValidateOtpSuccessResponse = {
    status: 'SUCCESS',
  };

  const mockValidateOtpFailureResponse = {
    status: 'ERROR',
    message: '[VALIDATE-OTP] Error: Failed to validate OTP: Invalid OTP',
    remainingResendAttempts: undefined,
  };

  const mockUpdateOtpStatusSuccessResponse = {
    successSteps: ['validate-otp'],
    requiredSteps: [],
    optionalSteps: [],
    failureSteps: [],
    successIdentityValidationSteps: [],
    standbyIdentityValidationSteps: [],
    processingFailure: [],
    status: 'SUCCESS',
    onbType: 'cnb',
  };

  const mockMsaCoOnboardingStatusService = {
    setStepValidateOtp: jest.fn(),
  };

  const mockMsaCoAuthService = {
    validateOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateOtpService,
        {
          provide: MSA_CO_ONBOARDING_STATE_SERVICE,
          useValue: mockMsaCoOnboardingStatusService,
        },
        {
          provide: MSA_CO_AUTH_SERVICE,
          useValue: mockMsaCoAuthService,
        },
      ],
    }).compile();

    service = module.get<ValidateOtpService>(ValidateOtpService);
    msaCoOnboardingStatusService = module.get<IMsaCoOnboardingStatusService>(
      MSA_CO_ONBOARDING_STATE_SERVICE,
    );
    msaCoAuthService = module.get<IMsaCoAuthService>(MSA_CO_AUTH_SERVICE);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateOtp', () => {
    it('should successfully validate OTP and update status', async () => {
      // Arrange
      mockMsaCoAuthService.validateOtp.mockReturnValue(
        of(mockValidateOtpSuccessResponse),
      );
      mockMsaCoOnboardingStatusService.setStepValidateOtp.mockReturnValue(
        of(mockUpdateOtpStatusSuccessResponse),
      );

      // Act
      const result = await service.validateOtp(mockValidateOtpInput);

      // Assert
      expect(result).toEqual({
        status: 'SUCCESS',
        isVerifiedOtp: true,
        otpResponse: {
          message: 'validate-otp success',
        },
      });

      expect(mockMsaCoAuthService.validateOtp).toHaveBeenCalledWith(
        mockValidateOtpInput.businessDeviceId,
        mockValidateOtpInput.requestId,
        mockValidateOtpInput.otp,
      );

      expect(
        mockMsaCoOnboardingStatusService.setStepValidateOtp,
      ).toHaveBeenCalledWith(
        mockValidateOtpInput.sessionId,
        mockValidateOtpInput.otp,
      );
    });

    it('should handle OTP validation failure', async () => {
      // Arrange
      const mockValidateOtpFailureResponse = {
        status: 'ERROR',
        message: '[VALIDATE-OTP] Error: Failed to validate OTP: Invalid OTP',
      };

      mockMsaCoAuthService.validateOtp.mockReturnValue(
        of(mockValidateOtpFailureResponse),
      );

      // Act
      const result = await service.validateOtp(mockValidateOtpInput);

      // Assert
      expect(result).toEqual({
        status: 'ERROR',
        isVerifiedOtp: false,
        otpResponse: {
          message:
            '[VALIDATE-OTP] Error: Failed to validate OTP: [VALIDATE-OTP] Error: Failed to validate OTP: Invalid OTP',
          remainingResendAttempts: undefined,
        },
      });

      expect(mockMsaCoAuthService.validateOtp).toHaveBeenCalledWith(
        mockValidateOtpInput.businessDeviceId,
        mockValidateOtpInput.requestId,
        mockValidateOtpInput.otp,
      );

      expect(
        mockMsaCoOnboardingStatusService.setStepValidateOtp,
      ).not.toHaveBeenCalled();
    });

    it('should handle onboarding status update failure', async () => {
      // Arrange
      mockMsaCoAuthService.validateOtp.mockReturnValue(
        of(mockValidateOtpSuccessResponse),
      );
      mockMsaCoOnboardingStatusService.setStepValidateOtp.mockReturnValue(
        of(null),
      );

      // Act
      const result = await service.validateOtp(mockValidateOtpInput);

      // Assert
      expect(result).toEqual({
        status: 'ERROR',
        isVerifiedOtp: false,
        otpResponse: {
          message:
            '[VALIDATE-OTP] Error: Invalid onboarding state: error updating OTP status for sessionId: test-session-id',
          remainingResendAttempts: undefined,
        },
      });
    });

    it('should handle unexpected errors during validation', async () => {
      // Arrange
      const errorMessage = 'Unexpected error';
      mockMsaCoAuthService.validateOtp.mockReturnValue(
        new Observable((subscriber) => {
          subscriber.error(new Error(errorMessage));
        }),
      );

      // Act
      const result = await service.validateOtp(mockValidateOtpInput);

      // Assert
      expect(result).toEqual({
        status: 'ERROR',
        isVerifiedOtp: false,
        otpResponse: {
          message: errorMessage,
        },
      });

      expect(
        mockMsaCoOnboardingStatusService.setStepValidateOtp,
      ).not.toHaveBeenCalled();
    });
  });
});
