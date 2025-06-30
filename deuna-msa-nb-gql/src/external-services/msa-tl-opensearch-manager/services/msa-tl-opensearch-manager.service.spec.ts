import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { MsaTlOpensearchManagerService } from './msa-tl-opensearch-manager.service';
import { Test, TestingModule } from '@nestjs/testing';
import { GetCnbTransactionsInput } from '../../../operations/query-get-cnb-transactions/dto/get-cnb-transactions-input.dto';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import {
  TransactionChannelId,
  TransactionChannelType,
} from '../../../common/constants/common';
import { ErrorCodes } from '../../../common/constants/error-codes';

describe('MsaTlOpensearchManagerService', () => {
  let service: MsaTlOpensearchManagerService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  const input: GetCnbTransactionsInput = {
    fromDate: '2023-01-01',
    toDate: '2023-01-31',
    page: 1,
    size: 10,
    transacitonType: TransactionChannelType.DEPOSIT,
  };
  const merchantId = '12345';

  const apiResponse: AxiosResponse = {
    data: {
      totalElements: 1,
      totalPages: 2,
      currentPage: 2,
      transactions: [
        {
          id: '1',
          amount: 100.0,
          currency: 'USD',
          date: '2023-10-01',
          source: 'Bank Transfer',
          transactionChannelId: TransactionChannelId.INTTRANFERDEPOSITOCNBS,
        },
      ],
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: undefined },
  };

  const commissionResponse: AxiosResponse = {
    data: [
      {
        month: '2025-04',
        monthlyTotal: 0.56,
        monthlyCount: 4,
        dailyBreakdown: [],
      },
    ],
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: undefined },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MsaTlOpensearchManagerService,
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
              if (key === 'MSA_TL_OPENSEARCH_MANAGER_SERVICE_URL') {
                return 'http://custom-api.com';
              }
              return undefined; // Default for other config keys if any
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MsaTlOpensearchManagerService>(
      MsaTlOpensearchManagerService,
    );
    httpService = module.get(HttpService) as jest.Mocked<HttpService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should logged a error default URL if not provided', () => {
    configService.get.mockReturnValue(undefined);
    const newService = new MsaTlOpensearchManagerService(
      httpService,
      configService,
    );
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_OPENSEARCH_MANAGER_SERVICE_URL',
    );
    expect((newService as any).apiUrl).toBe(undefined);
  });

  it('should use provided URL', () => {
    const mockUrl = 'http://custom-api.com';
    configService.get.mockReturnValue(mockUrl);
    const newService = new MsaTlOpensearchManagerService(
      httpService,
      configService,
    );
    expect(configService.get).toHaveBeenCalledWith(
      'MSA_TL_OPENSEARCH_MANAGER_SERVICE_URL',
    );
    expect((newService as any).apiUrl).toBe(mockUrl);
  });

  it('should call getCnbTransactions one time with type DEPOSIT', (done) => {
    const mockUrl = 'http://custom-api.com';

    configService.get.mockReturnValue(mockUrl);
    httpService.get.mockReturnValue(of(apiResponse));
    service.getCnbTransactions(input, merchantId).subscribe({
      next: (response) => {
        expect(response).toBeDefined();
        expect(httpService.get).toHaveBeenCalledTimes(1);
        done();
      },
      error: done,
    });
  });

  it('should call getCnbTransactions one time with type WITHDRAWAL', (done) => {
    const mockUrl = 'http://custom-api.com';

    configService.get.mockReturnValue(mockUrl);
    httpService.get.mockReturnValue(of(apiResponse));
    service
      .getCnbTransactions(
        { ...input, transacitonType: TransactionChannelType.WITHDRAWAL },
        merchantId,
      )
      .subscribe({
        next: (response) => {
          expect(response).toBeDefined();
          expect(httpService.get).toHaveBeenCalledTimes(1);
          done();
        },
        error: done,
      });
  });

  it('should handle errors when getCnbTransactions is called', (done) => {
    const errorMessage = 'Error occurred while getting CNB transactions';
    const mockError = {
      message: 'Something went wrong Error HTTP',
      response: {
        data: {
          message: errorMessage,
        },
      },
    };
    httpService.get.mockReturnValue(throwError(() => mockError));

    service.getCnbTransactions(input, merchantId).subscribe({
      next: () => done(),
      error: (error) => {
        expect(error.message).toContain(errorMessage);
        done();
      },
    });
  });

  it('should handle Bad request error when getCnbTransactions is called', (done) => {
    const errorMessage = 'Error occurred while getting CNB transactions';
    const mockError = {
      response: {
        data: {
          message: errorMessage,
          details: 'Something went wrong',
        },
        status: 400,
      },
    };
    httpService.get.mockReturnValue(throwError(() => mockError));

    service.getCnbTransactions(input, merchantId).subscribe({
      next: done,
      error: (error) => {
        expect(error.message).toEqual(
          'Error occurred while getting CNB transactions',
        );
        expect(error.code).toEqual(ErrorCodes.TL_OPENSEARCH_ERROR);
        done();
      },
    });
  });

  describe('getMonthlyCommissionSummary', () => {
    it('should call API with correct parameters', (done) => {
      const mockUrl = 'http://custom-api.com';
      httpService.get.mockReturnValue(of(commissionResponse));

      service
        .getMonthlyCommissionSummary('123', '2025-04', '2025-05')
        .subscribe({
          next: (response) => {
            expect(response).toBeDefined();
            expect(httpService.get).toHaveBeenCalledWith(
              `${mockUrl}/api/v1/commissions/123`,
              {
                params: {
                  startMonth: '2025-04',
                  endMonth: '2025-05',
                  channel: 'CNB',
                },
              },
            );
            done();
          },
          error: done,
        });
    });

    it('should handle errors', (done) => {
      const errorMessage = 'Commission summary error';
      httpService.get.mockReturnValue(
        throwError(() => ({
          response: {
            data: { message: errorMessage },
            status: 400,
          },
        })),
      );

      service
        .getMonthlyCommissionSummary('123', '2025-04', '2025-05')
        .subscribe({
          next: () => done.fail('Should have failed'),
          error: (error) => {
            expect(error.message).toBe(errorMessage);
            expect(error.code).toBe(ErrorCodes.TL_OPENSEARCH_ERROR);
            done();
          },
        });
    });
  });
});
