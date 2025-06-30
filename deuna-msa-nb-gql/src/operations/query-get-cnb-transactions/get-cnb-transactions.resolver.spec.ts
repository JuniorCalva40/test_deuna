import { Test, TestingModule } from '@nestjs/testing';
import { GetCnbTransactionsResolver } from './get-cnb-transactions.resolver';
import { GetCnbTransactionsService } from './services/get-cnb-transactions.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { GetCnbTransactionsResponse } from './dto/get-cnb-transactions-response.dto';
import { GetCnbTransactionsInput } from './dto/get-cnb-transactions-input.dto';
import { TransactionChannelType } from '../../common/constants/common';

describe('GetCnbTransactionsResolver', () => {
  let resolver: GetCnbTransactionsResolver;
  let cnbTransactionsService: jest.Mocked<GetCnbTransactionsService>;

  beforeEach(async () => {
    const mockCnbTransactionsService = {
      getCnbTransactions: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockHttpService = {
      axiosRef: {
        get: jest.fn(),
        post: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        GetCnbTransactionsResolver,
        {
          provide: GetCnbTransactionsService,
          useValue: mockCnbTransactionsService,
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    resolver = module.get<GetCnbTransactionsResolver>(
      GetCnbTransactionsResolver,
    );
    cnbTransactionsService = module.get(
      GetCnbTransactionsService,
    ) as jest.Mocked<GetCnbTransactionsService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should call cnbTransactions.getCnbTransactions and return the result', async () => {
    const mockInput: GetCnbTransactionsInput = {
      fromDate: '2023-01-01',
      toDate: '2023-01-31',
      page: 1,
      size: 10,
      transacitonType: TransactionChannelType.DEPOSIT,
    };

    const expectedResponse: GetCnbTransactionsResponse = {
      status: 'SUCCESS',
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
          type: TransactionChannelType.DEPOSIT,
          description: 'test description',
        },
        {
          id: '2',
          amount: 100.0,
          currency: 'USD',
          date: '2023-10-01',
          source: 'Bank Transfer',
          type: TransactionChannelType.WITHDRAWAL,
          description: 'test description',
        },
      ],
    };

    cnbTransactionsService.getCnbTransactions.mockResolvedValue(
      expectedResponse,
    );

    const result = await resolver.getCnbTransactions(mockInput, {
      req: {
        headers: {
          'user-person': {
            email: 'test@test.com',
            phoneNumber: '12345679',
            identification: 'order-id',
          },
          'auth-token': {
            sessionId: 'test-session-Id',
            deviceId: 'test-device-id',
          },
          'client-info': { id: 'merchant-id-test' },
          id: 'test-trackinId',
          'x-public-ip': 'test-ip',
        },
      },
    });

    expect(cnbTransactionsService.getCnbTransactions).toHaveBeenCalledWith(
      mockInput,
      'merchant-id-test',
    );
    expect(result).toEqual(expectedResponse);
  });

  it('should handle errors from cnbTransactions.getCnbTransactions', async () => {
    const mockInput: GetCnbTransactionsInput = {
      fromDate: '2023-01-01',
      toDate: '2023-01-31',
      page: 1,
      size: 10,
      transacitonType: TransactionChannelType.DEPOSIT,
    };

    const expectedError = new Error(
      'Customer info is required, customer info is missing',
    );

    cnbTransactionsService.getCnbTransactions.mockRejectedValue(expectedError);

    await expect(
      resolver.getCnbTransactions(mockInput, {
        req: {
          headers: {
            'user-person': {
              email: 'test@test.com',
              phoneNumber: '12345679',
              identification: 'order-id',
            },
            'auth-token': {
              sessionId: 'test-session-Id',
              deviceId: 'test-device-id',
            },
            trackingid: 'test-trackinId',
            'x-public-ip': 'test-ip',
          },
        },
      }),
    ).rejects.toThrow(expectedError);
  });
});
