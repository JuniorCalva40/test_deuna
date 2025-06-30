import { Test, TestingModule } from '@nestjs/testing';
import { RedisKycStorageAdapter } from './redis-kyc-storage.adapter';
import { RedisService } from '@deuna/tl-cache-nd';
import { Logger } from '@nestjs/common';
import { KycRequestDto } from '../../../application/dto/kyc-request.dto';
import { FacialValidationDto } from '../../../application/dto/facial-validation.dto';
import { LivenessValidationDto } from '../../../application/dto/liveness-validation.dto';
import { TrackingInfoDto } from '../../../infrastructure/constants/common';

describe('RedisKycStorageAdapter', () => {
  let adapter: RedisKycStorageAdapter;
  let redisServiceMock: jest.Mocked<RedisService>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    redisServiceMock = {
      set: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisKycStorageAdapter,
        {
          provide: RedisService,
          useValue: redisServiceMock,
        },
      ],
    }).compile();

    adapter = module.get<RedisKycStorageAdapter>(RedisKycStorageAdapter);
    (adapter as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('saveKycRequest', () => {
    it('should save KYC request data successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const kycData = {
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        } as FacialValidationDto,
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        } as LivenessValidationDto,
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        } as TrackingInfoDto,
      };

      redisServiceMock.set.mockResolvedValue(undefined);

      // Act
      await adapter.saveKycRequestRedis(scanId, kycData);

      // Assert
      expect(redisServiceMock.set).toHaveBeenCalledWith(
        `kyc:${scanId}`,
        JSON.stringify(kycData),
      );
    });

    it('should handle Redis errors when saving KYC request', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const kycData = {
        facialValidation: {} as FacialValidationDto,
        livenessValidation: {} as LivenessValidationDto,
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        } as TrackingInfoDto,
      };
      const expectedError = new Error('Redis connection error');

      redisServiceMock.set.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(
        adapter.saveKycRequestRedis(scanId, kycData),
      ).rejects.toThrow(expectedError);
    });
  });

  describe('saveValidationResult', () => {
    it('should save validation result successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'liveness';
      const result = { success: true, score: 0.95 };

      redisServiceMock.set.mockResolvedValue(undefined);

      // Act
      await adapter.saveValidationResultRedis(scanId, type, result);

      // Assert
      expect(redisServiceMock.set).toHaveBeenCalledWith(
        `kyc:${scanId}:${type}`,
        JSON.stringify(result),
      );
    });

    it('should handle Redis errors when saving validation result', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'facial';
      const result = { success: true };
      const expectedError = new Error('Redis connection error');

      redisServiceMock.set.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(
        adapter.saveValidationResultRedis(scanId, type, result),
      ).rejects.toThrow(expectedError);
    });
  });

  describe('getKycData', () => {
    it('should get KYC data successfully when data is a string', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const mockData: KycRequestDto = {
        scanId: 'test-scan-id',
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        },
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        },
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        },
        onboardingSessionId: 'test-onboarding-session-id',
      };

      redisServiceMock.get.mockResolvedValue(JSON.stringify(mockData));

      // Act
      const result = await adapter.getKycData(scanId);

      // Assert
      expect(redisServiceMock.get).toHaveBeenCalledWith(`kyc:${scanId}`);
      expect(result).toEqual(mockData);
    });

    it('should get KYC data successfully when data is an object', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const mockData: KycRequestDto = {
        scanId: 'test-scan-id',
        facialValidation: {
          documentType: 'CEDULA',
          documentImage: 'base64-document-image',
          selfieImage: 'base64-selfie-image',
        },
        livenessValidation: {
          selfieImage: 'base64-selfie-image',
          livenessData: 'base64-liveness-data',
        },
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        },
        onboardingSessionId: 'test-onboarding-session-id',
      };

      redisServiceMock.get.mockResolvedValue(mockData);

      // Act
      const result = await adapter.getKycData(scanId);

      // Assert
      expect(redisServiceMock.get).toHaveBeenCalledWith(`kyc:${scanId}`);
      expect(result).toEqual(mockData);
    });

    it('should return null when no data is found', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      redisServiceMock.get.mockResolvedValue(null);

      // Act
      const result = await adapter.getKycData(scanId);

      // Assert
      expect(result).toBeNull();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        `KYC data not found for scanId: ${scanId}`,
      );
    });

    it('should handle JSON parse errors', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const invalidJson = '{invalid:json}';
      redisServiceMock.get.mockResolvedValue(invalidJson);

      // Act & Assert
      await expect(adapter.getKycData(scanId)).rejects.toThrow(
        'Error parsing KYC data',
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  describe('getValidationResults', () => {
    it('should get validation results successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const livenessResult = { success: true, score: 0.95 };
      const facialResult = { success: true, score: 0.85 };

      redisServiceMock.get
        .mockResolvedValueOnce(JSON.stringify(livenessResult))
        .mockResolvedValueOnce(JSON.stringify(facialResult));

      // Act
      const result = await adapter.getValidationResultsRedis(scanId);

      // Assert
      expect(redisServiceMock.get).toHaveBeenCalledWith(
        `kyc:${scanId}:liveness`,
      );
      expect(redisServiceMock.get).toHaveBeenCalledWith(`kyc:${scanId}:facial`);
      expect(result).toEqual({
        liveness: livenessResult,
        facial: facialResult,
      });
    });

    it('should handle missing validation results', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      redisServiceMock.get.mockResolvedValue(null);

      // Act
      const result = await adapter.getValidationResultsRedis(scanId);

      // Assert
      expect(result).toEqual({
        liveness: null,
        facial: null,
      });
    });

    it('should handle Redis errors when getting validation results', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const expectedError = new Error('Redis connection error');
      redisServiceMock.get.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(adapter.getValidationResultsRedis(scanId)).rejects.toThrow(
        expectedError,
      );
      expect(loggerMock.error).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
