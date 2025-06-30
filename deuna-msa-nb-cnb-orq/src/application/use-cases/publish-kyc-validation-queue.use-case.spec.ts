import { Test, TestingModule } from '@nestjs/testing';
import { PublishKycValidationQueueUseCase } from './publish-kyc-validation-queue.use-case';
import {
  KYC_QUEUE_PORT,
  KycQueuePort,
} from '../ports/out/queue/kyc-queue.port';
import { TrackingInfoDto } from '../../infrastructure/constants/common';
import { Logger } from '@deuna/tl-logger-nd';

jest.mock('@src/domain/utils/validator-tracking-headers-api', () => ({
  validateTrackingHeadersApi: jest.fn(),
}));

import { validateTrackingHeadersApi } from '@src/domain/utils/validator-tracking-headers-api';

describe('PublishKycValidationQueueUseCase', () => {
  let useCase: PublishKycValidationQueueUseCase;
  let kycQueuePortMock: jest.Mocked<KycQueuePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    kycQueuePortMock = {
      publishValidationRequest: jest.fn(),
    } as unknown as jest.Mocked<KycQueuePort>;

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishKycValidationQueueUseCase,
        {
          provide: KYC_QUEUE_PORT,
          useValue: kycQueuePortMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    useCase = module.get<PublishKycValidationQueueUseCase>(
      PublishKycValidationQueueUseCase,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should publish validation requests successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const trackingInfo: TrackingInfoDto = {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      kycQueuePortMock.publishValidationRequest.mockResolvedValue();

      // Act
      await useCase.execute(scanId, trackingInfo);

      // Assert
      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Starting KYC Orchestrator Request -',
        trackingInfo.sessionId,
        trackingInfo.trackingId,
        trackingInfo.requestId,
      );

      expect(kycQueuePortMock.publishValidationRequest).toHaveBeenCalledTimes(
        2,
      );
      expect(kycQueuePortMock.publishValidationRequest).toHaveBeenCalledWith(
        scanId,
        'liveness',
      );
      expect(kycQueuePortMock.publishValidationRequest).toHaveBeenCalledWith(
        scanId,
        'facial',
      );
    });

    it('should handle errors from queue port', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const trackingInfo: TrackingInfoDto = {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      const expectedError = new Error('Queue connection error');
      kycQueuePortMock.publishValidationRequest.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(useCase.execute(scanId, trackingInfo)).rejects.toThrow(
        `Error publishing validation requests: ${expectedError.message}`,
      );

      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Starting KYC Orchestrator Request -',
        trackingInfo.sessionId,
        trackingInfo.trackingId,
        trackingInfo.requestId,
      );

      expect(kycQueuePortMock.publishValidationRequest).toHaveBeenCalledWith(
        scanId,
        expect.any(String),
      );
    });

    it('should handle missing tracking info', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const incompleteTrackingInfo: TrackingInfoDto = {
        sessionId: '',
        trackingId: '',
        requestId: '',
      };

      // Act
      await useCase.execute(scanId, incompleteTrackingInfo);

      // Assert
      expect(validateTrackingHeadersApi).toHaveBeenCalledWith(
        loggerMock,
        'Starting KYC Orchestrator Request -',
        '',
        '',
        '',
      );

      expect(kycQueuePortMock.publishValidationRequest).toHaveBeenCalledTimes(
        2,
      );
    });

    it('should publish validation requests in parallel', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const trackingInfo: TrackingInfoDto = {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      // Simulate a delay in the first publication
      let livenessResolved = false;
      kycQueuePortMock.publishValidationRequest.mockImplementation(
        (id, type) => {
          if (type === 'liveness') {
            return new Promise((resolve) => {
              setTimeout(() => {
                livenessResolved = true;
                resolve();
              }, 50);
            });
          }
          return Promise.resolve();
        },
      );

      // Act
      const executePromise = useCase.execute(scanId, trackingInfo);

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(kycQueuePortMock.publishValidationRequest).toHaveBeenCalledWith(
        scanId,
        'facial',
      );
      expect(livenessResolved).toBe(false);

      await executePromise;
    });
  });
});
