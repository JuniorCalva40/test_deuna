import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { RestMsaCoInvoiceService } from './rest-msa-co-invoice.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { AxiosError, AxiosResponse } from 'axios';

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
            get: jest.fn(),
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

  describe('constructor', () => {
    it('should use default values when config values are not provided', () => {
      configService.get.mockReturnValue(undefined);

      const instance = new RestMsaCoInvoiceService(httpService, configService);

      expect(instance['apiUrl']).toBe('http://localhost:8080');
      expect(instance['retry']).toBe(2);
      expect(instance['timeout']).toBe(50000);
    });
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

      const testUrl = 'http://test-url.com';
      configService.get.mockImplementation((key: string) => {
        if (key === 'MSA_CO_INVOICE_API_URL') return testUrl;
        return null;
      });

      // Re-instantiate service to apply new config mock
      service = new RestMsaCoInvoiceService(httpService, configService);

      httpService.post.mockReturnValue(of(axiosResponse));

      service.createAccount(mockAccountData).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(httpService.post).toHaveBeenCalledWith(
            `${testUrl}/commerce/v1/invoice-provider/create-account`,
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

    it('should use provided URL and other config values', () => {
      const testUrl = 'http://test-api-url.com';
      const testRetry = 3;
      const testTimeout = 10000;

      configService.get.mockImplementation((key: string) => {
        if (key === 'MSA_CO_INVOICE_API_URL') return testUrl;
        if (key === 'httpClient.retry') return testRetry;
        if (key === 'httpClient.timeout') return testTimeout;
        return null;
      });

      const instance = new RestMsaCoInvoiceService(httpService, configService);
      expect(instance['apiUrl']).toBe(testUrl);
      expect(instance['retry']).toBe(testRetry);
      expect(instance['timeout']).toBe(testTimeout);
    });

    it('should use default value if config value is null', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'MSA_CO_INVOICE_API_URL') {
          return null;
        }
        return 2; // Default for retry
      });
      const instance = new RestMsaCoInvoiceService(httpService, configService);
      expect(instance['apiUrl']).toBe('http://localhost:8080');
    });

    it('should handle http error with response details', (done) => {
      const errorResponse = new AxiosError('Request failed with status code 400');
      errorResponse.response = {
        status: 400,
        data: { message: 'Bad Request' },
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      const testUrl = 'http://test-url';
      configService.get.mockImplementation((key: string) => {
        if (key === 'MSA_CO_INVOICE_API_URL') return testUrl;
        return null;
      });
      service = new RestMsaCoInvoiceService(httpService, configService);
      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      service.createAccount(mockAccountData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to create account');
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining(errorResponse.message),
          );
          expect(loggerSpy).toHaveBeenCalledWith('Response status: 400');
          expect(loggerSpy).toHaveBeenCalledWith(
            'Response data: {"message":"Bad Request"}',
          );
          done();
        },
      });
    });

    it('should handle http error without response details', (done) => {
      const errorResponse = new Error('Network Error');

      const testUrl = 'http://test-url';
      configService.get.mockImplementation((key: string) => {
        if (key === 'MSA_CO_INVOICE_API_URL') return testUrl;
        return null;
      });
      service = new RestMsaCoInvoiceService(httpService, configService);
      httpService.post.mockReturnValue(throwError(() => errorResponse));

      const loggerSpy = jest.spyOn(service['logger'], 'error');

      service.createAccount(mockAccountData).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to create account');
          expect(loggerSpy).toHaveBeenCalledWith(
            expect.stringContaining(errorResponse.message),
          );
          expect(loggerSpy).not.toHaveBeenCalledWith(
            expect.stringContaining('Response status:'),
          );
          done();
        },
      });
    });
  });

  describe('executeHttpRequest', () => {
    it('should use httpService.get for "get" requests', (done) => {
      const mockResponse = { data: 'test-data' };
      const axiosResponse: AxiosResponse = {
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      const testUrl = 'http://test-url.com';
      const testEndpoint = '/test-get';
      configService.get.mockImplementation((key: string) => {
        if (key === 'MSA_CO_INVOICE_API_URL') return testUrl;
        return null;
      });

      // Re-instantiate service to apply new config mock
      service = new RestMsaCoInvoiceService(httpService, configService);
      httpService.get.mockReturnValue(of(axiosResponse));

      // Accessing private method for testing purposes
      (service as any)
        .executeHttpRequest('get', testEndpoint, null, 'test get')
        .subscribe({
          next: (result) => {
            expect(result).toEqual(mockResponse);
            expect(httpService.get).toHaveBeenCalledWith(`${testUrl}${testEndpoint}`);
            expect(httpService.post).not.toHaveBeenCalled();
            done();
          },
          error: done,
        });
    });
  });
});
