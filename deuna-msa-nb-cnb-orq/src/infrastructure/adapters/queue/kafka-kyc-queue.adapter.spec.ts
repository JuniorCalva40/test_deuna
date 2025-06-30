import { Test, TestingModule } from '@nestjs/testing';
import { KafkaKycQueueAdapter } from './kafka-kyc-queue.adapter';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  firstValueFrom: jest.fn(),
}));

describe('KafkaKycQueueAdapter', () => {
  let adapter: KafkaKycQueueAdapter;
  let kafkaClientMock: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    kafkaClientMock = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientKafka>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaKycQueueAdapter,
        {
          provide: 'KAFKA_SERVICE',
          useValue: kafkaClientMock,
        },
      ],
    }).compile();

    adapter = module.get<KafkaKycQueueAdapter>(KafkaKycQueueAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('publishValidationRequest', () => {
    it('should publish liveness validation message successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'liveness';
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const expectedMessage = {
        scanId,
        type,
        timestamp: mockDate.toISOString(),
      };

      kafkaClientMock.emit.mockReturnValue(of({}));
      (firstValueFrom as jest.Mock).mockResolvedValue({});

      // Act
      await adapter.publishValidationRequest(scanId, type);

      // Assert
      expect(kafkaClientMock.emit).toHaveBeenCalledWith(
        'cnb.kyc.queue',
        expectedMessage,
      );
      expect(firstValueFrom).toHaveBeenCalled();
    });

    it('should publish facial validation message successfully', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'facial';
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const expectedMessage = {
        scanId,
        type,
        timestamp: mockDate.toISOString(),
      };

      kafkaClientMock.emit.mockReturnValue(of({}));
      (firstValueFrom as jest.Mock).mockResolvedValue({});

      // Act
      await adapter.publishValidationRequest(scanId, type);

      // Assert
      expect(kafkaClientMock.emit).toHaveBeenCalledWith(
        'cnb.kyc.queue',
        expectedMessage,
      );
      expect(firstValueFrom).toHaveBeenCalled();
    });

    it('should handle Kafka publish errors', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const type = 'liveness';
      const expectedError = new Error('Kafka publish failed');

      kafkaClientMock.emit.mockReturnValue(of({}));
      (firstValueFrom as jest.Mock).mockRejectedValue(expectedError);

      // Act & Assert
      await expect(
        adapter.publishValidationRequest(scanId, type),
      ).rejects.toThrow(expectedError);

      expect(kafkaClientMock.emit).toHaveBeenCalledWith('cnb.kyc.queue', {
        scanId,
        type,
        timestamp: expect.any(String),
      });
    });

    it('should validate message type parameter', async () => {
      // Arrange
      const scanId = 'test-scan-id';
      const invalidType = 'invalid-type' as 'liveness' | 'facial';

      kafkaClientMock.emit.mockReturnValue(of({}));
      (firstValueFrom as jest.Mock).mockResolvedValue({});

      // Act & Assert
      await adapter.publishValidationRequest(scanId, invalidType);

      expect(kafkaClientMock.emit).toHaveBeenCalledWith('cnb.kyc.queue', {
        scanId,
        type: invalidType,
        timestamp: expect.any(String),
      });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
