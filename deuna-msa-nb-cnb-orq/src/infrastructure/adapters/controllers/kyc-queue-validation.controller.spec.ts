import { Test, TestingModule } from '@nestjs/testing';
import { KycQueueValidationController } from './kyc-queue-validation.controller';
import { KycValidationService } from '@src/application/services/kyc-validation.service';
import { KafkaContext } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';

describe('KycQueueValidationController', () => {
  let controller: KycQueueValidationController;
  let kycValidationServiceMock: jest.Mocked<KycValidationService>;
  let loggerMock: jest.Mocked<Logger>;

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

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KycQueueValidationController],
      providers: [
        {
          provide: KycValidationService,
          useValue: kycValidationServiceMock,
        },
      ],
    }).compile();

    controller = module.get<KycQueueValidationController>(
      KycQueueValidationController,
    );

    (controller as any).logger = loggerMock;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log initialization message', async () => {
      // Act
      controller.onModuleInit();

      // Assert
      expect(loggerMock.log).toHaveBeenCalledWith(
        'KycQueueValidationController initialized. Waiting for messages in the cnb.kyc.queue topic...',
      );
    });
  });

  describe('handleValidationRequest', () => {
    it('should process validation message successfully', async () => {
      // Arrange
      const message = {
        scanId: 'test-scan-id',
        validationType: 'liveness',
      };

      const kafkaContextMock = {
        getTopic: jest.fn().mockReturnValue('test-topic'),
        getPartition: jest.fn().mockReturnValue(0),
        getMessage: jest.fn().mockReturnValue({ offset: '100' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn().mockResolvedValue(undefined),
        }),
      } as unknown as KafkaContext;

      kycValidationServiceMock.processValidationMessage.mockResolvedValue();

      // Act
      await controller.handleValidationRequest(message, kafkaContextMock);

      // Assert
      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Topic: test-topic, Partition: 0, Offset: 100`,
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Mensaje procesado exitosamente. Topic: test-topic, Partition: 0, Offset: 100`,
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [{ topic: 'test-topic', partition: 0, offset: '101' }],
      );
    });

    it('should handle and log errors, commit offset, and re-throw', async () => {
      // Arrange
      const message = {
        scanId: 'test-scan-id',
        validationType: 'liveness',
      };

      const kafkaContextMock = {
        getTopic: jest.fn().mockReturnValue('test-topic'),
        getPartition: jest.fn().mockReturnValue(0),
        getMessage: jest.fn().mockReturnValue({ offset: '100' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn().mockResolvedValue(undefined),
        }),
      } as unknown as KafkaContext;

      const expectedError = new Error('Validation processing error');
      kycValidationServiceMock.processValidationMessage.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(
        controller.handleValidationRequest(message, kafkaContextMock),
      ).rejects.toThrow(expectedError);

      expect(
        kycValidationServiceMock.processValidationMessage,
      ).toHaveBeenCalledWith(message);
      expect(loggerMock.log).toHaveBeenCalledWith(
        `Topic: test-topic, Partition: 0, Offset: 100`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error processing KYC validation message:',
        expectedError,
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [{ topic: 'test-topic', partition: 0, offset: '101' }],
      );
    });

    it('should handle invalid message format', async () => {
      // Arrange
      const invalidMessage = {
        // Missing required fields
        someField: 'test',
      };

      const kafkaContextMock = {
        getTopic: jest.fn().mockReturnValue('test-topic'),
        getPartition: jest.fn().mockReturnValue(0),
        getMessage: jest.fn().mockReturnValue({ offset: '100' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn().mockResolvedValue(undefined),
        }),
      } as unknown as KafkaContext;

      const expectedError = new Error('Invalid message format');
      kycValidationServiceMock.processValidationMessage.mockRejectedValue(
        expectedError,
      );

      // Act & Assert
      await expect(
        controller.handleValidationRequest(invalidMessage, kafkaContextMock),
      ).rejects.toThrow(expectedError);

      expect(loggerMock.log).toHaveBeenCalledWith(
        `Topic: test-topic, Partition: 0, Offset: 100`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error processing KYC validation message:',
        expectedError,
      );
      expect(kafkaContextMock.getConsumer().commitOffsets).toHaveBeenCalledWith(
        [{ topic: 'test-topic', partition: 0, offset: '101' }],
      );
    });
  });
});
