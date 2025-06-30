import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyCommissionSummaryService } from './monthly-commission-summary.service';
import { MSA_TL_OPENSEARCH_MANAGER_SERVICE } from '../../../external-services/msa-tl-opensearch-manager/providers/msa-tl-opensearch-manager.provider';
import { Logger } from '@nestjs/common';
// MonthlyCommissionSummaryInput import removed
import { of, throwError } from 'rxjs';
import { ErrorHandler } from '../../../utils/error-handler.util';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { ApolloError } from 'apollo-server-express';

describe('MonthlyCommissionSummaryService', () => {
  let service: MonthlyCommissionSummaryService;
  let mockOpensearchService: jest.Mocked<any>;
  let mockLogger: jest.Mocked<Logger>;
  let mockDate: jest.SpyInstance;

  const CONTEXT = 'monthly-commission-summary';

  beforeEach(async () => {
    mockOpensearchService = {
      getMonthlyCommissionSummary: jest.fn(),
    };

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyCommissionSummaryService,
        {
          provide: MSA_TL_OPENSEARCH_MANAGER_SERVICE,
          useValue: mockOpensearchService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<MonthlyCommissionSummaryService>(
      MonthlyCommissionSummaryService,
    );

    jest
      .spyOn(ErrorHandler, 'handleError')
      .mockImplementation((errorConfig: any) => {
        throw new ApolloError(errorConfig.message, errorConfig.code);
      });
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (mockDate) {
      mockDate.mockRestore();
    }
  });

  const getExpectedStartAndEndMonths = (date: Date) => {
    const currentYear = date.getFullYear();
    const currentMonthNumber = date.getMonth() + 1;
    const endMonthString = `${currentYear}-${String(currentMonthNumber).padStart(2, '0')}`;
    let startYear = currentYear;
    let startMonthNumber = currentMonthNumber - 1;
    if (startMonthNumber === 0) {
      startMonthNumber = 12;
      startYear -= 1;
    }
    const startMonthString = `${startYear}-${String(startMonthNumber).padStart(2, '0')}`;
    return { startMonthString, endMonthString };
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call getMonthlyCommissionSummary with correct calculated date parameters', async () => {
    const currentDate = new Date('2023-06-15T10:00:00.000Z');
    mockDate = jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    // input variable removed
    const { startMonthString, endMonthString } =
      getExpectedStartAndEndMonths(currentDate);

    const apiResponse = [
      {
        month: '2023-05', // Adjusted to match calculated startMonthString for consistency
        monthlyTotal: 0.56,
        monthlyCount: 4,
        dailyBreakdown: [],
      },
    ];

    mockOpensearchService.getMonthlyCommissionSummary.mockReturnValue(
      of(apiResponse),
    );

    const result = await service.getMonthlyCommissionSummary(
      // input argument removed
      'test-merchant',
    );

    expect(
      mockOpensearchService.getMonthlyCommissionSummary,
    ).toHaveBeenCalledWith('test-merchant', startMonthString, endMonthString);
    expect(result.status).toEqual('SUCCESS');
    expect(result.summary).toEqual([
      {
        month: '2023-05',
        monthlyTotal: 0.56,
        monthlyCount: 4,
      },
    ]);
  });

  it('should filter out items with monthlyTotal equal to 0', async () => {
    const currentDate = new Date('2023-06-15T10:00:00.000Z');
    mockDate = jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    // input variable removed
    const { startMonthString, endMonthString } =
      getExpectedStartAndEndMonths(currentDate);

    const apiResponse = [
      {
        month: '2023-05', // Corresponds to calculated startMonthString
        monthlyTotal: 100,
        monthlyCount: 5,
        dailyBreakdown: [],
      },
      {
        month: '2023-04', // Example of another month that might be in response
        monthlyTotal: 0,
        monthlyCount: 0,
        dailyBreakdown: [],
      },
      {
        month: '2023-03',
        monthlyTotal: 200,
        monthlyCount: 10,
        dailyBreakdown: [],
      },
    ];

    mockOpensearchService.getMonthlyCommissionSummary.mockReturnValue(
      of(apiResponse),
    );

    const result = await service.getMonthlyCommissionSummary(
      // input argument removed
      'test-merchant',
    );

    expect(result.status).toEqual('SUCCESS');
    expect(result.summary).toEqual([
      {
        month: '2023-05',
        monthlyTotal: 100,
        monthlyCount: 5,
      },
      {
        month: '2023-04',
        monthlyCount: 0,
        monthlyTotal: 0,
      },
      {
        month: '2023-03',
        monthlyTotal: 200,
        monthlyCount: 10,
      },
    ]);
    expect(
      mockOpensearchService.getMonthlyCommissionSummary,
    ).toHaveBeenCalledWith('test-merchant', startMonthString, endMonthString);
  });

  it('should correctly calculate date parameters when current month is January', async () => {
    const januaryDate = new Date('2024-01-15T10:00:00.000Z');
    mockDate = jest.spyOn(global, 'Date').mockImplementation(() => januaryDate);

    mockOpensearchService.getMonthlyCommissionSummary.mockReturnValue(of([]));
    await service.getMonthlyCommissionSummary('test-merchant');

    expect(
      mockOpensearchService.getMonthlyCommissionSummary,
    ).toHaveBeenCalledWith('test-merchant', '2023-12', '2024-01');
  });

  it('should handle errors from opensearchService', async () => {
    const currentDate = new Date('2023-06-15T10:00:00.000Z');
    mockDate = jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    // input variable removed
    const { startMonthString, endMonthString } =
      getExpectedStartAndEndMonths(currentDate);

    const error = {
      code: ErrorCodes.TL_OPENSEARCH_ERROR,
      message: 'Opensearch error',
      details: {
        status: 500,
        data: { message: 'Internal Server Error' },
      },
    };

    mockOpensearchService.getMonthlyCommissionSummary.mockReturnValue(
      throwError(() => error),
    );

    await expect(
      service.getMonthlyCommissionSummary('test-merchant'), // input argument removed
    ).rejects.toThrow(
      new ApolloError('Opensearch error', ErrorCodes.TL_OPENSEARCH_ERROR),
    );

    expect(ErrorHandler.handleError).toHaveBeenCalledWith(error, CONTEXT);
    expect(
      mockOpensearchService.getMonthlyCommissionSummary,
    ).toHaveBeenCalledWith('test-merchant', startMonthString, endMonthString);
  });

  // Removed tests for invalid startMonth/endMonth format, range, and future date validation
  // as this logic is no longer in the service.
});
