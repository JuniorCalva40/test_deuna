import { Test, TestingModule } from '@nestjs/testing';
import { KycBiometricValidationService } from './kyc-biometric-validation.service';
import { KYC_STORAGE_PORT } from '../ports/out/storage/kyc-storage.port';
import { KYC_QUEUE_PORT } from '../ports/out/queue/kyc-queue.port';
import { Logger } from '@deuna/tl-logger-nd';
import { FacialValidationDto } from '../dto/facial-validation.dto';
import { LivenessValidationDto } from '../dto/liveness-validation.dto';
import { SaveKycValidationUseCase } from '../use-cases/save-kyc-validation.use-case';
import { PublishKycValidationQueueUseCase } from '../use-cases/publish-kyc-validation-queue.use-case';
import { validateKycData } from '@src/domain/utils/kyc-validator';

jest.mock('../use-cases/save-kyc-validation.use-case');
jest.mock('../use-cases/publish-kyc-validation-queue.use-case');
jest.mock('@src/domain/utils/kyc-validator', () => ({
  validateKycData: jest.fn(),
}));

describe('KycBiometricValidationService', () => {
  let service: KycBiometricValidationService;
  let storagePortMock: any;
  let queuePortMock: any;
  let loggerMock: any;
  let saveKycValidationUseCaseMock: jest.Mocked<SaveKycValidationUseCase>;
  let publishKycValidationQueueUseCaseMock: jest.Mocked<PublishKycValidationQueueUseCase>;

  beforeEach(async () => {
    storagePortMock = {
      saveKycRequest: jest.fn(),
      saveValidationResult: jest.fn(),
      getValidationResults: jest.fn(),
    };

    queuePortMock = {
      publishToKycValidationQueue: jest.fn(),
    };

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    jest.clearAllMocks();
    (SaveKycValidationUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(undefined),
    }));

    (PublishKycValidationQueueUseCase as jest.Mock).mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue(undefined),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycBiometricValidationService,
        {
          provide: KYC_STORAGE_PORT,
          useValue: storagePortMock,
        },
        {
          provide: KYC_QUEUE_PORT,
          useValue: queuePortMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    service = module.get<KycBiometricValidationService>(
      KycBiometricValidationService,
    );

    saveKycValidationUseCaseMock = (service as any).saveKycValidationUseCase;
    publishKycValidationQueueUseCaseMock = (service as any)
      .publishKycValidationQueueUseCase;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startValidation', () => {
    beforeEach(() => {
      // Limpiar el mock de validateKycData antes de cada prueba
      (validateKycData as jest.Mock).mockClear();
    });

    it('should save kyc request and publish to validation queue', async () => {
      // Arrange
      const facialValidation: FacialValidationDto = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
        documentType: 'DNI',
      };
      const livenessValidation: LivenessValidationDto = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };
      const onboardingSessionId = 'test-onboarding-session-id';
      const sessionId = 'test-session-id';
      const trackingId = 'test-tracking-id';

      // Act
      const result = await service.startBiometricValidation(
        facialValidation,
        livenessValidation,
        onboardingSessionId,
        sessionId,
        trackingId,
      );

      // Assert
      expect(validateKycData).toHaveBeenCalledWith(
        facialValidation,
        livenessValidation,
        onboardingSessionId,
        sessionId,
        trackingId,
      );

      expect(saveKycValidationUseCaseMock.execute).toHaveBeenCalledWith(
        expect.any(String), // finalScanId es generado con uuidv4
        expect.objectContaining({
          facialValidation,
          livenessValidation,
          trackingInfo: expect.objectContaining({
            sessionId,
            trackingId,
          }),
          onboardingSessionId,
        }),
      );

      expect(publishKycValidationQueueUseCaseMock.execute).toHaveBeenCalledWith(
        expect.any(String), // finalScanId
        expect.objectContaining({
          sessionId,
          trackingId,
        }),
      );

      expect(result).toEqual({ scanId: expect.any(String) });
    });

    it('should throw error if saveKycValidationUseCase fails', async () => {
      // Arrange
      const facialValidation: FacialValidationDto = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
        documentType: 'DNI',
      };
      const livenessValidation: LivenessValidationDto = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };
      const onboardingSessionId = 'test-onboarding-session-id';
      const sessionId = 'test-session-id';
      const trackingId = 'test-tracking-id';

      const errorMessage = 'Failed to save KYC request';
      saveKycValidationUseCaseMock.execute.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        service.startBiometricValidation(
          facialValidation,
          livenessValidation,
          onboardingSessionId,
          sessionId,
          trackingId,
        ),
      ).rejects.toThrow(`Error al iniciar la validación KYC: ${errorMessage}`);

      expect(validateKycData).toHaveBeenCalled();
      expect(
        publishKycValidationQueueUseCaseMock.execute,
      ).not.toHaveBeenCalled();
    });

    it('should throw error if publishKycValidationQueueUseCase fails', async () => {
      // Arrange
      const facialValidation: FacialValidationDto = {
        documentImage: 'base64-document-image',
        selfieImage: 'base64-selfie-image',
        documentType: 'DNI',
      };
      const livenessValidation: LivenessValidationDto = {
        selfieImage: 'base64-selfie-image',
        livenessData: 'base64-liveness-data',
      };
      const onboardingSessionId = 'test-onboarding-session-id';
      const sessionId = 'test-session-id';
      const trackingId = 'test-tracking-id';

      const errorMessage = 'Failed to publish to queue';
      publishKycValidationQueueUseCaseMock.execute.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      // Act & Assert
      await expect(
        service.startBiometricValidation(
          facialValidation,
          livenessValidation,
          onboardingSessionId,
          sessionId,
          trackingId,
        ),
      ).rejects.toThrow(`Error al iniciar la validación KYC: ${errorMessage}`);

      expect(validateKycData).toHaveBeenCalled();
      expect(saveKycValidationUseCaseMock.execute).toHaveBeenCalled();
    });
  });
});
