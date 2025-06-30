import { Test, TestingModule } from '@nestjs/testing';
import { ValidateLivenessUseCase } from './validate-liveness.use-case';
import {
  KycClientPort,
  KYC_CLIENT_PORT,
  ValidationResult,
} from '../../ports/out/clients/kyc-client.port';
import { Logger } from '@nestjs/common';
import { ValidationStatus } from '../../../domain/entities/validation-status.enum';
import { TrackingInfoDto } from '../../../infrastructure/constants/common';
import { LivenessValidationDto } from '../../dto/liveness-validation.dto';

describe('ValidateLivenessUseCase', () => {
  let useCase: ValidateLivenessUseCase;
  let kycClientMock: jest.Mocked<KycClientPort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    kycClientMock = {
      validateLiveness: jest.fn(),
      validateFacialMatch: jest.fn(),
    } as unknown as jest.Mocked<KycClientPort>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateLivenessUseCase,
        {
          provide: KYC_CLIENT_PORT,
          useValue: kycClientMock,
        },
      ],
    }).compile();

    useCase = module.get<ValidateLivenessUseCase>(ValidateLivenessUseCase);

    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should validate liveness with new format successfully', async () => {
      // Arrange
      const livenessData = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };

      const expectedResult: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.95,
        timestamp: new Date().toISOString(),
        details: {
          livenessScore: 0.95,
          confidence: 'High',
        },
      };

      kycClientMock.validateLiveness.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(livenessData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateLiveness).toHaveBeenCalledWith(
        {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
        {},
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing liveness validation',
      );
    });

    it('should validate liveness with old format successfully', async () => {
      // Arrange
      const livenessData = {
        imageBuffer: 'base64-selfie-image',
      };

      const expectedResult: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.92,
        timestamp: new Date().toISOString(),
        details: {
          livenessScore: 0.92,
          confidence: 'High',
        },
      };

      kycClientMock.validateLiveness.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(livenessData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateLiveness).toHaveBeenCalledWith(
        {
          selfieImage: 'base64-selfie-image',
          livenessData: {},
        } as LivenessValidationDto,
        {},
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing liveness validation',
      );
    });

    it('should include tracking info in headers when provided', async () => {
      // Arrange
      const livenessData = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };

      const trackingInfo: TrackingInfoDto = {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      const expectedResult: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.95,
        timestamp: new Date().toISOString(),
      };

      kycClientMock.validateLiveness.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(livenessData, trackingInfo);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateLiveness).toHaveBeenCalledWith(
        {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
        {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        },
      );
    });

    it('should throw error for missing required image', async () => {
      // Arrange
      const incompleteData = {
        // Missing both selfieImage and imageBuffer
        otherData: 'some-value',
      };

      // Act & Assert
      await expect(useCase.execute(incompleteData)).rejects.toThrow(
        'Liveness data does not contain the required image',
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing liveness validation',
      );
      expect(kycClientMock.validateLiveness).not.toHaveBeenCalled();
    });

    it('should handle and propagate KYC client errors', async () => {
      // Arrange
      const livenessData = {
        selfieImage: 'base64-selfie-image',
      };

      const expectedError = new Error('KYC service unavailable');
      kycClientMock.validateLiveness.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(livenessData)).rejects.toThrow(
        expectedError,
      );
      expect(kycClientMock.validateLiveness).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing liveness validation',
      );
    });

    it('should handle failed validation results', async () => {
      // Arrange
      const livenessData = {
        selfieImage: 'base64-selfie-image',
      };

      const failedResult: ValidationResult = {
        success: false,
        status: ValidationStatus.FAIL,
        error: 'Liveness check failed',
        score: 0.2,
        timestamp: new Date().toISOString(),
        details: {
          livenessScore: 0.2,
          reason: 'Possible spoofing detected',
          threshold: 0.7,
        },
      };

      kycClientMock.validateLiveness.mockResolvedValue(failedResult);

      // Act
      const result = await useCase.execute(livenessData);

      // Assert
      expect(result).toEqual(failedResult);
      expect(result.success).toBe(false);
      expect(result.status).toBe(ValidationStatus.FAIL);
      expect(kycClientMock.validateLiveness).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should handle minimal liveness data input', async () => {
      // Arrange
      const minimalData = {
        selfieImage: 'base64-selfie-image',
        // No livenessData provided
      };

      const expectedResult: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.85,
        timestamp: new Date().toISOString(),
      };

      kycClientMock.validateLiveness.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(minimalData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateLiveness).toHaveBeenCalledWith(
        {
          selfieImage: 'base64-selfie-image',
          livenessData: {},
        } as LivenessValidationDto,
        {},
      );
    });
  });
});
