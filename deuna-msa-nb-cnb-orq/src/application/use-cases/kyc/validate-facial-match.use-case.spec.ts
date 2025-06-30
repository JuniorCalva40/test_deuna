import { Test, TestingModule } from '@nestjs/testing';
import { ValidateFacialMatchUseCase } from './validate-facial-match.use-case';
import {
  KycClientPort,
  KYC_CLIENT_PORT,
  ValidationResult,
} from '../../ports/out/clients/kyc-client.port';
import { Logger } from '@nestjs/common';
import { ValidationStatus } from '../../../domain/entities/validation-status.enum';
import { TrackingInfoDto } from '../../../infrastructure/constants/common';
import { FacialValidationDto } from '../../dto/facial-validation.dto';

describe('ValidateFacialMatchUseCase', () => {
  let useCase: ValidateFacialMatchUseCase;
  let kycClientMock: jest.Mocked<KycClientPort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    kycClientMock = {
      validateFacialMatch: jest.fn(),
      validateLiveness: jest.fn(),
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
        ValidateFacialMatchUseCase,
        {
          provide: KYC_CLIENT_PORT,
          useValue: kycClientMock,
        },
      ],
    }).compile();

    useCase = module.get<ValidateFacialMatchUseCase>(
      ValidateFacialMatchUseCase,
    );

    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should validate facial match with new format successfully', async () => {
      // Arrange
      const facialData = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
        documentType: 'CEDULA',
      };

      const expectedResult: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.89,
        timestamp: new Date().toISOString(),
        details: {
          faceScore: 0.89,
          documentAuthenticity: 'VALID',
        },
      };

      kycClientMock.validateFacialMatch.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(facialData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateFacialMatch).toHaveBeenCalledWith(
        {
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
          documentType: 'CEDULA',
        } as FacialValidationDto,
        {},
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing facial matching validation',
      );
    });

    it('should validate facial match with old format successfully', async () => {
      // Arrange
      const facialData = {
        token1: 'base64-document-image',
        token2: 'base64-selfie-image',
      };

      const expectedResult: ValidationResult = {
        success: true,
        status: ValidationStatus.OK,
        score: 0.92,
        timestamp: new Date().toISOString(),
        details: {
          faceScore: 0.92,
          documentAuthenticity: 'VALID',
        },
      };

      kycClientMock.validateFacialMatch.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(facialData);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateFacialMatch).toHaveBeenCalledWith(
        {
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
          documentType: 'DNI',
        } as FacialValidationDto,
        {},
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing facial matching validation',
      );
    });

    it('should include tracking info in headers when provided', async () => {
      // Arrange
      const facialData = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
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

      kycClientMock.validateFacialMatch.mockResolvedValue(expectedResult);

      // Act
      const result = await useCase.execute(facialData, trackingInfo);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(kycClientMock.validateFacialMatch).toHaveBeenCalledWith(
        {
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
          documentType: 'DNI',
        } as FacialValidationDto,
        {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        },
      );
    });

    it('should throw error for incomplete facial data', async () => {
      // Arrange
      const incompleteData = {
        documentType: 'CEDULA',
      };

      // Act & Assert
      await expect(useCase.execute(incompleteData)).rejects.toThrow(
        'Facial validation data is incomplete',
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing facial matching validation',
      );
      expect(kycClientMock.validateFacialMatch).not.toHaveBeenCalled();
    });

    it('should handle and propagate KYC client errors', async () => {
      // Arrange
      const facialData = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
      };

      const expectedError = new Error('KYC service unavailable');
      kycClientMock.validateFacialMatch.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(facialData)).rejects.toThrow(expectedError);
      expect(kycClientMock.validateFacialMatch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Executing facial matching validation',
      );
    });

    it('should handle failed validation results', async () => {
      // Arrange
      const facialData = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
      };

      const failedResult: ValidationResult = {
        success: false,
        status: ValidationStatus.FAIL,
        error: 'Face match score too low',
        score: 0.35,
        timestamp: new Date().toISOString(),
        details: {
          faceScore: 0.35,
          threshold: 0.7,
        },
      };

      kycClientMock.validateFacialMatch.mockResolvedValue(failedResult);

      // Act
      const result = await useCase.execute(facialData);

      // Assert
      expect(result).toEqual(failedResult);
      expect(result.success).toBe(false);
      expect(result.status).toBe(ValidationStatus.FAIL);
      expect(kycClientMock.validateFacialMatch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
    });
  });
});
