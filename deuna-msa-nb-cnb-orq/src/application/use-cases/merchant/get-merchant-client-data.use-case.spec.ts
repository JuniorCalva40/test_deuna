import { MerchantClientUseCase } from './get-merchant-client-data.use-case';
import { MerchantClientPort } from '../../ports/out/clients/merchant-client.port';
import { Logger } from '@deuna/tl-logger-nd';

describe('MerchantClientUseCase', () => {
  let useCase: MerchantClientUseCase;
  let merchantClientPort: jest.Mocked<MerchantClientPort>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    merchantClientPort = {
      getClientData: jest.fn(),
    };

    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    useCase = new MerchantClientUseCase(merchantClientPort, logger);
  });

  it('should return clientId when successful', async () => {
    const identification = '1234567890';
    const expectedResponse = { clientId: 'client-001' };
    merchantClientPort.getClientData.mockResolvedValue(expectedResponse);

    const result = await useCase.execute(identification);

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('init | MerchantClientUseCase | execute'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('finish | MerchantClientUseCase | execute'),
    );
    expect(result).toBe('client-001');
    expect(merchantClientPort.getClientData).toHaveBeenCalledWith(identification);
  });

  it('should log error and rethrow if getClientData fails', async () => {
    const identification = '9876543210';
    const error = new Error('Failed to fetch client data');
    merchantClientPort.getClientData.mockRejectedValue(error);

    await expect(useCase.execute(identification)).rejects.toThrow(error);
    expect(logger.error).toHaveBeenCalledWith(
      'error | MerchantClientUseCase | execute',
      error,
    );
  });
});