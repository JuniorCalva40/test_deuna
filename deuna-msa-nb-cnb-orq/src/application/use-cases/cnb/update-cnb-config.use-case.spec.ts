import { UpdateCnbConfigUseCase } from './update-cnb-config.use-case';
import { CnbConfigUpdatePort } from '../../ports/out/clients/cnb-config-update.port';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbConfigurationItem } from '../../dto/cnb-configurations-request.dto';

describe('UpdateCnbConfigUseCase', () => {
  let useCase: UpdateCnbConfigUseCase;
  let cnbConfigUpdatePort: jest.Mocked<CnbConfigUpdatePort>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    cnbConfigUpdatePort = {
      updateCnbConfig: jest.fn(),
    };

    logger = {
      warn: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    useCase = new UpdateCnbConfigUseCase(cnbConfigUpdatePort, logger);
  });

  it('should call updateCnbConfig with the correct arguments', async () => {
    const configId = 'config-001';
    const configItem: CnbConfigurationItem = {
      nodeId: 'node-123',
      configName: 'NB005',
      encrypted: false,
      clientType: 'NATURAL',
      configData: {
        referenceTransaction: 'tx-123',
        status: 'Active',
      },
    };

    await useCase.execute(configId, configItem);

    expect(cnbConfigUpdatePort.updateCnbConfig).toHaveBeenCalledWith(configId, configItem);
  });

  it('should log and rethrow error if update fails', async () => {
    const configId = 'config-002';
    const configItem: CnbConfigurationItem = {
      nodeId: 'node-456',
      configName: 'NB005',
      encrypted: true,
      clientType: 'JURIDICAL',
      configData: {
        referenceTransaction: 'tx-456',
        status: 'Inactive',
      },
    };

    const error = new Error('Update failed');
    cnbConfigUpdatePort.updateCnbConfig.mockRejectedValue(error);

    await expect(useCase.execute(configId, configItem)).rejects.toThrow(error);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('error | UpdateCnbConfigUseCase | execute'),
      error,
    );
  });
});