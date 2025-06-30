import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@deuna/tl-logger-nd';
import { CnbConfigSenderAdapter } from './cnb-config-sender.adapter';
import { CnbConfigurationsRequestDto } from '../../../application/dto/cnb-configurations-request.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('CnbConfigSenderAdapter', () => {
  let adapter: CnbConfigSenderAdapter;
  let httpService: HttpService;
  let configService: ConfigService;
  let logger: Logger;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://mock-config-service-url'),
  };

  const mockHttpService = {
    post: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnbConfigSenderAdapter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    adapter = module.get<CnbConfigSenderAdapter>(CnbConfigSenderAdapter);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
    logger = module.get<Logger>(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if CONFIG_SERVICE_URL is not defined', async () => {
      mockConfigService.get.mockReturnValueOnce(null);

      expect(() => {
        new CnbConfigSenderAdapter(configService, httpService, logger);
      }).toThrow('CONFIG_SERVICE_URL is not defined');
    });
  });

  describe('sendConfigurations', () => {
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

    const mockSuccessResponse: AxiosResponse = {
      data: { result: 'success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        url: 'http://mock-config-service-url/configuration/all',
      } as any,
    };

    it('should send configurations and return success response', async () => {
      mockHttpService.post.mockReturnValueOnce(of(mockSuccessResponse));

      const result = await adapter.sendConfigurations(mockRequest);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://mock-config-service-url/configuration/all',
        mockRequest,
      );
      expect(result).toEqual({
        success: true,
        data: { result: 'success' },
      });
      expect(mockLogger.log).toHaveBeenCalledTimes(2);
    });

    it('should handle error and return failure response', async () => {
      const mockError = new Error('Connection failed');
      mockHttpService.post.mockReturnValueOnce(throwError(() => mockError));

      const result = await adapter.sendConfigurations(mockRequest);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'http://mock-config-service-url/configuration/all',
        mockRequest,
      );
      expect(result).toEqual({
        success: false,
        message: 'Connection failed',
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
