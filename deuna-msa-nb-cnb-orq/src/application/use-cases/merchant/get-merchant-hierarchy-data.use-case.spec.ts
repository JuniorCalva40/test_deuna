import { MerchantHierarchyUseCase } from './get-merchant-hierarchy-data.use-case';
import { MerchantHierarchyPort } from '../../ports/out/clients/merchant-hierarchy.port';
import { Logger } from '@deuna/tl-logger-nd';

describe('MerchantHierarchyUseCase', () => {
  let useCase: MerchantHierarchyUseCase;
  let merchantHierarchyPort: jest.Mocked<MerchantHierarchyPort>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    merchantHierarchyPort = {
      getNodeId: jest.fn(),
    };

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    useCase = new MerchantHierarchyUseCase(merchantHierarchyPort, logger);
  });

  it('should return nodeId when successful', async () => {
    const clientId = 'client-123';
    const expectedResponse = { nodeId: 'node-456' };

    merchantHierarchyPort.getNodeId.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(clientId);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('init | MerchantHierarchyUseCase | execute'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('finish | MerchantHierarchyUseCase | execute'),
    );
    expect(result).toBe('node-456');
    expect(merchantHierarchyPort.getNodeId).toHaveBeenCalledWith(clientId);
  });

  it('should log error and rethrow if getNodeId fails', async () => {
    const clientId = 'client-error';
    const error = new Error('Service failed');

    merchantHierarchyPort.getNodeId.mockRejectedValue(error);

    await expect(useCase.execute(clientId)).rejects.toThrow(error);

    expect(logger.error).toHaveBeenCalledWith(
      'error | MerchantHierarchyUseCase | execute',
      error,
    );
  });
});