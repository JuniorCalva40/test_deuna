import { Test, TestingModule } from '@nestjs/testing';
import { ValidateOtpResolver } from './validate-otp.resolver';
import { ValidateOtpService } from './service/validate-otp.service';
import {
  ValidateOtpInputDto,
  ValidateOtpResponseDto,
} from './dto/validate-otp.dto';

describe('ValidateOtpResolver', () => {
  let resolver: ValidateOtpResolver;
  let validateOtpService: ValidateOtpService;

  const mockValidateOtpInput: ValidateOtpInputDto = {
    otp: '123456',
    sessionId: 'test-session-id',
    businessDeviceId: 'test-business-device-id',
    requestId: 'test-request-id',
  };

  const mockValidateOtpResponse: ValidateOtpResponseDto = {
    status: 'SUCCESS',
    isVerifiedOtp: true,
    otpResponse: {
      remainingResendAttempts: 2,
    },
  };

  const mockValidateOtpService = {
    validateOtp: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateOtpResolver,
        {
          provide: ValidateOtpService,
          useValue: mockValidateOtpService,
        },
      ],
    }).compile();

    resolver = module.get<ValidateOtpResolver>(ValidateOtpResolver);
    validateOtpService = module.get<ValidateOtpService>(ValidateOtpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('validateOtp', () => {
    it('should call validateOtp service method with correct input and return response', async () => {
      // Arrange
      mockValidateOtpService.validateOtp.mockResolvedValue(
        mockValidateOtpResponse,
      );

      // Act
      const result = await resolver.validateOtp(mockValidateOtpInput);

      // Assert
      expect(validateOtpService.validateOtp).toHaveBeenCalledWith(
        mockValidateOtpInput,
      );
      expect(result).toEqual(mockValidateOtpResponse);
    });

    it('should propagate errors from the service', async () => {
      // Arrange
      const error = new Error('Test error');
      mockValidateOtpService.validateOtp.mockRejectedValue(error);

      // Act & Assert
      await expect(resolver.validateOtp(mockValidateOtpInput)).rejects.toThrow(
        error,
      );
      expect(validateOtpService.validateOtp).toHaveBeenCalledWith(
        mockValidateOtpInput,
      );
    });

    it('should handle validation success with empty response', async () => {
      // Arrange
      const emptyResponse: ValidateOtpResponseDto = {
        status: 'SUCCESS',
        isVerifiedOtp: false,
        otpResponse: {
          remainingResendAttempts: 0,
        },
      };
      mockValidateOtpService.validateOtp.mockResolvedValue(emptyResponse);

      // Act
      const result = await resolver.validateOtp(mockValidateOtpInput);

      // Assert
      expect(validateOtpService.validateOtp).toHaveBeenCalledWith(
        mockValidateOtpInput,
      );
      expect(result).toEqual(emptyResponse);
    });

    it('should handle undefined input properties', async () => {
      // Arrange
      const incompleteInput: ValidateOtpInputDto = {
        otp: '123456',
        sessionId: 'test-session-id',
        businessDeviceId: undefined,
        requestId: undefined,
      } as ValidateOtpInputDto;

      // Act
      try {
        await resolver.validateOtp(incompleteInput);
      } catch (error) {
        // Assert
        expect(error).toBeDefined();
        expect(validateOtpService.validateOtp).toHaveBeenCalledWith(
          incompleteInput,
        );
      }
    });

    it('should handle validation error response from service', async () => {
      // Arrange
      const errorResponse: ValidateOtpResponseDto = {
        status: 'ERROR',
        isVerifiedOtp: false,
        otpResponse: {
          remainingResendAttempts: 0,
        },
        errors: [
          {
            code: 'NB_ERR_001',
            message: 'Invalid OTP',
          },
        ],
      };
      mockValidateOtpService.validateOtp.mockResolvedValue(errorResponse);

      // Act
      const result = await resolver.validateOtp(mockValidateOtpInput);

      // Assert
      expect(validateOtpService.validateOtp).toHaveBeenCalledWith(
        mockValidateOtpInput,
      );
      expect(result).toEqual(errorResponse);
      expect(result.status).toBe('ERROR');
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].code).toBe('NB_ERR_001');
    });
  });
});
