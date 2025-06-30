import { Test, TestingModule } from '@nestjs/testing';
import { SaveKycValidationUseCase } from './save-kyc-validation.use-case';
import {
  KYC_STORAGE_PORT,
  KycStoragePort,
} from '../ports/out/storage/kyc-storage.port';
import { FacialValidationDto } from '../dto/facial-validation.dto';
import { LivenessValidationDto } from '../dto/liveness-validation.dto';
import { TrackingInfoDto } from '@src/infrastructure/constants/common';

describe('SaveKycValidationUseCase', () => {
  let useCase: SaveKycValidationUseCase;
  let kycStoragePortMock: jest.Mocked<KycStoragePort>;

  beforeEach(async () => {
    // Mock of dependencies
    kycStoragePortMock = {
      saveKycRequestRedis: jest.fn(),
      // getValidationResultsRedis: jest.fn(),
      // saveValidationResultRedis: jest.fn(),
      // getKycData: jest.fn(),
    } as unknown as jest.Mocked<KycStoragePort>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveKycValidationUseCase,
        {
          provide: KYC_STORAGE_PORT,
          useValue: kycStoragePortMock,
        },
      ],
    }).compile();

    useCase = module.get<SaveKycValidationUseCase>(SaveKycValidationUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should save KYC validation data successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const validationData = {
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
        onboardingSessionId: 'test-onboarding-session-id',
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        } as TrackingInfoDto,
      };

      kycStoragePortMock.saveKycRequestRedis.mockResolvedValue();

      // Act
      await useCase.execute(scanId, validationData);

      // Assert
      expect(kycStoragePortMock.saveKycRequestRedis).toHaveBeenCalledWith(
        scanId,
        validationData,
      );
    });

    it('should propagate errors from storage port', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const validationData = {
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
        onboardingSessionId: 'test-onboarding-session-id',
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        } as TrackingInfoDto,
      };

      const expectedError = new Error('Failed to save KYC request');
      kycStoragePortMock.saveKycRequestRedis.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(scanId, validationData)).rejects.toThrow(
        expectedError,
      );
      expect(kycStoragePortMock.saveKycRequestRedis).toHaveBeenCalledWith(
        scanId,
        validationData,
      );
    });

    it('should handle invalid scanId', async () => {
      // Arrange
      const scanId = '';
      const validationData = {
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
        onboardingSessionId: 'test-onboarding-session-id',
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        } as TrackingInfoDto,
      };

      const expectedError = new Error('Invalid scanId');
      kycStoragePortMock.saveKycRequestRedis.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(scanId, validationData)).rejects.toThrow(
        expectedError,
      );
      expect(kycStoragePortMock.saveKycRequestRedis).toHaveBeenCalledWith(
        scanId,
        validationData,
      );
    });
  });
});
