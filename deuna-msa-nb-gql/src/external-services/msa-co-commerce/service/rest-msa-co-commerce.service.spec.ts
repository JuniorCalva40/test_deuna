import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError, lastValueFrom } from 'rxjs';
import { RestMsaCoCommerceService } from './rest-msa-co-commerce.service';
import { AxiosResponse } from 'axios';

describe('RestMsaCoCommerceService', () => {
  let service: RestMsaCoCommerceService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const httpServiceMock = {
      get: jest.fn(),
    };

    const configServiceMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoCommerceService,
        { provide: HttpService, useValue: httpServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<RestMsaCoCommerceService>(RestMsaCoCommerceService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserByDocument', () => {
    it('should make a GET request to validate RUC', async () => {
      const mockId = '123456';
      const mockApiUrl = 'http://api.example.com';
      const mockResponse = {
        id: '12345',
        name: 'John Doe Company',
        fullName: 'John Doe',
        ruc: 1234567890,
        principalContact: '1234567890',
        username: 'johndoe',
        identification: '123456789',
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
        service.getUserByDocument({ identification: mockId }),
      );

      expect(configService.get).toHaveBeenCalledWith(
        'MSA_CO_COMMERCE_SERVICE_URL',
      );
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockApiUrl}/microcommerce/getbyidentification/${mockId}`,
      );
      expect(result).toEqual({
        id: '12345',
        name: 'John Doe Company',
        ruc: 1234567890,
        fullName: 'John Doe',
        principalContact: '1234567890',
        username: 'johndoe',
        identification: '123456789',
      });
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
        lastValueFrom(service.getUserByDocument({ identification: mockId })),
      ).rejects.toThrow(
        'Failed to get User in RestMsaCoCommerceService: HTTP Error',
      );
    });
  });

  describe('getUserByUsername', () => {
    it('should make a GET request to get user by username', async () => {
      const mockUsername = 'johndoe';
      const mockApiUrl = 'http://api.example.com';
      const mockResponse = {
        id: '12345',
        name: 'John Doe Company',
        fullName: 'John Doe',
        ruc: 1234567890,
        principalContact: '1234567890',
        username: 'johndoe',
        identification: '123456789',
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
        service.getUserByUsername(mockUsername),
      );

      expect(configService.get).toHaveBeenCalledWith(
        'MSA_CO_COMMERCE_SERVICE_URL',
      );
      expect(httpService.get).toHaveBeenCalledWith(
        `${mockApiUrl}/microcommerce?username=${mockUsername}&rucDetails=true`,
      );
      expect(result).toEqual({
        id: '12345',
        name: 'John Doe Company',
        ruc: 1234567890,
        fullName: 'John Doe',
        principalContact: '1234567890',
        username: 'johndoe',
        identification: '123456789',
      });
    });

    it('should handle errors', async () => {
      const mockUsername = 'johndoe';
      const mockApiUrl = 'http://api.example.com';
      const mockError = new Error('HTTP Error');

      configService.get.mockReturnValue(mockApiUrl);
      httpService.get.mockReturnValue(throwError(() => mockError));

      // Forzar la actualización del apiUrl
      (service as any).apiUrl = mockApiUrl;

      await expect(
        lastValueFrom(service.getUserByUsername(mockUsername)),
      ).rejects.toThrow(
        'Failed to get User in RestMsaCoCommerceService: HTTP Error',
      );
    });
  });
});
