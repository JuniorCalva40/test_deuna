import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { MsaMcCrCommissionsService } from './deuna-msa-mc-cr-commissions.service';
import { SearchCommissionsInputDto } from '../dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto } from '../dto/search-commissions-response.dto';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { Logger } from '@nestjs/common'; // Added import

describe('MsaMcCrCommissionsService', () => {
  let service: MsaMcCrCommissionsService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const merchantId = 'b534409f-b7aa-4b8f-a850-baf599bfd2a7';
  const startMonth = '2025-01';
  const endMonth = '2025-02';

  const searchCommissionsInput: SearchCommissionsInputDto = {
    page: 0,
    size: 10,
  };

  const searchCommissionsApiResponse: AxiosResponse<SearchCommissionsResponseDto> =
    {
      data: {
        totalElements: 3,
        totalPages: 1,
        currentPage: 0,
        commissions: [
          {
            transactionId: '44fffbaa-5e6a-4116-ac0c-510947ccc413',
            channel: 'CNB',
            type: 'DEPOSIT',
            amount: 0.14,
            currency: 'USD',
            merchantId: 'b534409f-b7aa-4b8f-a850-baf599bfd2a7',
            beneficiaryAccountNumber: '1234567890',
            beneficiaryClientId: '123456789',
            beneficiaryClientIdType: 'CEDULA',
            transactionDate: '2025-02-02T10:30:00Z',
            posId: '987',
            branchId: '2312',
            status: 'COMPLETED',
          },
          {
            transactionId: '44fffbaa-5e6a-4116-ac0c-510947ccc413',
            channel: 'CNB',
            type: 'DEPOSIT',
            amount: 0.14,
            currency: 'USD',
            merchantId: 'b534409f-b7aa-4b8f-a850-baf599bfd2a7',
            beneficiaryAccountNumber: '1234567890',
            beneficiaryClientId: '123456789',
            beneficiaryClientIdType: 'CEDULA',
            transactionDate: '2025-01-02T10:30:00Z',
            posId: '987',
            branchId: '2312',
            status: 'COMPLETED',
          },
          {
            transactionId: '44fffbaa-5e6a-4116-ac0c-510947ccc413',
            channel: 'CNB',
            type: 'DEPOSIT',
            amount: 0.14,
            currency: 'USD',
            merchantId: 'b534409f-b7aa-4b8f-a850-baf599bfd2a7',
            beneficiaryAccountNumber: '1234567890',
            beneficiaryClientId: '123456789',
            beneficiaryClientIdType: 'CEDULA',
            transactionDate: '2025-01-01T10:30:00Z',
            posId: '987',
            branchId: '2312',
            status: 'COMPLETED',
          },
        ],
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: undefined } as any,
    };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MsaMcCrCommissionsService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'MSA_CR_COMMISSION_SERVICE_URL') {
                return 'http://test-api.com';
              }
              if (key === 'httpClient.retry') {
                return '2';
              }
              if (key === 'httpClient.timeout') {
                return '30000';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MsaMcCrCommissionsService>(MsaMcCrCommissionsService);
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchCommissions', () => {
    it('should call API with correct parameters and return data', (done) => {
      httpService.get.mockReturnValue(of(searchCommissionsApiResponse));

      service
        .searchCommissions(
          merchantId,
          searchCommissionsInput,
          startMonth,
          endMonth,
        )
        .subscribe({
          next: (response) => {
            expect(response).toEqual(searchCommissionsApiResponse.data);
            expect(httpService.get).toHaveBeenCalledWith(
              `http://test-api.com/api/v1/commissions/${merchantId}/search`,
              {
                params: {
                  channel: 'CNB',
                  page: searchCommissionsInput.page.toString(),
                  size: searchCommissionsInput.size.toString(),
                  startMonth,
                  endMonth,
                },
                timeout: 30000, // Default timeout from config
              },
            );
            done();
          },
          error: done.fail,
        });
    });

    it('should handle errors', (done) => {
      const errorMessage = 'Error searching commissions';
      const mockError = {
        response: {
          data: { message: errorMessage, details: 'search error details' },
          status: 500,
        },
      };
      httpService.get.mockReturnValue(throwError(() => mockError));

      service
        .searchCommissions(
          merchantId,
          searchCommissionsInput,
          startMonth,
          endMonth,
        )
        .subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error.message).toBe(errorMessage);
            expect(error.details).toBe('search error details');
            expect(error.code).toBe(500);
            done();
          },
        });
    });

    it('should handle 400 errors specifically', (done) => {
      const errorMessage = 'Bad request for search commissions';
      const mockError = {
        response: {
          data: { message: errorMessage, details: 'bad search details' },
          status: 400,
        },
      };
      httpService.get.mockReturnValue(throwError(() => mockError));

      service
        .searchCommissions(
          merchantId,
          searchCommissionsInput,
          startMonth,
          endMonth,
        )
        .subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error.message).toBe(errorMessage);
            expect(error.details).toBe('bad search details');
            expect(error.code).toBe(
              ErrorCodes.MSA_CR_COMMISSIONS_SERVICE_ERROR,
            );
            done();
          },
        });
    });
  });

  it('should use default retry and timeout if not configured', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MSA_CR_COMMISSION_SERVICE_URL') {
        return 'http://test-api.com';
      }
      return undefined; // Simulate retry and timeout not being set
    });

    const newService = new MsaMcCrCommissionsService(
      httpService,
      configService,
    );
    expect((newService as any).retry).toBe(2);
    expect((newService as any).timeout).toBe(30000);
  });

  it('should log an error if MSA_CR_COMMISSION_SERVICE_URL is not defined', () => {
    const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error');
    configService.get.mockReturnValue(undefined); // Simulate URL not being set

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _service = new MsaMcCrCommissionsService(httpService, configService);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'MSA_CR_COMMISSION_SERVICE_URL is no defined',
    );
    loggerErrorSpy.mockRestore();
  });
});
