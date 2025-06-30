import { CnbConfigUpdateAdapter } from './cnb-config-update.adapter';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from '@deuna/tl-logger-nd';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { CnbConfigurationItem } from '@src/application/dto/cnb-configurations-request.dto';

describe('CnbConfigUpdateAdapter', () => {
  let adapter: CnbConfigUpdateAdapter;
  let configService: jest.Mocked<ConfigService>;
  let httpService: jest.Mocked<HttpService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CONFIG_SERVICE_URL') return 'http://config-service';
        return null;
      }),
    } as any;

    httpService = {
      put: jest.fn(),
    } as any;

    logger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    adapter = new CnbConfigUpdateAdapter(configService, httpService, logger);
  });

  it('should send PUT request and log success', async () => {
    const configId = 'config-123';
    const configItem: CnbConfigurationItem = {
      nodeId: 'node-001',
      configName: 'NB005',
      encrypted: false,
      clientType: 'NATURAL',
      configData: { status: 'ACTIVE', referenceTransaction: 'tx-001' },
    };

    const mockResponse: AxiosResponse = {
      data: null,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        headers: new AxiosHeaders(),
      },
    };

    httpService.put.mockReturnValue(of(mockResponse));

    await adapter.updateCnbConfig(configId, configItem);

    expect(httpService.put).toHaveBeenCalledWith(
      'http://config-service/configuration/config-123',
      configItem,
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('init | CnbConfigUpdateAdapter | updateCnbConfig'),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('finish | CnbConfigUpdateAdapter | updateCnbConfig | status: 200'),
    );
  });

  it('should log and throw when request fails', async () => {
    const configId = 'config-999';
    const configItem: CnbConfigurationItem = {
      nodeId: 'node-err',
      configName: 'NB005',
      encrypted: false,
      clientType: 'NATURAL',
      configData: { status: 'ERROR', referenceTransaction: 'tx-fail' },
    };

    const error = {
      message: 'Bad Request',
      response: {
        data: {
          message: 'Validation failed (uuid is expected)',
        },
        status: 400,
      },
    };

    httpService.put.mockReturnValue(throwError(() => error));

    await expect(adapter.updateCnbConfig(configId, configItem)).rejects.toThrow(
      'Failed to update config: Bad Request',
    );

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('error | CnbConfigUpdateAdapter | updateCnbConfig | status: 400'),
    );
  });

  it('should throw if CONFIG_SERVICE_URL is not defined', () => {
    configService.get.mockReturnValue(undefined);

    expect(
      () => new CnbConfigUpdateAdapter(configService, httpService, logger),
    ).toThrow('CONFIG_SERVICE_URL is not defined');

    expect(logger.error).toHaveBeenCalledWith(
      'error | CnbConfigUpdateAdapter | constructor',
      'CONFIG_SERVICE_URL is not defined',
    );
  });
});