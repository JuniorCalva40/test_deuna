import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@deuna/tl-logger-nd';
import { PublishDocumentValidationQueueUseCase } from './publish-document-validation-queue.use-case';
import {
  DOCUMENT_VALIDATION_QUEUE_PORT,
  DocumentValidationQueuePort,
  DocumentValidationQueueData,
} from '../../ports/out/queue/document-validation-queue.port';

jest.mock('@deuna/tl-logger-nd');

describe('PublishDocumentValidationQueueUseCase', () => {
  let useCase: PublishDocumentValidationQueueUseCase;
  let documentValidationQueuePort: DocumentValidationQueuePort;

  const mockDocumentValidationQueuePort = {
    publishDocumentValidationRequest: jest.fn(),
  };

  const testQueueData: DocumentValidationQueueData = {
    scanReference: 'test-scan-reference',
    type: 'cnb-document',
    sessionId: 'test-session-id',
    trackingId: 'test-tracking-id',
    requestId: 'test-request-id',
    onboardingSessionId: 'test-onboarding-session-id',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishDocumentValidationQueueUseCase,
        {
          provide: DOCUMENT_VALIDATION_QUEUE_PORT,
          useValue: mockDocumentValidationQueuePort,
        },
        Logger,
      ],
    }).compile();

    useCase = module.get<PublishDocumentValidationQueueUseCase>(
      PublishDocumentValidationQueueUseCase,
    );
    documentValidationQueuePort = module.get<DocumentValidationQueuePort>(
      DOCUMENT_VALIDATION_QUEUE_PORT,
    );
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should publish document validation request to queue successfully', async () => {
      // Arrange
      mockDocumentValidationQueuePort.publishDocumentValidationRequest.mockResolvedValue(
        undefined,
      );

      // Act
      await useCase.execute(testQueueData);

      // Assert
      expect(
        documentValidationQueuePort.publishDocumentValidationRequest,
      ).toHaveBeenCalledTimes(1);
      expect(
        documentValidationQueuePort.publishDocumentValidationRequest,
      ).toHaveBeenCalledWith(testQueueData);
    });

    it('should throw an error when queue publishing fails', async () => {
      // Arrange
      const error = new Error('Queue connection failed');
      mockDocumentValidationQueuePort.publishDocumentValidationRequest.mockRejectedValue(
        error,
      );

      // Act & Assert
      await expect(useCase.execute(testQueueData)).rejects.toThrow(
        `Error publishing document validation request: ${error.message}`,
      );
      expect(
        documentValidationQueuePort.publishDocumentValidationRequest,
      ).toHaveBeenCalledTimes(1);
      expect(
        documentValidationQueuePort.publishDocumentValidationRequest,
      ).toHaveBeenCalledWith(testQueueData);
    });
  });
});
