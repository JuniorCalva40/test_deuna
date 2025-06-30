import { Test, TestingModule } from '@nestjs/testing';
import { SaveKycRequestUseCase } from './save-kyc-request.use-case';
import { KYC_STORAGE_PORT } from '../../ports/out/storage/kyc-storage.port';
import { KycStoragePort } from '../../ports/out/storage/kyc-storage.port';
import { Logger } from '@nestjs/common';
import { FacialValidationDto } from '../../dto/facial-validation.dto';
import { LivenessValidationDto } from '../../dto/liveness-validation.dto';

describe('SaveKycRequestUseCase', () => {
  let useCase: SaveKycRequestUseCase;
  let storagePortMock: jest.Mocked<KycStoragePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    storagePortMock = {
      saveKycRequestRedis: jest.fn(),
    } as unknown as jest.Mocked<KycStoragePort>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SaveKycRequestUseCase,
        {
          provide: KYC_STORAGE_PORT,
          useValue: storagePortMock,
        },
      ],
    }).compile();

    useCase = module.get<SaveKycRequestUseCase>(SaveKycRequestUseCase);

    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should save KYC request for valid data', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const kycData = {
        facialValidation: {
          documentType: 'ID',
          documentImage: 'base64-document-image-data',
          selfieImage: 'base64-selfie-image-data',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image-data',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
      };

      storagePortMock.saveKycRequestRedis.mockResolvedValue();

      // Act
      await useCase.execute(scanId, kycData);

      // Assert
      expect(storagePortMock.saveKycRequestRedis).toHaveBeenCalledWith(
        scanId,
        kycData,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving KYC request for scanId: ${scanId}`,
      );
    });

    it('should propagate error if storage port fails', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const kycData = {
        facialValidation: {
          documentType: 'ID',
          documentImage: 'base64-document-image-data',
          selfieImage: 'base64-selfie-image-data',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image-data',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
      };
      const expectedError = new Error('Failed to save KYC request');

      storagePortMock.saveKycRequestRedis.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(scanId, kycData)).rejects.toThrow(
        expectedError,
      );
      expect(storagePortMock.saveKycRequestRedis).toHaveBeenCalledWith(
        scanId,
        kycData,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving KYC request for scanId: ${scanId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error saving KYC request: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should handle invalid scanId or data', async () => {
      // Arrange
      const scanId = '';
      const kycData = {
        facialValidation: {
          documentType: 'ID',
          documentImage: 'base64-document-image-data',
          selfieImage: 'base64-selfie-image-data',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image-data',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
      };
      const expectedError = new Error('Invalid scanId or data');

      storagePortMock.saveKycRequestRedis.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(scanId, kycData)).rejects.toThrow(
        expectedError,
      );
      expect(storagePortMock.saveKycRequestRedis).toHaveBeenCalledWith(
        scanId,
        kycData,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving KYC request for scanId: ${scanId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error saving KYC request: ${expectedError.message}`,
        expectedError,
      );
    });
  });
});
