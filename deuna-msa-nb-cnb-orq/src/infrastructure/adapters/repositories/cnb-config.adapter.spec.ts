import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { of, throwError } from 'rxjs';
import { CnbConfigAdapter } from './cnb-config.adapter';
import { AxiosResponse } from 'axios';

describe('CnbConfigAdapter', () => {
  let cnbConfigAdapter: CnbConfigAdapter;
  let httpService: HttpService;
  let logger: Logger;

  const configServiceURL = 'http://config-service-url';

  beforeEach(async () => {
    const httpServiceMock = {
      get: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'CONFIG_SERVICE_URL') {
          return configServiceURL;
        }
        return null;
      }),
    };

    const loggerMock = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnbConfigAdapter,
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: Logger,
          useValue: loggerMock,
        },
      ],
    }).compile();

    cnbConfigAdapter = module.get<CnbConfigAdapter>(CnbConfigAdapter);
    httpService = module.get<HttpService>(HttpService);
    logger = module.get<Logger>(Logger);
  });

  it('should be defined', () => {
    expect(cnbConfigAdapter).toBeDefined();
  });

  describe('getCnbConfig', () => {
    const nodeId = 'node-123';
    const configName = 'NB001';
    const mockResponse = {
      data: {
        configName: 'NB001',
        status: 'ACTIVE',
      },
    };

    it('should return config data when API call is successful', async () => {
      const axiosResponse: AxiosResponse = {
        data: mockResponse.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: {},
        } as any,
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse));

      const result = await cnbConfigAdapter.getCnbConfig(nodeId, configName);

      expect(httpService.get).toHaveBeenCalledWith(
        `${configServiceURL}/configuration/${nodeId}/search/${configName}`,
      );
      expect(result).toEqual(axiosResponse);
    });

    it('should return null and log warning when API call fails', async () => {
      const error = new Error('API Error');

      jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => error));
      jest.spyOn(logger, 'warn');

      const result = await cnbConfigAdapter.getCnbConfig(nodeId, configName);

      expect(httpService.get).toHaveBeenCalledWith(
        `${configServiceURL}/configuration/${nodeId}/search/${configName}`,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        `error | getCnbConfig | CnbConfigClient para ${nodeId}`,
        error,
      );
      expect(result).toBeNull();
    });
  });
});
