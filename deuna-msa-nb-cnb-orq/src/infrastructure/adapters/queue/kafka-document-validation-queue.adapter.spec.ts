import { Test, TestingModule } from '@nestjs/testing';
import { KafkaDocumentValidationQueueAdapter } from './kafka-document-validation-queue.adapter';
import { ClientKafka } from '@nestjs/microservices';
import { Logger } from '@deuna/tl-logger-nd';
import { of } from 'rxjs';

jest.mock('@deuna/tl-logger-nd');

describe('KafkaDocumentValidationQueueAdapter', () => {
  let adapter: KafkaDocumentValidationQueueAdapter;
  let kafkaClient: ClientKafka;

  const mockKafkaClient = {
    emit: jest.fn().mockReturnValue(of({})),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaDocumentValidationQueueAdapter,
        {
          provide: 'KAFKA_SERVICE',
          useValue: mockKafkaClient,
        },
        Logger,
      ],
    }).compile();

    adapter = module.get<KafkaDocumentValidationQueueAdapter>(
      KafkaDocumentValidationQueueAdapter,
    );
    kafkaClient = module.get<ClientKafka>('KAFKA_SERVICE');
  });

  describe('publishDocumentValidationRequest', () => {
    it('should emit a message to Kafka with the correct data', async () => {
      // Arrange
      const testData = {
        scanReference: 'test-scan-reference',
        type: 'cnb-document',
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        onboardingSessionId: 'test-onboarding-session-id',
      };

      // Act
      await adapter.publishDocumentValidationRequest(testData);

      // Assert
      expect(kafkaClient.emit).toHaveBeenCalledWith('cnb.document.validation', {
        ...testData,
      });
      expect(kafkaClient.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when emitting message fails', async () => {
      // Arrange
      const testData = {
        scanReference: 'test-scan-reference',
        type: 'cnb-document',
        sessionId: 'test-session-id',
        trackingId: 'test-tracking-id',
        requestId: 'test-request-id',
        onboardingSessionId: 'test-onboarding-session-id',
      };

      const mockError = new Error('Kafka error');
      (kafkaClient.emit as jest.Mock).mockReturnValueOnce({
        toPromise: jest.fn().mockRejectedValue(mockError),
      });

      // Act & Assert
      await expect(
        adapter.publishDocumentValidationRequest(testData),
      ).rejects.toThrow();
    });
  });
});
