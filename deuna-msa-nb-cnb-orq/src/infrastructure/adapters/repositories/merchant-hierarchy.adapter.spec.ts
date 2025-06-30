import { MerchantHierarchyAdapter } from './merchant-hierarchy.adapter';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@deuna/tl-logger-nd';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('MerchantHierarchyAdapter', () => {
  let adapter: MerchantHierarchyAdapter;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'BO_MERCHANT_HIERARCHY_SERVICE') {
          return 'http://hierarchy-service';
        }
        return null;
      }),
    } as any;

    httpService = {
      get: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    adapter = new MerchantHierarchyAdapter(configService, httpService, logger);
  });

  it('should fetch most recent nodeId based on createdAt', async () => {
    const clientId = 'client-abc';
    const mockResponse: AxiosResponse = {
      data: {
        items: [
          {
            id: 111,
            createdAt: '2025-01-01T10:00:00.000Z',
          },
          {
            id: 222,
            createdAt: '2025-05-01T12:00:00.000Z',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    httpService.get.mockReturnValue(of(mockResponse));

    const result = await adapter.getNodeId(clientId);

    expect(httpService.get).toHaveBeenCalledWith(
      'http://hierarchy-service/hierarchy?clientId=client-abc&nodeType=M&status=A&page=1&limit=10'
    );
    expect(result).toEqual({ nodeId: '222' });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('init | MerchantHierarchyAdapter | getNodeId'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('finish | MerchantHierarchyAdapter | getNodeId'),
    );
  });

  it('should log and throw when request fails', async () => {
    const clientId = 'client-error';
    const error = new Error('Failed request');

    httpService.get.mockReturnValue(throwError(() => error));

    await expect(adapter.getNodeId(clientId)).rejects.toThrow(
      'Failed to get merchant client data: Failed request',
    );

    expect(logger.error).toHaveBeenCalledWith(
      'error | MerchantHierarchyAdapter | getNodeId',
      error,
    );
  });

  it('should throw if BO_MERCHANT_HIERARCHY_SERVICE is not defined', () => {
    configService.get.mockReturnValue(undefined);

    expect(
      () => new MerchantHierarchyAdapter(configService, httpService, logger),
    ).toThrow('BO_MERCHANT_HIERARCHY_SERVICE is not defined');

    expect(logger.error).toHaveBeenCalledWith(
      'error | MerchantHierarchyAdapter | constructor',
      'BO_MERCHANT_HIERARCHY_SERVICE is not defined',
    );
  });

  it('should throw if no items are returned', async () => {
    const clientId = 'client-no-data';
    const mockResponse: AxiosResponse = {
      data: { items: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    httpService.get.mockReturnValue(of(mockResponse));

    await expect(adapter.getNodeId(clientId)).rejects.toThrow(
      'Failed to get merchant client data: No active nodeType M found for client',
    );
  });
});