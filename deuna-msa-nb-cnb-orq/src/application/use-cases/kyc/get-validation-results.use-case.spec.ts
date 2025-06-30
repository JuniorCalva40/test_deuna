import { Test, TestingModule } from '@nestjs/testing';
import { GetValidationResultsUseCase } from './get-validation-results.use-case';
import { KYC_STORAGE_PORT } from '../../ports/out/storage/kyc-storage.port';
import { KycStoragePort } from '../../ports/out/storage/kyc-storage.port';
import { Logger } from '@nestjs/common';
import { KycStatusDto } from '../../dto/kyc-status.dto';
import { ValidationStatus } from '@src/domain/entities/validation-status.enum';

describe('GetValidationResultsUseCase', () => {
  let useCase: GetValidationResultsUseCase;
  let storagePortMock: jest.Mocked<KycStoragePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    storagePortMock = {
      getValidationResultsRedis: jest.fn(),
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
        GetValidationResultsUseCase,
        {
          provide: KYC_STORAGE_PORT,
          useValue: storagePortMock,
        },
      ],
    }).compile();

    useCase = module.get<GetValidationResultsUseCase>(
      GetValidationResultsUseCase,
    );

    (useCase as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return validation results for valid scanId', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const validationResults: KycStatusDto = {
        liveness: ValidationStatus.OK,
        facial: ValidationStatus.OK,
      };

      storagePortMock.getValidationResultsRedis.mockResolvedValue(
        validationResults,
      );

      // Act
      const result = await useCase.execute(scanId);

      // Assert
      expect(result).toEqual(validationResults);
      expect(storagePortMock.getValidationResultsRedis).toHaveBeenCalledWith(
        scanId,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting validation results for scanId: ${scanId}`,
      );
    });

    it('should handle null or undefined response from storage', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const nullResult = null;

      storagePortMock.getValidationResultsRedis.mockResolvedValue(
        nullResult as any,
      );

      // Act
      const result = await useCase.execute(scanId);

      // Assert
      expect(result).toBeNull();
      expect(storagePortMock.getValidationResultsRedis).toHaveBeenCalledWith(
        scanId,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting validation results for scanId: ${scanId}`,
      );
    });

    it('should propagate error if storage port fails', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const expectedError = new Error('Failed to get validation results');

      storagePortMock.getValidationResultsRedis.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(scanId)).rejects.toThrow(expectedError);
      expect(storagePortMock.getValidationResultsRedis).toHaveBeenCalledWith(
        scanId,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting validation results for scanId: ${scanId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error getting validation results: ${expectedError.message}`,
        expectedError,
      );
    });

    it('should log and propagate error for invalid scanId', async () => {
      // Arrange
      const scanId = '';
      const expectedError = new Error('Invalid scanId');

      storagePortMock.getValidationResultsRedis.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(scanId)).rejects.toThrow(expectedError);
      expect(storagePortMock.getValidationResultsRedis).toHaveBeenCalledWith(
        scanId,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting validation results for scanId: ${scanId}`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        `Error getting validation results: ${expectedError.message}`,
        expectedError,
      );
    });
  });
});
