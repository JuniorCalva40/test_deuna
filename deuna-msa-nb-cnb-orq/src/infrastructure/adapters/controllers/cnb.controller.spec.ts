import { Test, TestingModule } from '@nestjs/testing';
import { CnbController } from './cnb.controller';
import { CnbServicePort } from '@src/application/ports/in/services/cnb.service.port';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbStatusRequestDto } from '@src/application/dto/cnb-status-request.dto';
import { KafkaContext } from '@nestjs/microservices';
import { CnbStatusResponseDto } from '@src/application/dto/cnb-status-response';
import { ConfigurationNb005Dto } from '../../../application/dto/configuration/configuration-nb005.dto';

describe('CnbController', () => {
  let controller: CnbController;
  let cnbServiceMock: jest.Mocked<CnbServicePort>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(async () => {
    cnbServiceMock = {
      completeOnboadingCnb: jest.fn(),
      sendConfigData: jest.fn(),
    } as unknown as jest.Mocked<CnbServicePort>;

    loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CnbController],
      providers: [
        { provide: 'CNB_PORT', useValue: cnbServiceMock },
        { provide: Logger, useValue: loggerMock },
      ],
    }).compile();

    controller = module.get<CnbController>(CnbController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('completeStatus', () => {
    it('should call completeOnboadingCnb with correct parameters', async () => {
      const request: CnbStatusRequestDto = {
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
      const expectedResponse: CnbStatusResponseDto = { nodeId: request.nodeId };
      cnbServiceMock.completeOnboadingCnb.mockResolvedValue(expectedResponse);

      const result = await controller.completeStatus(request);

      expect(cnbServiceMock.completeOnboadingCnb).toHaveBeenCalledWith(request);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle errors', async () => {
      const request: CnbStatusRequestDto = {
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
      const expectedError = new Error('Service unavailable');
      cnbServiceMock.completeOnboadingCnb.mockRejectedValue(expectedError);

      await expect(controller.completeStatus(request)).rejects.toThrow(
        expectedError,
      );
    });
  });

  describe('handleCompleteOnboardingRequest', () => {
    it('should process Kafka message and commit offset', async () => {
      const message = { key: 'value' };
      const contextMock = {
        getPartition: jest.fn().mockReturnValue(1),
        getTopic: jest.fn().mockReturnValue('cnb.cnb.complete'),
        getMessage: jest.fn().mockReturnValue({ offset: '10' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn(),
        }),
      } as unknown as KafkaContext;

      cnbServiceMock.sendConfigData.mockResolvedValue(undefined);

      await controller.handleCompleteOnboardingRequest(message, contextMock);

      expect(loggerMock.log).toHaveBeenCalledWith(
        expect.stringContaining('Message processed successfully'),
      );
      expect(cnbServiceMock.sendConfigData).toHaveBeenCalledWith(message);
      expect(contextMock.getConsumer().commitOffsets).toHaveBeenCalled();
    });

    it('should handle errors and commit offsets', async () => {
      const message = { key: 'value' };
      const contextMock = {
        getPartition: jest.fn().mockReturnValue(1),
        getTopic: jest.fn().mockReturnValue('cnb.cnb.complete'),
        getMessage: jest.fn().mockReturnValue({ offset: '10' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn(),
        }),
      } as unknown as KafkaContext;

      const expectedError = new Error('Processing error');
      cnbServiceMock.sendConfigData.mockRejectedValue(expectedError);

      await expect(
        controller.handleCompleteOnboardingRequest(message, contextMock),
      ).rejects.toThrow(expectedError);

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('error | handleCompleteOnboardingRequest'),
        expectedError,
      );
      expect(contextMock.getConsumer().commitOffsets).toHaveBeenCalled();
    });
  });

  describe('CnbController - handleConfigurationNB005Message', () => {
    let controller: CnbController;
    let cnbServiceMock: jest.Mocked<CnbServicePort>;
    let loggerMock: jest.Mocked<Logger>;

    beforeEach(async () => {
      cnbServiceMock = {
        updateConfigNb005: jest.fn(),
      } as unknown as jest.Mocked<CnbServicePort>;

      loggerMock = {
        log: jest.fn(),
        error: jest.fn(),
      } as unknown as jest.Mocked<Logger>;

      const module: TestingModule = await Test.createTestingModule({
        controllers: [CnbController],
        providers: [
          { provide: 'CNB_PORT', useValue: cnbServiceMock },
          { provide: Logger, useValue: loggerMock },
        ],
      }).compile();

      controller = module.get<CnbController>(CnbController);
    });

    it('should process configuration NB005 and commit offset', async () => {
      const message: ConfigurationNb005Dto = {
        identificationNumber: '123',
        issueDate: '2024-01-01',
        expirationDate: '2025-01-01',
        issuer: 'IssuerName',
        status: 'Active',
        referenceTransaction: 'tx-123',
      };

      const contextMock = {
        getTopic: jest.fn().mockReturnValue('nb005.configuration.created'),
        getPartition: jest.fn().mockReturnValue(0),
        getMessage: jest.fn().mockReturnValue({ offset: '10' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn(),
        }),
      } as unknown as KafkaContext;

      await controller.handleConfigurationNB005Message(message, contextMock);

      expect(cnbServiceMock.updateConfigNb005).toHaveBeenCalledWith(message);
      expect(loggerMock.log).toHaveBeenCalledWith(
        expect.stringContaining('finish | handleConfigurationNB005Message')
      );
      expect(contextMock.getConsumer().commitOffsets).toHaveBeenCalledWith([
        { topic: 'nb005.configuration.created', partition: 0, offset: '11' },
      ]);
    });

    it('should handle error during configuration processing and still commit offset', async () => {
      const message: ConfigurationNb005Dto = {
        identificationNumber: '123',
        issueDate: '2024-01-01',
        expirationDate: '2025-01-01',
        issuer: 'IssuerName',
        status: 'Active',
        referenceTransaction: 'tx-123',
      };

      const contextMock = {
        getTopic: jest.fn().mockReturnValue('nb005.configuration.created'),
        getPartition: jest.fn().mockReturnValue(0),
        getMessage: jest.fn().mockReturnValue({ offset: '10' }),
        getConsumer: jest.fn().mockReturnValue({
          commitOffsets: jest.fn(),
        }),
      } as unknown as KafkaContext;

      const error = new Error('Processing failed');
      cnbServiceMock.updateConfigNb005.mockRejectedValue(error);

      await controller.handleConfigurationNB005Message(message, contextMock);

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('error | handleConfigurationNB005Message'),
        error,
      );
      expect(contextMock.getConsumer().commitOffsets).toHaveBeenCalledWith([
        { topic: 'nb005.configuration.created', partition: 0, offset: '11' },
      ]);
    });
  });
});
