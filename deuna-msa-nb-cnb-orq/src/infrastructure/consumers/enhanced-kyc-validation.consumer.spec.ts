import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedKycValidationConsumer } from './enhanced-kyc-validation.consumer';
import { KycValidationService } from '@src/application/services/kyc-validation.service';
import { Logger } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';

describe('EnhancedKycValidationConsumer', () => {
  let consumer: EnhancedKycValidationConsumer;
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
      getTopic: jest.fn().mockReturnValue('cnb.kyc.enhanced.queue'),
      getPartition: jest.fn().mockReturnValue(0),
      getMessage: jest.fn().mockReturnValue({ offset: '100' }),
      getConsumer: jest.fn().mockReturnValue({
        commitOffsets: jest.fn().mockResolvedValue(undefined),
      }),
    } as unknown as jest.Mocked<KafkaContext>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnhancedKycValidationConsumer,
        {
          provide: KycValidationService,
          useValue: kycValidationServiceMock,
        },
      ],
    }).compile();

    consumer = module.get<EnhancedKycValidationConsumer>(
      EnhancedKycValidationConsumer,
    );
    (consumer as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(consumer).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log initialization message', () => {
      // Act
      consumer.onModuleInit();

      // Assert
      expect(loggerMock.log).toHaveBeenCalledWith(
        'EnhancedKycValidationConsumer initialized. Listening for messages in the cnb.kyc.enhanced.queue topic',
      );
    });
  });

  describe('handleEnhancedValidationRequest', () => {
    it('should process validation message successfully', async () => {
      // Arrange
      const message = {
        scanId: 'test-scan-id',
        validationType: 'liveness',
      };

      kycValidationServiceMock.processValidationMessage.mockResolvedValue(
        undefined,
      );

      // Act
      await consumer.handleEnhancedValidationRequest(message, kafkaContextMock);

      // Assert
      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(loggerMock.debug).toHaveBeenCalledWith(
        'Mensaje recibido:',
        message,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Topic: cnb.kyc.enhanced.queue, Partition: 0, Offset: 100',
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'cnb.kyc.enhanced.queue',
            partition: 0,
            offset: '101',
          },
        ],
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        'Mensaje procesado exitosamente. Topic: cnb.kyc.enhanced.queue, Partition: 0, Offset: 100',
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
        consumer.handleEnhancedValidationRequest(message, kafkaContextMock),
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
            topic: 'cnb.kyc.enhanced.queue',
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
        consumer.handleEnhancedValidationRequest(
          invalidMessage,
          kafkaContextMock,
        ),
      ).rejects.toThrow('Invalid message format');

      expect(loggerMock.debug).toHaveBeenCalledWith(
        'Mensaje recibido:',
        invalidMessage,
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [
          {
            topic: 'cnb.kyc.enhanced.queue',
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
        consumer.handleEnhancedValidationRequest(
          message,
          errorKafkaContextMock,
        ),
      ).rejects.toThrow(kafkaError);

      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(
        errorKafkaContextMock.getConsumer().commitOffsets,
      ).toHaveBeenCalledWith([
        {
          topic: 'cnb.kyc.enhanced.queue',
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
