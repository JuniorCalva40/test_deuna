import { Test, TestingModule } from '@nestjs/testing';
import { GetKycDataUseCase } from './get-kyc-data.use-case';
import { KYC_STORAGE_PORT } from '../../ports/out/storage/kyc-storage.port';
import { Logger } from '@deuna/tl-logger-nd';
import { KycRequestDto } from '../../dto/kyc-request.dto';

describe('GetKycDataUseCase', () => {
  let useCase: GetKycDataUseCase;
  let storagePortMock: any;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    storagePortMock = {
      getKycData: jest.fn(),
    };

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetKycDataUseCase,
        {
          provide: KYC_STORAGE_PORT,
          useValue: storagePortMock,
        },
      ],
    }).compile();

    useCase = module.get<GetKycDataUseCase>(GetKycDataUseCase);

    (useCase as any).logger = loggerMock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should return kyc data for valid scanId', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const kycData: KycRequestDto = {
        scanId: 'test-scan-id',
        facialValidation: {
          documentImage: 'test-document-image',
          selfieImage: 'test-selfie-image',
          documentType: 'DNI',
        },
        livenessValidation: {
          selfieImage: 'test-selfie-image',
          livenessData: 'test-liveness-data',
        },
        trackingInfo: {
          sessionId: 'test-session-id',
          trackingId: 'test-tracking-id',
          requestId: 'test-request-id',
        },
        onboardingSessionId: 'test-onboarding-session-id',
      };

      storagePortMock.getKycData.mockResolvedValue(kycData);

      // Act
      const result = await useCase.execute(scanId);

      // Assert
      expect(storagePortMock.getKycData).toHaveBeenCalledWith(scanId);
      expect(result).toEqual(kycData);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting KYC data for scanId: ${scanId}`,
      );
    });

    it('should propagate error if storage port fails', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const expectedError = new Error('Failed to get KYC data');

      storagePortMock.getKycData.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(scanId)).rejects.toThrow(expectedError);
      expect(storagePortMock.getKycData).toHaveBeenCalledWith(scanId);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting KYC data for scanId: ${scanId}`,
      );
    });

    it('should handle case when kyc data is not found', async () => {
      // Arrange
      const scanId = 'non-existent-scan-id';

      storagePortMock.getKycData.mockResolvedValue(null);

      // Act
      const result = await useCase.execute(scanId);

      // Assert
      expect(storagePortMock.getKycData).toHaveBeenCalledWith(scanId);
      expect(result).toBeNull();
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Getting KYC data for scanId: ${scanId}`,
      );
    });
  });
});
