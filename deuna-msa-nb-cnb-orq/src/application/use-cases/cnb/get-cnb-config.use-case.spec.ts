import { Test, TestingModule } from '@nestjs/testing';
import { GetCnbConfigUseCase } from './get-cnb-config.use-case';
import { Logger } from '@deuna/tl-logger-nd';
import {
  CnbConfigClientPort,
  CNB_CONFIG_CLIENT_PORT,
} from '../../ports/out/clients/cnb-config-client.port';

describe('GetCnbConfigUseCase', () => {
  let getCnbConfigUseCase: GetCnbConfigUseCase;
  let cnbConfigClientPort: CnbConfigClientPort;
  let logger: Logger;

  beforeEach(async () => {
    const cnbConfigClientPortMock = {
      getCnbConfig: jest.fn(),
    };

    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CNB_CONFIG_CLIENT_PORT,
          useValue: cnbConfigClientPortMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        },
        {
          provide: GetCnbConfigUseCase,
          useFactory: (clientPort, loggerService) => {
            return new GetCnbConfigUseCase(clientPort, loggerService);
          },
          inject: [CNB_CONFIG_CLIENT_PORT, Logger],
        },
      ],
    }).compile();

    getCnbConfigUseCase = module.get<GetCnbConfigUseCase>(GetCnbConfigUseCase);
    cnbConfigClientPort = module.get<CnbConfigClientPort>(
      CNB_CONFIG_CLIENT_PORT,
    );
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(getCnbConfigUseCase).toBeDefined();
  });

  describe('execute', () => {
    it('should call cnbConfigClientPort.getCnbConfig and return the data', async () => {
      const nodeId = 'node-123';
      const configName = 'NB001';
      const expectedResponse = {
        data: { configName: 'NB001', status: 'ACTIVE' },
      };

      jest
        .spyOn(cnbConfigClientPort, 'getCnbConfig')
        .mockResolvedValue(expectedResponse);

      const result = await getCnbConfigUseCase.execute(nodeId, configName);

      expect(cnbConfigClientPort.getCnbConfig).toHaveBeenCalledWith(
        nodeId,
        configName,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should return null and log warning if there is an error', async () => {
      const nodeId = 'node-123';
      const configName = 'NB001';
      const error = new Error('Test error');

      jest.spyOn(cnbConfigClientPort, 'getCnbConfig').mockRejectedValue(error);
      jest.spyOn(logger, 'warn');

      const result = await getCnbConfigUseCase.execute(nodeId, configName);

      expect(cnbConfigClientPort.getCnbConfig).toHaveBeenCalledWith(
        nodeId,
        configName,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `error | execute | GetCnbConfigUseCase para nodeId: ${nodeId}`,
        error,
      );
      expect(result).toBeNull();
    });
  });
});
