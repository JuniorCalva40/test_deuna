import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { RestMsaNbAliasManagementService } from './rest-msa-nb-alias-management.service';
import { GenerateDynamicQrInputDto } from '../dto/generate-dynamic-qr-input.dto';
import { CreateDynamicQrResponseDto } from '../dto/create-dynamic-qr-response.dto';
import { GetDynamicQrResponseDto } from '../dto/get-dynamic-qr-response.dto';

describe('RestMsaNbAliasManagementService', () => {
  let service: RestMsaNbAliasManagementService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestMsaNbAliasManagementService,
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

    service = module.get<RestMsaNbAliasManagementService>(
      RestMsaNbAliasManagementService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateDynamicQr', () => {
    const mockGenerateDynamicQrInput: GenerateDynamicQrInputDto = {
      deviceId: 'device123',
      accountNumber: '123456789',
      identification: '1234567890',
      businessName: 'Test Business',
      amount: 100,
      merchantId: 'merchant123',
    };

    const mockGenerateDynamicQrResponse: CreateDynamicQrResponseDto = {
      status: 'success',
      message: 'QR generated successfully',
      data: {
        transactionId: 'txn123',
        qrId: 'AQ5W4P8TH3M6',
        qrUrl: 'https://pagar.deuna.app/H92p/merchant?id=AQ5W4P8TH3M6',
        qrBase64: 'base64encodedqr',
      },
    };

    it('should generate dynamic QR successfully', (done) => {
      const mockAxiosResponse: AxiosResponse<CreateDynamicQrResponseDto> = {
        data: mockGenerateDynamicQrResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.post.mockReturnValue(of(mockAxiosResponse));

      service.generateDynamicQr(mockGenerateDynamicQrInput).subscribe({
        next: (result) => {
          expect(result).toEqual(mockGenerateDynamicQrResponse);
          done();
        },
        error: done,
      });
    });

    it('should handle errors when generating dynamic QR', (done) => {
      configService.get.mockImplementation(
        (key: string, defaultValue?: any) => {
          if (key === 'httpClient.retry') {
            return 2;
          }
          if (key === 'MSA_NB_ALIAS_MANAGEMENT_URL') {
            return 'http://test-url';
          }
          return defaultValue;
        },
      );

      httpService.post.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      service.generateDynamicQr(mockGenerateDynamicQrInput).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to generate dynamic QR code: Maximum call stack size exceeded',
          );
          done();
        },
      });
    });
  });

  describe('getDynamicQr', () => {
    const transactionId = 'txn123';
    const mockGetDynamicQrResponse: GetDynamicQrResponseDto = {
      status: 'success',
      message: 'QR retrieved successfully',
      data: {
        cnbAccount: '******6243',
        amount: 16,
        transactionId: '20a06e69-ff4c-4767-9e7c-b9e6ddd2b7e3',
        status: 'COMPLETED',
        secondId: '94S1Z4VGL66U',
        peopleAccount: '******2894',
        peopleName:
          'RISTIAN GEOVANNY CAZARES BALDEON RISTIAN GEOVANNY CAZARES BALDEON',
      },
    };

    it('should get dynamic QR successfully', (done) => {
      const mockAxiosResponse: AxiosResponse<GetDynamicQrResponseDto> = {
        data: mockGetDynamicQrResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      };

      configService.get.mockReturnValue('http://test-url');
      httpService.get.mockReturnValue(of(mockAxiosResponse));

      service.getDynamicQr(transactionId).subscribe({
        next: (result) => {
          expect(result).toEqual(mockGetDynamicQrResponse);
          done();
        },
        error: done,
      });
    });

    it('should handle errors when getting dynamic QR', (done) => {
      configService.get.mockImplementation(
        (key: string, defaultValue?: any) => {
          if (key === 'httpClient.retry') {
            return 2;
          }
          if (key === 'MSA_NB_ALIAS_MANAGEMENT_URL') {
            return 'http://test-url';
          }
          return defaultValue;
        },
      );

      httpService.get.mockReturnValue(
        throwError(() => new Error('Test error')),
      );

      service.getDynamicQr(transactionId).subscribe({
        next: () => done('Should not succeed'),
        error: (error) => {
          expect(error.message).toBe(
            'Failed to fetch dynamic QR code: Maximum call stack size exceeded',
          );
          done();
        },
      });
    });
  });
});
