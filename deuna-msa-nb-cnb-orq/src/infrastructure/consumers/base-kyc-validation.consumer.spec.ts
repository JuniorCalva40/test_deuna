import { Test, TestingModule } from '@nestjs/testing';
import { BaseKycValidationConsumer } from './base-kyc-validation.consumer';
import { KycValidationService } from '@src/application/services/kyc-validation.service';
import { Logger } from '@nestjs/common';
import { KafkaContext, MessagePattern } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';

@Injectable()
class TestKycValidationConsumer extends BaseKycValidationConsumer {
  constructor(kycValidationService: KycValidationService) {
    super(kycValidationService, 'TestConsumer', 'test.topic');
  }

  @MessagePattern('test.topic')
  async handleTestMessage(message: any, context: KafkaContext): Promise<void> {
    return this.handleMessage(message, context);
  }
}

describe('BaseKycValidationConsumer', () => {
  let consumer: TestKycValidationConsumer;
  let kycValidationServiceMock: jest.Mocked<KycValidationService>;
  let loggerMock: jest.Mocked<Logger>;
  let kafkaContextMock: jest.Mocked<KafkaContext>;

  beforeEach(async () => {
    kycValidationServiceMock = {
      processValidationMessage: jest.fn(),
    } as unknown as jest.Mocked<KycValidationService>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    kafkaContextMock = {
      getTopic: jest.fn().mockReturnValue('test.topic'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn().mockResolvedValue(undefined),
      }),
    } as unknown as jest.Mocked<KafkaContext>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestKycValidationConsumer,
        {
          provide: KycValidationService,
          useValue: kycValidationServiceMock,
        },
      ],
    }).compile();

    consumer = module.get<TestKycValidationConsumer>(TestKycValidationConsumer);
    (consumer as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log initialization message with correct topic name', () => {
      // Act
      consumer.onModuleInit();

      // Assert
      expect(loggerMock.log).toHaveBeenCalledWith(
        'TestKycValidationConsumer initialized. Listening for messages in the test.topic topic',
      );
    });
  });

  describe('handleMessage', () => {
    it('should process message successfully', async () => {
      // Arrange
      const message = {
        scanId: 'test-scan-id',
        validationType: 'liveness',
      };

      kycValidationServiceMock.processValidationMessage.mockResolvedValue(
        undefined,
      );

      // Act
      await consumer.handleTestMessage(message, kafkaContextMock);

      // Assert
      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        'Mensaje recibido:',
        message,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Topic: test.topic, Partition: 0, Offset: 100',
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'test.topic',
            partition: 0,
            offset: '101',
          },
        ],
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Mensaje procesado exitosamente. Topic: test.topic, Partition: 0, Offset: 100',
      );
    });

    it('should handle and log errors, commit offset, and re-throw', async () => {
      // Arrange
      const message = {
        scanId: 'test-scan-id',
        validationType: 'liveness',
      };
      const expectedError = new Error('Validation processing error');

      kycValidationServiceMock.processValidationMessage.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(
        consumer.handleTestMessage(message, kafkaContextMock),
      ).rejects.toThrow(expectedError);

      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error processing KYC validation message:',
        expectedError,
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'test.topic',
            partition: 0,
            offset: '101',
          },
        ],
      );
    });

    it('should handle invalid message format', async () => {
      // Arrange
      const invalidMessage = {
        someField: 'test',
      };

      kycValidationServiceMock.processValidationMessage.mockRejectedValue(
        new Error('Invalid message format'),
      );

      // Act & Assert
      await expect(
        consumer.handleTestMessage(invalidMessage, kafkaContextMock),
      ).rejects.toThrow('Invalid message format');

      expect(loggerMock.debug).toHaveBeenCalledWith(
        'Mensaje recibido:',
        invalidMessage,
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'test.topic',
            partition: 0,
            offset: '101',
          },
        ],
      );
    });

    it('should handle Kafka context errors', async () => {
      // Arrange
      const message = {
        scanId: 'test-scan-id',
        validationType: 'liveness',
      };
      const kafkaError = new Error('Kafka commit error');

      const errorKafkaContextMock = {
        ...kafkaContextMock,
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn().mockRejectedValue(kafkaError),
        }),
      } as unknown as jest.Mocked<KafkaContext>;

      kycValidationServiceMock.processValidationMessage.mockResolvedValue(
        undefined,
      );

      // Act & Assert
      await expect(
        consumer.handleTestMessage(message, errorKafkaContextMock),
      ).rejects.toThrow(kafkaError);

      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(
        errorKafkaContextMock.getConsumer().commitOffsets,
      ).toHaveBeenCalledWith([
        {
          topic: 'test.topic',
          partition: 0,
          offset: '101',
        },
      ]);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
