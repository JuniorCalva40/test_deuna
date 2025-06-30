import { Logger } from '@deuna/tl-logger-nd';
import { CnbConfigSenderPort } from '../../ports/out/clients/cnb-config-sender.port';
import { CnbConfigurationsRequestDto } from '../../dto/cnb-configurations-request.dto';
import { CnbConfigurationsResponseDto } from '../../dto/cnb-configurations-response.dto';
import { SendCnbConfigurationsUseCase } from './send-cnb-configurations.use-case';

describe('SendCnbConfigurationsUseCase', () => {
  let useCase: SendCnbConfigurationsUseCase;

  const mockConfigSenderPort: CnbConfigSenderPort = {
    sendConfigurations: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useCase = new SendCnbConfigurationsUseCase(
      mockConfigSenderPort,
      mockLogger as unknown as Logger,
    );
  });

  describe('execute', () => {
    const mockRequest: CnbConfigurationsRequestDto = {
      configurations: [
        {
          nodeId: 'test-node-id',
          configName: 'TEST_CONFIG',
          configData: { test: 'data' },
          encrypted: false,
          clientType: 'NATURAL',
        },
      ],
    };

    const mockSuccessResponse: CnbConfigurationsResponseDto = {
      success: true,
      data: { result: 'success' },
    };

    it('should execute successfully and return response', async () => {
      jest
        .spyOn(mockConfigSenderPort, 'sendConfigurations')
        .mockResolvedValueOnce(mockSuccessResponse);

      const result = await useCase.execute(mockRequest);

      expect(mockConfigSenderPort.sendConfigurations).toHaveBeenCalledWith(
        mockRequest,
      );
      expect(result).toEqual(mockSuccessResponse);
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should handle error and rethrow', async () => {
      const mockError = new Error('Test error');
      jest
        .spyOn(mockConfigSenderPort, 'sendConfigurations')
        .mockRejectedValueOnce(mockError);

      await expect(useCase.execute(mockRequest)).rejects.toThrow('Test error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
