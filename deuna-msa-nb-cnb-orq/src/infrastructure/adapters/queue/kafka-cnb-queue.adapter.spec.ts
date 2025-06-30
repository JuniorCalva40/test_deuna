import { Test, TestingModule } from '@nestjs/testing';
import { KafkaCnbQueueAdapter } from './kafka-cnb-queue.adapter';
import { ClientKafka } from '@nestjs/microservices';
import { CnbStatusRequestDto } from '@src/application/dto/cnb-status-request.dto';
import { firstValueFrom } from 'rxjs';
import { of } from 'rxjs';

jest.mock('rxjs', () => ({
  ...jest.requireActual('rxjs'),
  firstValueFrom: jest.fn(),
}));

describe('KafkaCnbQueueAdapter', () => {
  let adapter: KafkaCnbQueueAdapter;
  let kafkaClientMock: jest.Mocked<ClientKafka>;

  beforeEach(async () => {
    kafkaClientMock = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientKafka>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaCnbQueueAdapter,
        {
          provide: 'KAFKA_SERVICE',
          useValue: kafkaClientMock,
        },
      ],
    }).compile();

    adapter = module.get<KafkaCnbQueueAdapter>(KafkaCnbQueueAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('publishConfigCnb', () => {
    it('should publish config message successfully', async () => {
      // Arrange
      const config: CnbStatusRequestDto = {
        commercialName: 'LABORATORIOS GUTIERREZ',
        establishmentType: 'MAT',
        fullAddress:
          'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
        status: 'ABIERTO',
        establishmentNumber: '001',
        headquarters: true,
        nodeId: 'identifi44343',
        typeClient: 'PERSONA NATURAL',
        latitude: '123',
        longitude: '123',
        referenceTransaction: '123',
      };
      kafkaClientMock.emit.mockReturnValue(of({}));
      (firstValueFrom as jest.Mock).mockResolvedValue({});

      // Act
      await adapter.publishConfigCnb(config);

      // Assert
      expect(kafkaClientMock.emit).toHaveBeenCalledWith(
        'cnb.cnb.complete',
        config,
      );
      expect(firstValueFrom).toHaveBeenCalled();
    });

    it('should handle Kafka publish errors', async () => {
      // Arrange
      const config: CnbStatusRequestDto = {
        commercialName: 'LABORATORIOS GUTIERREZ',
        establishmentType: 'MAT',
        fullAddress:
          'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
        status: 'ABIERTO',
        establishmentNumber: '001',
        headquarters: true,
        nodeId: 'identifi44343',
        typeClient: 'PERSONA NATURAL',
        latitude: '123',
        longitude: '123',
        referenceTransaction: '123',
      };
      const expectedError = new Error('Kafka publish failed');

      kafkaClientMock.emit.mockReturnValue(of({}));
      (firstValueFrom as jest.Mock).mockRejectedValue(expectedError);

      // Act & Assert
      await expect(adapter.publishConfigCnb(config)).rejects.toThrow(
        expectedError,
      );

      expect(kafkaClientMock.emit).toHaveBeenCalledWith(
        'cnb.cnb.complete',
        config,
      );
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
});
