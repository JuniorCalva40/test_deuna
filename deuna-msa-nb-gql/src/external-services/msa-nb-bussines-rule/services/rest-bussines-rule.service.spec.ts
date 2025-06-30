import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestBussinesRuleService } from './rest-bussines-rule.service';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

describe('RestBussinesRuleService', () => {
  let service: RestBussinesRuleService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const httpServiceMock = {
      get: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn().mockImplementation((key: string) => {
        const config = {
          bussinesRuleServiceUrl: 'http://api.example.com',
          'httpClient.retry': '2',
          'httpClient.timeout': '50000',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestBussinesRuleService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<RestBussinesRuleService>(RestBussinesRuleService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRucByIdentification', () => {
    it('should make a GET request to validate RUC', async () => {
      const mockId = '123456';
      const mockApiUrl = 'http://api.example.com';
      const mockResponse = {
        status: 'success',
        data: {
          ruc: '1234567890001',
          cedula: '123456',
          nombre: 'John Doe',
        },
      };

      configService.get.mockReturnValue(mockApiUrl);
      httpService.get.mockReturnValue(
        of({
          data: mockResponse,
        } as AxiosResponse),
      );

      // Forzar la actualización del apiUrl
      (service as any).apiUrl = mockApiUrl;

      const result = await lastValueFrom(
        service.getRucByIdentification(mockId),
      );

      expect(configService.get).toHaveBeenCalledWith('bussinesRuleServiceUrl');
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockApiUrl}/validate-ruc?cedula=${mockId}`,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      const mockId = '123456';
      const mockApiUrl = 'http://api.example.com';
      const mockError = new Error('HTTP Error');

      configService.get.mockReturnValue(mockApiUrl);
      httpService.get.mockReturnValue(throwError(() => mockError));

      // Forzar la actualización del apiUrl
      (service as any).apiUrl = mockApiUrl;

      await expect(
        lastValueFrom(service.getRucByIdentification(mockId)),
      ).rejects.toThrow('HTTP Error');
    });
  });
});
