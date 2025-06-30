import { Test, TestingModule } from '@nestjs/testing';
import { KycDocumentValidationController } from './kyc-document-validation.controller';
import { KafkaContext } from '@nestjs/microservices';
import { Logger } from '@deuna/tl-logger-nd';
import { DOCUMENT_VALIDATION_PORT } from '@src/domain/constants/injection.constants';
import { DocumentValidationType } from '@src/domain/enums/document-validation-type.enum';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

jest.mock('@deuna/tl-logger-nd');
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('KycDocumentValidationController', () => {
  let controller: KycDocumentValidationController;

  const mockDocumentValidationService = {
    startValidation: jest.fn(),
    getValidationStatus: jest.fn(),
    getValidationData: jest.fn(),
    processDocumentValidationMessage: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'RETRY_DELAY_MS_QUEUE_IDENTITY_DOCUMENT_VALIDATION') return 0;
      return null;
    }),
  };

  const mockKafkaContext = {
    getTopic: jest.fn().mockReturnValue('cnb.document.validation'),
    getPartition: jest.fn().mockReturnValue(0),
    getMessage: jest.fn().mockReturnValue({
      offset: '1',
    }),
    getConsumer: jest.fn().mockReturnValue({
      commitOffsets: jest.fn().mockResolvedValue(undefined),
    }),
  } as unknown as KafkaContext;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycDocumentValidationController],
      providers: [
        {
          provide: DOCUMENT_VALIDATION_PORT,
          useValue: mockDocumentValidationService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        Logger,
      ],
    }).compile();

    controller = module.get<KycDocumentValidationController>(
      KycDocumentValidationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startValidation', () => {
    it('should start validation process', async () => {
      // Arrange
      const dto = {
        onboardingSessionId: 'test-onboarding-id',
        sessionId: 'test-session',
        trackingId: 'test-tracking',
        requestId: 'test-request',
        merchantIdScanReference: 'merchant-123',
        frontsideImage: 'base64-front-image',
        backsideImage: 'base64-back-image',
        country: 'PE',
        idType: DocumentValidationType.DNI,
      };

      const expectedResponse = {
        statusValidation: 'PENDING',
      };

      mockDocumentValidationService.startValidation.mockResolvedValue(
        expectedResponse,
      );

      // Act
      const result = await controller.startValidation(
        dto,
        dto.trackingId,
        dto.sessionId,
        dto.requestId,
      );

      // Assert
      expect(
        mockDocumentValidationService.startValidation,
      ).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResponse);
    });
  });


  describe('handleDocumentValidationMessage', () => {
    it('should process validation message from queue and commit offset', async () => {
      // Arrange
      const message = {
        scanReference: 'test-scan-id',
        type: 'cnb-document',
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      };

      mockDocumentValidationService.processDocumentValidationMessage.mockResolvedValue(
        {
          status: 'DONE',
          data: {
            status: 'APPROVED_VERIFIED',
          },
        },
      );

      // Act
      await controller.handleDocumentValidationMessage(
        message,
        mockKafkaContext,
      );

      // Assert
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalledWith(message, {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      });

      expect(mockKafkaContext.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'cnb.document.validation',
            partition: 0,
            offset: '2',
          },
        ],
      );
    });

    it('should handle missing tracking info in message', async () => {
      // Arrange
      const message = {
        scanReference: 'test-scan-id',
        type: 'cnb-document',
      };

      mockDocumentValidationService.processDocumentValidationMessage.mockResolvedValue(
        {
          status: 'DONE',
        },
      );

      // Mock de UUID
      const mockRequestId = 'generated-request-id';
      uuidv4.mockReturnValue(mockRequestId);

      // Act
      await controller.handleDocumentValidationMessage(
        message,
        mockKafkaContext,
      );

      // Assert
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalledWith(message, {
        sessionId: 'session-not-provided',
        trackingId: 'tracking-not-provided',
        requestId: mockRequestId,
      });
    });

    it('should handle retry status and schedule a retry', async () => {
      // Arrange
      const message = {
        scanReference: 'test-scan-id',
        type: 'cnb-document',
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        retryCount: 0,
      };

      mockDocumentValidationService.processDocumentValidationMessage.mockResolvedValueOnce(
        {
          retry: true,
          status: 'PENDING',
        },
      );

      // Simulate success in the second attempt
      mockDocumentValidationService.processDocumentValidationMessage.mockResolvedValueOnce(
        {
          retry: false,
          status: 'DONE',
        },
      );

      // Mock setTimeout and UUID
      jest.useFakeTimers();
      const mockUuids = ['retry-uuid-1', 'retry-uuid-2', 'retry-uuid-3'];
      let uuidIndex = 0;
      jest.spyOn(global, 'setTimeout');
      uuidv4.mockImplementation(() => mockUuids[uuidIndex++]);

      // Act
      await controller.handleDocumentValidationMessage(
        message,
        mockKafkaContext,
      );

      // Assert
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalledWith(message, expect.any(Object));

      expect(mockKafkaContext.getConsumer().commitOffsets).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalled();

      // Fast-forward time to execute the setTimeout function
      jest.runAllTimers();

      // Verify that the service was called with the retry message
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalledWith(
        {
          ...message,
          requestId: mockUuids[uuidIndex - 1],
          retryCount: 1,
          timestamp: expect.any(String),
        },
        {
          requestId: mockUuids[uuidIndex - 1],
          sessionId: message.sessionId,
          trackingId: message.trackingId,
        },
      );

      // Restore timers and mocks
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should commit offset even when processing fails', async () => {
      // Arrange
      const message = {
        scanReference: 'test-scan-id',
        type: 'cnb-document',
      };

      mockDocumentValidationService.processDocumentValidationMessage.mockRejectedValue(
        new Error('Processing error'),
      );

      // Mock setTimeout
      jest.useFakeTimers();

      // Act
      await controller.handleDocumentValidationMessage(
        message,
        mockKafkaContext,
      );

      // Assert
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalled();
      expect(mockKafkaContext.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'cnb.document.validation',
            partition: 0,
            offset: '2',
          },
        ],
      );

      // Fast-forward time
      jest.runAllTimers();

      // Restore timers
      jest.useRealTimers();
    });

    it('should schedule a new retry when processing fails', async () => {
      // Arrange
      const message = {
        scanReference: 'test-scan-id',
        type: 'cnb-document',
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        retryCount: 1,
      };

      mockDocumentValidationService.processDocumentValidationMessage.mockRejectedValue(
        new Error('Error en procesamiento'),
      );

      // Mock de setTimeout y UUID
      jest.useFakeTimers();
      const mockUuids = ['retry-uuid-1', 'retry-uuid-2', 'retry-uuid-3'];
      let uuidIndex = 0;
      jest.spyOn(global, 'setTimeout');
      uuidv4.mockImplementation(() => mockUuids[uuidIndex++]);

      // Act
      await controller.handleDocumentValidationMessage(
        message,
        mockKafkaContext,
      );

      // Assert
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalledWith(message, {
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
      });

      expect(mockKafkaContext.getConsumer().commitOffsets).toHaveBeenCalled();
      expect(setTimeout).toHaveBeenCalled();

      // Execute the timer to verify that a new execution is attempted
      jest.runAllTimers();

      // Restore
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should handle errors in scheduled retry and schedule another retry', async () => {
      // Arrange
      const message = {
        scanReference: 'test-scan-id',
        type: 'cnb-document',
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        retryCount: 0,
      };

      // Mock service to return retry=true in the first call and throw error in the second
      mockDocumentValidationService.processDocumentValidationMessage.mockResolvedValueOnce(
        {
          retry: true,
          status: 'PENDING',
        },
      );
      mockDocumentValidationService.processDocumentValidationMessage.mockRejectedValueOnce(
        new Error('Error en el reintento'),
      );

      // Mock uuid to ensure predictable IDs
      const mockRetryId = 'retry-uuid-1';
      uuidv4.mockReturnValue(mockRetryId);

      // for verifying that the second setTimeout was called,
      // Simulate the calls to setTimeout
      let timeoutCount = 0;

      // We use spying the real setTimeout
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation((callback: any) => {
          // We execute the callback immediately
          timeoutCount++;
          if (timeoutCount === 1) {
            // We execute the callback immediately
            callback();
          }
          return null as any; // This is only to satisfy TypeScript
        });

      // Act
      await controller.handleDocumentValidationMessage(
        message,
        mockKafkaContext,
      );

      // Assert
      expect(
        mockDocumentValidationService.processDocumentValidationMessage,
      ).toHaveBeenCalledWith(message, expect.any(Object));

      // Verify that setTimeout was called twice (original retry + retry after error)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2);

      // Clean up
      setTimeoutSpy.mockRestore();
      jest.restoreAllMocks();
    });
  });
});
