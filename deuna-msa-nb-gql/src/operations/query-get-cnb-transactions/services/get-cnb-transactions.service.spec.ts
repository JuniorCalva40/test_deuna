import { Test, TestingModule } from '@nestjs/testing';
import { GetCnbTransactionsService } from './get-cnb-transactions.service';
import { MSA_TL_OPENSEARCH_MANAGER_SERVICE } from '../../../external-services/msa-tl-opensearch-manager/providers/msa-tl-opensearch-manager.provider';
import { Logger } from '@nestjs/common';
import { GetCnbTransactionsInput } from '../dto/get-cnb-transactions-input.dto';
import {
  TransactionChannelId,
  TransactionChannelType,
} from '../../../common/constants/common';
import { of, throwError } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { GetCnbTransactionsResponseDto } from '../../../external-services/msa-tl-opensearch-manager/dto/get-transactions-reponse.dto';

describe('GetCnbTransactionsService', () => {
  let service: GetCnbTransactionsService;
  let mockMsaTlOpensearchManagerService: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockMsaTlOpensearchManagerService = {
      getCnbTransactions: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetCnbTransactionsService,
        {
          provide: MSA_TL_OPENSEARCH_MANAGER_SERVICE,
          useValue: mockMsaTlOpensearchManagerService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<GetCnbTransactionsService>(GetCnbTransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call getCnbTransactions with correct parameters', async () => {
    const input: GetCnbTransactionsInput = {
      fromDate: '2023-01-01',
      toDate: '2023-01-31',
      page: 1,
      size: 10,
      transacitonType: TransactionChannelType.DEPOSIT,
    };

    const apiResponse: GetCnbTransactionsResponseDto = {
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
          description: 'test description',
        },
        {
          id: '2',
          amount: 100.0,
          currency: 'USD',
          date: '2023-10-01',
          source: 'Bank Transfer',
          transactionChannelId: TransactionChannelId.INTTRANFERRETIROCNBS,
          description: 'test description',
        },
      ],
    };
    mockMsaTlOpensearchManagerService.getCnbTransactions.mockReturnValue(
      of(apiResponse),
    );

    const result = await service.getCnbTransactions(input, 'test-merchantid');

    expect(
      mockMsaTlOpensearchManagerService.getCnbTransactions,
    ).toHaveBeenCalledWith(input, 'test-merchantid');
    expect(result.status).toEqual('SUCCESS');
  });

  it('should handle HTTP 400 error', async () => {
    const input: GetCnbTransactionsInput = {
      fromDate: '2023-01-01',
      toDate: '2023-01-31',
      page: 1,
      size: 10,
      transacitonType: TransactionChannelType.DEPOSIT,
    };
    const error = {
      code: ErrorCodes.TL_OPENSEARCH_ERROR,
      message: 'format date is invalid',
      details: {
        status: 400,
        data: { message: 'Bad Request' },
      },
    };

    mockMsaTlOpensearchManagerService.getCnbTransactions.mockReturnValue(
      throwError(() => error),
    );

    jest
      .spyOn(ErrorHandler, 'handleError')
      .mockImplementation((errorConfig) => {
        throw new Error(errorConfig.message);
      });

    await expect(
      service.getCnbTransactions(input, 'test-merchantid'),
    ).rejects.toThrow('format date is invalid');

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(
      error,
      'get-cnb-transactions',
    );
  });
});
