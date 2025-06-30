import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CnbSecuenceAdapter } from './cnb-secuence.adapter';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';

describe('CnbSecuenceAdapter', () => {
  let adapter: CnbSecuenceAdapter;
  let httpService: HttpService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CnbSecuenceAdapter,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://fake-api.com'),
          },
        },
      ],
    }).compile();

    adapter = module.get<CnbSecuenceAdapter>(CnbSecuenceAdapter);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('Should return a sequence successfully', async () => {
    const mockResponse: AxiosResponse = {
      data: { secuence: '12345' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

    const result = await adapter.getSecuence();
    expect(result).toBe('12345');
    expect(httpService.get).toHaveBeenCalledWith(
      'http://fake-api.com/api/v1/cnb-secuence',
    );
  });

  it('Should throw an error if the HTTP call fails', async () => {
    const error = new Error('Network Error');
    jest.spyOn(httpService, 'get').mockReturnValue(throwError(() => error));

    await expect(adapter.getSecuence()).rejects.toThrow('Network Error');
  });

  it('Should throw an error if MSA_NB_CLIENT_SERVICE_URL is not defined', async () => {
    jest.spyOn(configService, 'get').mockReturnValue(undefined);
    expect(() => new CnbSecuenceAdapter(httpService, configService)).toThrow(
      'API URL MSA_NB_CLIENT_SERVICE_URL is not configured',
    );
  });
});
