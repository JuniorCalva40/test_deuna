import { Test, TestingModule } from '@nestjs/testing';
import { SaveValidationResultUseCase } from './save-validation-result.use-case';
import { KYC_STORAGE_PORT } from '../../ports/out/storage/kyc-storage.port';
import { KycStoragePort } from '../../ports/out/storage/kyc-storage.port';
import { Logger } from '@nestjs/common';
import { ValidationStatus } from '../../../domain/entities/validation-status.enum';

describe('SaveValidationResultUseCase', () => {
  let useCase: SaveValidationResultUseCase;
  let storagePortMock: jest.Mocked<KycStoragePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    storagePortMock = {
      saveValidationResultRedis: jest.fn(),
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
        SaveValidationResultUseCase,
        {
          provide: KYC_STORAGE_PORT,
          useValue: storagePortMock,
        },
      ],
    }).compile();

    useCase = module.get<SaveValidationResultUseCase>(
      SaveValidationResultUseCase,
    );

    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should save liveness validation result successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'liveness';
      const result = {
        status: ValidationStatus.OK,
        score: 0.95,
        details: {
          livenessScore: 0.95,
          matchConfidence: 'High',
        },
      };

      storagePortMock.saveValidationResultRedis.mockResolvedValue();

      // Act
      await useCase.execute(scanId, type, result);

      // Assert
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalledWith(
        scanId,
        type,
        result,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving ${type} validation result for scanId: ${scanId}`,
      );
    });

    it('should save facial validation result successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'facial';
      const result = {
        status: ValidationStatus.OK,
        score: 0.89,
        details: {
          faceMatchScore: 0.89,
          documentAuthenticity: 'Valid',
          documentInfo: {
            documentNumber: '123456789',
            fullName: 'John Doe',
          },
        },
      };

      storagePortMock.saveValidationResultRedis.mockResolvedValue();

      // Act
      await useCase.execute(scanId, type, result);

      // Assert
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalledWith(
        scanId,
        type,
        result,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving ${type} validation result for scanId: ${scanId}`,
      );
    });

    it('should handle failed validation results', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'liveness';
      const result = {
        status: ValidationStatus.FAIL,
        score: 0.3,
        details: {
          reason: 'Low quality image',
        },
      };

      storagePortMock.saveValidationResultRedis.mockResolvedValue();

      // Act
      await useCase.execute(scanId, type, result);

      // Assert
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalledWith(
        scanId,
        type,
        result,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving ${type} validation result for scanId: ${scanId}`,
      );
    });

    it('should propagate error if storage port fails', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'facial';
      const result = { status: ValidationStatus.OK };
      const expectedError = new Error('Failed to save validation result');

      storagePortMock.saveValidationResultRedis.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(scanId, type, result)).rejects.toThrow(
        expectedError,
      );
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalledWith(
        scanId,
        type,
        result,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving ${type} validation result for scanId: ${scanId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error saving ${type} validation result: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should handle invalid scanId', async () => {
      // Arrange
      const scanId = '';
      const type = 'liveness';
      const result = { status: ValidationStatus.OK };
      const expectedError = new Error('Invalid scanId');

      storagePortMock.saveValidationResultRedis.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(scanId, type, result)).rejects.toThrow(
        expectedError,
      );
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalledWith(
        scanId,
        type,
        result,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Saving ${type} validation result for scanId: ${scanId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error saving ${type} validation result: ${expectedError.message}`,
        expectedError,
      );
    });
  });
});
