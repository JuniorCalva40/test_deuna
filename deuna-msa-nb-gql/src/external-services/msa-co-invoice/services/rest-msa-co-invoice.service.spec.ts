import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaCoInvoiceService } from './rest-msa-co-invoice.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AxiosResponse } from 'axios';

describe('RestMsaCoInvoiceService', () => {
  let service: RestMsaCoInvoiceService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaCoInvoiceService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RestMsaCoInvoiceService>(RestMsaCoInvoiceService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const mockAccountData: CreateAccountDto = {
      provider: 'test-provider',
      ruc: '123456789',
      legal_name: 'Test Company',
      address: 'Test Address',
      telephone: '1234567890',
      email: 'test@example.com',
      category: 'test-category',
      economic_activities: 'test-activities',
      entity_type: 'test-entity',
      location: {
        code: 'test-code',
        city: 'Test City',
        province: 'Test Province',
        address: 'Test Address',
        points_of_sale_code: 'test-pos-code',
        points_of_sale_description: 'Test POS',
      },
    };

    it('should successfully create an account', (done) => {
      const mockResponse = { id: 'test-id', status: 'success' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(of(axiosResponse));

      service.createAccount(mockAccountData).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            'http://localhost:8080/commerce/v1/invoice-provider/create-account',
            mockAccountData,
          );
          done();
        },
        error: done,
      });
    });

    it('should use default URL if not provided in config', () => {
      configService.get.mockReturnValue(undefined);
      const instance = new RestMsaCoInvoiceService(httpService, configService);
      expect(instance['apiUrl']).toBe('http://localhost:8080');
    });

    it('should use provided URL from config', () => {
      const testUrl = 'http://test-api-url.com';
      configService.get.mockReturnValue(testUrl);
      const instance = new RestMsaCoInvoiceService(httpService, configService);
      expect(instance['apiUrl']).toBe(testUrl);
    });

    it('should handle http error', (done) => {
      const errorMessage = 'HTTP Error';
      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(
        throwError(() => new Error(errorMessage)),
      );

      service.createAccount(mockAccountData).subscribe({
        next: () => done('should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            `Failed to create account in RestMsaCoInvoiceService: ${errorMessage}`,
          );
          done();
        },
      });
    });
  });
});
