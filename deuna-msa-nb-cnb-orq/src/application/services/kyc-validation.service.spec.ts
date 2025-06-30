import { Test, TestingModule } from '@nestjs/testing';
import { KycValidationService } from '../services/kyc-validation.service';
import { KYC_STORAGE_PORT } from '../ports/out/storage/kyc-storage.port';
import { KYC_CLIENT_PORT } from '../ports/out/clients/kyc-client.port';
import { ONBOARDING_CLIENT_PORT } from '../ports/out/clients/onboarding-client.port';
import { Logger } from '@deuna/tl-logger-nd';
import { KycValidationType } from '../dto/kyc-validation-message.dto';
import * as classValidator from 'class-validator';
import { GetOnboardingStateUseCase } from '../use-cases/kyc/get-onboarding-state.use-case';
import { UpdateOnboardingStateUseCase } from '../use-cases/kyc/update-onboarding-state.use-case';

jest.mock('@src/domain/utils/validator-tracking-headers-api', () => ({
  validateTrackingHeadersApi: jest.fn(),
}));

describe('KycValidationService', () => {
  let service: KycValidationService;
  let storagePortMock: any;
  let kycClientMock: any;
  let onboardingClientMock: any;
  let mockLogger: any;
  let mockGetOnboardingStateUseCase: jest.Mocked<GetOnboardingStateUseCase>;
  let mockUpdateOnboardingStateUseCase: jest.Mocked<UpdateOnboardingStateUseCase>;

  beforeEach(async () => {
    storagePortMock = {
      getKycData: jest.fn(),
      saveKycRequestRedis: jest.fn(),
      saveValidationResultRedis: jest.fn(),
      getValidationResultsRedis: jest.fn(),
    };

    kycClientMock = {
      validateLiveness: jest.fn(),
      validateFacialMatch: jest.fn(),
    };

    onboardingClientMock = {
      getOnboardingState: jest.fn(),
      updateOnboardingState: jest.fn(),
    };

    mockLogger = {
      constructor: () => {},
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    };

    mockGetOnboardingStateUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetOnboardingStateUseCase>;

    mockUpdateOnboardingStateUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateOnboardingStateUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycValidationService,
        {
          provide: KYC_STORAGE_PORT,
          useValue: storagePortMock,
        },
        {
          provide: KYC_CLIENT_PORT,
          useValue: kycClientMock,
        },
        {
          provide: ONBOARDING_CLIENT_PORT,
          useValue: onboardingClientMock,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<KycValidationService>(KycValidationService);

    (service as any).getOnboardingStateUseCase = mockGetOnboardingStateUseCase;
    (service as any).updateOnboardingStateUseCase =
      mockUpdateOnboardingStateUseCase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processValidationMessage', () => {
    it('should process liveness validation message successfully', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-01T12:00:00Z',
      };

      const kycData = {
        scanId: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        documentType: 'PASSPORT',
        documentNumber: '123456789',
        trackingInfo: {
          sessionId: 'session-123',
          userId: 'user-123',
          trackingId: 'tracking-123',
          requestId: 'request-123',
        },
        livenessValidation: {
          selfieImage: 'base64-selfie-data',
          livenessData: {},
        },
      };

      const livenessResult = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-01T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Live',
          serviceTime: '449',
          serviceTransactionId: '0472015b-db28-41df-9187-cbde882d7c36',
          serviceLivenessResult: 3,
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycData);
      kycClientMock.validateLiveness.mockResolvedValue(livenessResult);
      storagePortMock.saveValidationResultRedis.mockResolvedValue(true);
      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-123',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await service.processValidationMessage(validationMessage);

      // Assert
      expect(storagePortMock.getKycData).toHaveBeenCalledWith(
        'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
      );

      expect(kycClientMock.validateLiveness).toHaveBeenCalled();

      expect(kycClientMock.validateLiveness.mock.calls[0][0]).toEqual(
        kycData.livenessValidation,
      );

      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalled();
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_OK',
          }),
        }),
        'cnb-liveness',
      );
    });

    it('should process liveness validation message with old format successfully', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'a897276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-01T12:00:00Z',
      };

      const kycData = {
        scanId: 'a897276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        documentType: 'PASSPORT',
        documentNumber: '123456789',
        trackingInfo: {
          sessionId: 'session-123',
          userId: 'user-123',
          trackingId: 'tracking-123',
          requestId: 'request-123',
        },
        livenessValidation: {
          imageBuffer: 'base64-selfie-data-old-format',
        },
      };

      const livenessResult = {
        serviceLivenessResult: true,
        serviceResultLog: 'Live',
        score: 0.98,
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycData);
      kycClientMock.validateLiveness.mockResolvedValue(livenessResult);
      storagePortMock.saveValidationResultRedis.mockResolvedValue(true);

      // Act
      await service.processValidationMessage(validationMessage);

      // Assert
      expect(kycClientMock.validateLiveness).toHaveBeenCalled();
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalled();
    });

    it('should process facial match validation message successfully', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'b897276b-b13b-44d4-9fa2-5b4feb6f9ec8',
        type: KycValidationType.FACIAL,
        timestamp: '2023-01-02T12:00:00Z',
      };

      const kycData = {
        scanId: 'b897276b-b13b-44d4-9fa2-5b4feb6f9ec8',
        documentType: 'PASSPORT',
        documentNumber: '987654321',
        trackingInfo: {
          sessionId: 'session-456',
          userId: 'user-456',
          trackingId: 'tracking-456',
          requestId: 'request-456',
        },
        facialValidation: {
          selfieImage: 'base64-selfie-data',
          documentImage: 'base64-document-image',
          documentType: 'DNI',
        },
      };

      const facialMatchResult = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-02T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Positive',
          serviceTime: '485',
          serviceTransactionId: 'ded700b2-a196-475a-bff5-0f8f79021c53',
          serviceFacialAuthenticationHash:
            '9B3A5E87445E0A3895AB950896888BF9909B2374328587A8DD8D6F9B91B019735D9DFC87652257E230FD1F8298A2E60B6DFFF86A04BB9EFA4769A65612761728',
          serviceFacialAuthenticationResult: 3,
          serviceFacialSimilarityResult: 1.0,
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycData);
      kycClientMock.validateFacialMatch.mockResolvedValue(facialMatchResult);
      storagePortMock.saveValidationResultRedis.mockResolvedValue(true);
      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-456',
        securitySeed: 'seed',
        identityId: 'id456',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-facial',
        identityId: 'id456',
        data: {},
      } as any);

      // Act
      await service.processValidationMessage(validationMessage);

      // Assert
      expect(storagePortMock.getKycData).toHaveBeenCalledWith(
        'b897276b-b13b-44d4-9fa2-5b4feb6f9ec8',
      );

      expect(kycClientMock.validateFacialMatch).toHaveBeenCalled();

      expect(kycClientMock.validateFacialMatch.mock.calls[0][0]).toEqual(
        kycData.facialValidation,
      );

      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalled();
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_OK',
          }),
        }),
        'cnb-facial',
      );
    });

    it('should process facial match validation message with old format successfully', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'b997276b-b13b-44d4-9fa2-5b4feb6f9ec8',
        type: KycValidationType.FACIAL,
        timestamp: '2023-01-02T12:00:00Z',
      };

      const kycData = {
        scanId: 'b997276b-b13b-44d4-9fa2-5b4feb6f9ec8',
        documentType: 'PASSPORT',
        documentNumber: '987654321',
        trackingInfo: {
          sessionId: 'session-456',
          userId: 'user-456',
          trackingId: 'tracking-456',
          requestId: 'request-456',
        },
        facialValidation: {
          token1: 'base64-document-image-old-format',
          token2: 'base64-selfie-data-old-format',
        },
      };

      const facialMatchResult = {
        serviceFacialAuthenticationResult: true,
        serviceResultLog: 'Positive',
        score: 0.85,
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycData);
      kycClientMock.validateFacialMatch.mockResolvedValue(facialMatchResult);
      storagePortMock.saveValidationResultRedis.mockResolvedValue(true);

      // Act
      await service.processValidationMessage(validationMessage);

      // Assert
      expect(kycClientMock.validateFacialMatch).toHaveBeenCalled();
      expect(storagePortMock.saveValidationResultRedis).toHaveBeenCalled();
    });

    it('should throw error when KYC data not found', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'c897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-03T12:00:00Z',
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.processValidationMessage(validationMessage),
      ).rejects.toThrow(
        `KYC data not found for scanId: ${validationMessage.scanId}`,
      );
    });

    it('should throw error when liveness data is missing', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'd897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-03T12:00:00Z',
      };

      const kycDataWithoutLivenessData = {
        scanId: 'd897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        documentType: 'PASSPORT',
        documentNumber: '123456789',
        trackingInfo: {
          sessionId: 'session-123',
          userId: 'user-123',
          trackingId: 'tracking-123',
          requestId: 'request-123',
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycDataWithoutLivenessData);

      // Act & Assert
      await expect(
        service.processValidationMessage(validationMessage),
      ).rejects.toThrow(
        `Liveness data not found for scanId: ${validationMessage.scanId}`,
      );
    });

    it('should throw error when facial validation data is missing', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'e897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        type: KycValidationType.FACIAL,
        timestamp: '2023-01-03T12:00:00Z',
      };

      const kycDataWithoutFacialData = {
        scanId: 'e897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        documentType: 'PASSPORT',
        documentNumber: '123456789',
        trackingInfo: {
          sessionId: 'session-123',
          userId: 'user-123',
          trackingId: 'tracking-123',
          requestId: 'request-123',
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycDataWithoutFacialData);

      // Act & Assert
      await expect(
        service.processValidationMessage(validationMessage),
      ).rejects.toThrow(
        `Facial validation data not found for scanId: ${validationMessage.scanId}`,
      );
    });

    it('should throw error for unsupported validation type', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'f897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        type: 'UNSUPPORTED_TYPE' as any,
        timestamp: '2023-01-03T12:00:00Z',
      };

      const kycData = {
        scanId: 'f897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        documentType: 'PASSPORT',
        documentNumber: '123456789',
        trackingInfo: {
          sessionId: 'session-123',
          userId: 'user-123',
          trackingId: 'tracking-123',
          requestId: 'request-123',
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockResolvedValue(kycData);

      // Act & Assert
      await expect(
        service.processValidationMessage(validationMessage),
      ).rejects.toThrow(
        `Validation type not supported: ${validationMessage.type}`,
      );
    });

    it('should handle invalid validation message format', async () => {
      const invalidMessage = {
        scanId: 'invalid-scan-id',
        type: 'unknown-type',
        timestamp: 'invalid-timestamp',
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockRejectedValue(new Error('Invalid message format'));

      await expect(
        service.processValidationMessage(invalidMessage),
      ).rejects.toThrow('Invalid message format');
    });

    it('should handle errors when storage retrieval fails', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'c897276b-b13b-44d4-9fa2-5b4feb6f9ec7',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-03T12:00:00Z',
      };

      const expectedError = new Error('Storage error');

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);

      storagePortMock.getKycData.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(
        service.processValidationMessage(validationMessage),
      ).rejects.toThrow('Storage error');
    });

    it('should handle unsuccessful validation result for liveness', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'test-id',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-01T12:00:00Z',
      };

      const kycData = {
        scanId: 'test-id',
        trackingInfo: {
          sessionId: 'session123',
          trackingId: 'tracking123',
          requestId: 'request123',
          userId: 'user123',
        },
        livenessValidation: { selfieImage: 'base64-data' },
      };

      const livenessResult = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-01T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Not Live',
          serviceTime: '449',
          serviceTransactionId: '0472015b-db28-41df-9187-cbde882d7c36',
          serviceLivenessResult: 1,
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);
      storagePortMock.getKycData.mockResolvedValue(kycData);
      kycClientMock.validateLiveness.mockResolvedValue(livenessResult);
      storagePortMock.saveValidationResultRedis.mockResolvedValue(true);

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session123',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);

      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'FAILED',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await service.processValidationMessage(validationMessage);

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_FAIL',
          }),
        }),
        'cnb-liveness',
      );
    });

    it('should handle unsuccessful validation result for facial', async () => {
      // Arrange
      const validationMessage = {
        scanId: 'test-id',
        type: KycValidationType.FACIAL,
        timestamp: '2023-01-02T12:00:00Z',
      };

      const kycData = {
        scanId: 'test-id',
        trackingInfo: {
          sessionId: 'session123',
          trackingId: 'tracking123',
          requestId: 'request123',
          userId: 'user123',
        },
        facialValidation: {
          selfieImage: 'base64-data',
          documentImage: 'base64-doc',
        },
      };

      const facialMatchResult = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-02T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Negative',
          serviceTime: '485',
          serviceTransactionId: 'ded700b2-a196-475a-bff5-0f8f79021c53',
          serviceFacialAuthenticationResult: 1,
          serviceFacialSimilarityResult: 0.3,
        },
      };

      jest
        .spyOn(service as any, 'validateMessage')
        .mockResolvedValue(validationMessage);
      storagePortMock.getKycData.mockResolvedValue(kycData);
      kycClientMock.validateFacialMatch.mockResolvedValue(facialMatchResult);
      storagePortMock.saveValidationResultRedis.mockResolvedValue(true);

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session123',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);

      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'FAILED',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-facial',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await service.processValidationMessage(validationMessage);

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_FAIL',
          }),
        }),
        'cnb-facial',
      );
    });
  });

  describe('validateMessage and parseMessage', () => {
    it('should parse and validate a message in string format', async () => {
      // Arrange
      const messageString = JSON.stringify({
        scanId: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-01T12:00:00Z',
      });

      jest.spyOn(classValidator, 'validate').mockResolvedValue([]);

      // Act
      const result = await (service as any).validateMessage(messageString);

      // Assert
      expect(result).toBeDefined();
      expect(result.scanId).toBe('a797276b-b13b-44d4-9fa2-5b4feb6f9ec9');
      expect(result.type).toBe(KycValidationType.LIVENESS);
    });

    it('should parse and validate a message in Kafka format with value property as object', async () => {
      // Arrange
      const kafkaMessage = {
        value: {
          scanId: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
          type: KycValidationType.LIVENESS,
          timestamp: '2023-01-01T12:00:00Z',
        },
      };

      jest.spyOn(classValidator, 'validate').mockResolvedValue([]);

      // Act
      const result = await (service as any).validateMessage(kafkaMessage);

      // Assert
      expect(result).toBeDefined();
      expect(result.scanId).toBe('a797276b-b13b-44d4-9fa2-5b4feb6f9ec9');
      expect(result.type).toBe(KycValidationType.LIVENESS);
    });

    it('should parse a message with direct properties', async () => {
      // Arrange
      const directMessage = {
        scanId: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-01T12:00:00Z',
      };

      // Act
      const result = (service as any).parseMessage(directMessage);

      // Assert
      expect(result).toEqual(directMessage);
    });

    it('should throw error for unrecognized message format', async () => {
      // Arrange
      const invalidMessageFormat = {
        // No contiene scanId o type
        someProperty: 'someValue',
      };

      // Act & Assert
      expect(() => {
        (service as any).parseMessage(invalidMessageFormat);
      }).toThrow('Message format not recognized');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidMessage = {
        scanId: 'invalid-uuid',
        type: 'invalid-type',
        timestamp: 'invalid-date',
      };

      jest.spyOn(classValidator, 'validate').mockResolvedValue([
        {
          property: 'scanId',
          constraints: {
            isUuid: 'scanId must be a UUID',
          },
        },
      ]);

      await expect(
        (service as any).validateMessage(invalidMessage),
      ).rejects.toThrow('Invalid message format');
    });

    it('should handle parsing errors', async () => {
      // Arrange
      const invalidJsonString = '{invalid-json}';

      // Act & Assert
      expect(() => {
        (service as any).parseMessage(invalidJsonString);
      }).toThrow('Error parsing message');
    });

    it('should parse message when it already has the expected format', async () => {
      // Arrange
      const directMessage = {
        scanId: 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9',
        type: KycValidationType.LIVENESS,
        timestamp: '2023-01-01T12:00:00Z',
      };

      jest.spyOn(classValidator, 'validate').mockResolvedValue([]);

      // Act
      const result = await (service as any).validateMessage(directMessage);

      // Assert
      expect(result).toBeDefined();
      expect(result.scanId).toBe('a797276b-b13b-44d4-9fa2-5b4feb6f9ec9');
      expect(result.type).toBe(KycValidationType.LIVENESS);
    });
  });

  describe('processOnboardingState', () => {
    it('should update onboarding state for successful liveness validation', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
        trackingId: 'tracking-456',
        requestId: 'request-789',
      };
      const scanId = 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9';
      const step = 'CNBLiveness';
      const isSuccess = true;
      const validationResult = {
        serviceLivenessResult: true,
        serviceResultLog: 'Live',
        score: 0.98,
      };

      onboardingClientMock.getOnboardingState.mockResolvedValue({
        status: 'IN_PROGRESS',
      });
      onboardingClientMock.updateOnboardingState.mockResolvedValue({
        status: 'SUCCESS',
      });

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_OK',
          }),
        }),
        step,
      );
    });

    it('should update onboarding state for failed liveness validation', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
        trackingId: 'tracking-456',
        requestId: 'request-789',
      };
      const scanId = 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9';
      const step = 'CNBLiveness';
      const isSuccess = false;
      const validationResult = {
        serviceLivenessResult: false,
        serviceResultLog: 'Not Live',
        score: 0.3,
      };

      onboardingClientMock.getOnboardingState.mockResolvedValue({
        status: 'IN_PROGRESS',
      });
      onboardingClientMock.updateOnboardingState.mockResolvedValue({
        status: 'FAILED',
      });

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'FAILED',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_FAIL',
          }),
        }),
        step,
      );
    });

    it('should handle error when getOnboardingState fails', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: '12345',
        userId: 'user123',
      };
      const scanId = 'scan123';
      const step = 'LIVENESS';
      const isSuccess = true;
      const validationResult = {
        serviceResult: 'LIVE',
        serviceResultLog: 'Live',
        score: 0.98,
      };

      mockGetOnboardingStateUseCase.execute.mockRejectedValue(
        new Error('Failed to get onboarding state'),
      );

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting onboarding state'),
        expect.any(Error),
      );
      expect(mockUpdateOnboardingStateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle error when updateOnboardingState fails', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user123',
      };
      const scanId = 'scan123';
      const step = 'LIVENESS';
      const isSuccess = true;
      const validationResult = {
        serviceResult: 'LIVE',
        serviceResultLog: 'Live',
        score: 0.98,
      };

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);

      mockUpdateOnboardingStateUseCase.execute.mockRejectedValue(
        new Error('Failed to update onboarding state'),
      );

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error updating onboarding state'),
        expect.any(Error),
      );
    });

    it('should correctly use mocked use cases for onboarding state update', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
      };
      const scanId = 'scan-123';
      const step = 'CNBLiveness';
      const isSuccess = true;
      const validationResult = {
        serviceResultLog: 'Live',
      };

      // Configurar los mocks de los use cases
      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);

      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'updated',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalled();
    });

    it('should set finalized_ok status for Live validation result', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
      };
      const scanId = 'scan-123';
      const step = 'cnb-liveness';
      const isSuccess = true;
      const validationResult = {
        serviceLivenessResult: true,
        serviceResultLog: 'Live',
        score: 0.98,
      };

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_OK',
          }),
        }),
        step,
      );
    });

    it('should set finalized_ok status for Positive validation result', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
      };
      const scanId = 'scan-123';
      const step = 'cnb-facial';
      const isSuccess = true;
      const validationResult = {
        serviceFacialAuthenticationResult: true,
        serviceResultLog: 'Positive',
        score: 0.85,
      };

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'SUCCESS',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-facial',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_OK',
          }),
        }),
        step,
      );
    });

    it('should set finalized_fail status for non-Live validation result', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
      };
      const scanId = 'scan-123';
      const step = 'cnb-liveness';
      const isSuccess = false;
      const validationResult = {
        serviceLivenessResult: false,
        serviceResultLog: 'Not Live',
        score: 0.3,
      };

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'FAILED',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-liveness',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_FAIL',
          }),
        }),
        step,
      );
    });

    it('should set finalized_fail status for non-Positive validation result', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
      };
      const scanId = 'scan-123';
      const step = 'cnb-facial';
      const isSuccess = false;
      const validationResult = {
        serviceFacialAuthenticationResult: false,
        serviceResultLog: 'Negative',
        score: 0.3,
      };

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'FAILED',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'cnb-facial',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_FAIL',
          }),
        }),
        step,
      );
    });

    it('should set finalized_fail status for unknown result structure', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session-abc',
        userId: 'user-123',
      };
      const scanId = 'scan-123';
      const step = 'unknown-step';
      const isSuccess = false;
      const validationResult = {
        someOtherProperty: true,
        serviceResultLog: 'Unknown',
      };

      mockGetOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'IN_PROGRESS',
        sessionId: 'session-abc',
        securitySeed: 'seed',
        identityId: 'id123',
        onbType: 'type',
        data: {},
        successSteps: [],
        failureSteps: [],
        requiredSteps: [],
        optionalSteps: [],
      } as any);
      mockUpdateOnboardingStateUseCase.execute.mockResolvedValue({
        status: 'FAILED',
        successSteps: [],
        requiredSteps: [],
        optionalSteps: [],
        failureSteps: [],
        step: 'unknown-step',
        identityId: 'id123',
        data: {},
      } as any);

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockUpdateOnboardingStateUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            statusResultValidation: 'FINALIZED_FAIL',
          }),
        }),
        step,
      );
    });

    it('should not update onboarding state when sessionId is missing', async () => {
      // Arrange
      const trackingInfo = {
        userId: 'user-123',
        trackingId: 'tracking-456',
        requestId: 'request-789',
      };
      const scanId = 'a797276b-b13b-44d4-9fa2-5b4feb6f9ec9';
      const step = 'CNBLiveness';
      const isSuccess = true;
      const validationResult = {
        serviceLivenessResult: true,
        serviceResultLog: 'Live',
        score: 0.98,
      };

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(onboardingClientMock.getOnboardingState).not.toHaveBeenCalled();
      expect(onboardingClientMock.updateOnboardingState).not.toHaveBeenCalled();
    });

    it('should handle error when getOnboardingState fails', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: '12345',
        userId: 'user123',
      };
      const scanId = 'scan123';
      const step = 'LIVENESS';
      const isSuccess = true;
      const validationResult = {
        serviceResult: 'LIVE',
        serviceResultLog: 'Live',
        score: 0.98,
      };

      mockGetOnboardingStateUseCase.execute.mockRejectedValue(
        new Error('Failed to get onboarding state'),
      );

      // Act
      await (service as any).processOnboardingState(
        trackingInfo,
        scanId,
        step,
        isSuccess,
        validationResult,
      );

      // Assert
      expect(mockGetOnboardingStateUseCase.execute).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting onboarding state'),
        expect.any(Error),
      );
      expect(mockUpdateOnboardingStateUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle general errors during processOnboardingState execution', async () => {
      // Arrange
      const trackingInfo = {
        sessionId: 'session123',
        userId: 'user123',
      };
      const scanId = 'scan123';
      const step = 'LIVENESS';
      const isSuccess = true;
      const validationResult = {
        details: {
          serviceResultLog: 'Live',
        },
      };

      // Simulate a general error (not from getOnboardingState or updateOnboardingState)
      mockGetOnboardingStateUseCase.execute.mockImplementation(() => {
        throw new Error('Unexpected general error');
      });

      // Act & Assert (shouldn't throw but should log the error)
      await expect(
        (service as any).processOnboardingState(
          trackingInfo,
          scanId,
          step,
          isSuccess,
          validationResult,
        ),
      ).resolves.not.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting onboarding state: Unexpected general error',
        expect.any(Error),
      );
    });
  });

  describe('getServiceResultLog', () => {
    it('should get serviceResultLog from details structure', () => {
      const result = {
        details: {
          serviceResultLog: 'Live',
        },
      };
      expect((service as any).isValidResult(result, 'liveness')).toBe(true);
    });

    it('should get serviceResultLog from root structure', () => {
      const result = {
        details: {
          serviceResultLog: 'Positive',
        },
      };
      expect((service as any).isValidResult(result, 'facial')).toBe(true);
    });

    it('should return false when no serviceResultLog is found', () => {
      const result = {
        otherProperty: 'value',
      };
      expect((service as any).isValidResult(result, 'liveness')).toBe(false);
    });
  });

  describe('isValidResult', () => {
    it('should return true for valid liveness result with correct structure', () => {
      const result = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-01T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Live',
          serviceTime: '449',
          serviceTransactionId: '0472015b-db28-41df-9187-cbde882d7c36',
          serviceLivenessResult: 3,
        },
      };
      expect((service as any).isValidResult(result, 'liveness')).toBe(true);
    });

    it('should return true for valid facial result with correct structure', () => {
      const result = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-02T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Positive',
          serviceTime: '485',
          serviceTransactionId: 'ded700b2-a196-475a-bff5-0f8f79021c53',
          serviceFacialAuthenticationHash:
            '9B3A5E87445E0A3895AB950896888BF9909B2374328587A8DD8D6F9B91B019735D9DFC87652257E230FD1F8298A2E60B6DFFF86A04BB9EFA4769A65612761728',
          serviceFacialAuthenticationResult: 3,
          serviceFacialSimilarityResult: 1.0,
        },
      };
      expect((service as any).isValidResult(result, 'facial')).toBe(true);
    });

    it('should return false for invalid liveness result', () => {
      const result = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-01T12:00:00Z',
        details: {
          serviceResultCode: 0,
          serviceResultLog: 'Not Live',
          serviceTime: '449',
          serviceTransactionId: '0472015b-db28-41df-9187-cbde882d7c36',
          serviceLivenessResult: 1,
        },
      };
      expect((service as any).isValidResult(result, 'liveness')).toBe(false);
    });

    it('should return false for missing details', () => {
      const result = {
        success: true,
        status: 'OK',
        timestamp: '2023-01-01T12:00:00Z',
        // No details property
      };
      expect((service as any).isValidResult(result, 'liveness')).toBe(false);
    });

    it('should return false for unsupported validation type', () => {
      // Arrange
      const validationResult = {
        details: {
          serviceResultLog: 'Some result',
        },
      };

      // Act - use any string that's not 'liveness' or 'facial'
      const result = (service as any).isValidResult(
        validationResult,
        'unsupported' as any,
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
