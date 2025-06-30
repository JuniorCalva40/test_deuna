import { Test, TestingModule } from '@nestjs/testing';
import {
  CNB_QUEUE_PORT,
  CnbQueuePort,
} from '../../ports/out/queue/cnb-queue.port';
import { CnbStatusRequestDto } from '../../dto/cnb-status-request.dto';
import { Logger } from '@deuna/tl-logger-nd';
import { PublishCnbConfigQueueUseCase } from './public-cnb-config-queue.use-case';

describe('PublishCnbConfigQueueUseCase', () => {
  let useCase: PublishCnbConfigQueueUseCase;
  let cnbQueuePortMock: jest.Mocked<CnbQueuePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    cnbQueuePortMock = {
      publishConfigCnb: jest.fn(),
    } as unknown as jest.Mocked<CnbQueuePort>;

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishCnbConfigQueueUseCase,
        { provide: CNB_QUEUE_PORT, useValue: cnbQueuePortMock },
        { provide: Logger, useValue: loggerMock },
      ],
    }).compile();

    useCase = module.get<PublishCnbConfigQueueUseCase>(
      PublishCnbConfigQueueUseCase,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  describe('execute', () => {
    it('should publish config successfully', async () => {
      // Arrange
      const config: CnbStatusRequestDto = {
        commercialName: 'LABORATORIOS GUTIERREZ',
        establishmentType: 'MAT',
        fullAddress:
          'PICHINCHA / QUITO / IÑAQUITO / JORGE DROM 9-14 Y AV. GASPAR DE VILLAROEL',
        status: 'ABIERTO',
        establishmentNumber: '001',
        headquarters: true,
        isBilling: true,
        nodeId: 'identifi44343',
        typeClient: 'PERSONA NATURAL',
        latitude: '123',
        longitude: '123',
        referenceTransaction: '123',
      } as CnbStatusRequestDto;
      cnbQueuePortMock.publishConfigCnb.mockResolvedValue();

      // Act
      await useCase.execute(config);

      // Assert
      expect(cnbQueuePortMock.publishConfigCnb).toHaveBeenCalledWith(config);
      expect(cnbQueuePortMock.publishConfigCnb).toHaveBeenCalledTimes(1);
    });

    it('should handle errors from queue port', async () => {
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
        latitude: '123',
        longitude: '123',
      } as CnbStatusRequestDto;
      const expectedError = new Error('Queue connection error');
      cnbQueuePortMock.publishConfigCnb.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(config)).rejects.toThrow(
        `Error publishing validation requests: ${expectedError.message}`,
      );
    });
  });
});
