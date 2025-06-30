import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyCommissionSummaryResolver } from './monthly-commission-summary.resolver';
import { MonthlyCommissionSummaryService } from './services/monthly-commission-summary.service';
import { MonthlyCommissionSummaryResponse } from './dto/monthly-commission-summary-response.dto';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

describe('MonthlyCommissionSummaryResolver', () => {
  let resolver: MonthlyCommissionSummaryResolver;
  let service: jest.Mocked<MonthlyCommissionSummaryService>;

  beforeEach(async () => {
    const mockService = {
      getMonthlyCommissionSummary: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, HttpModule],
      providers: [
        MonthlyCommissionSummaryResolver,
        {
          provide: MonthlyCommissionSummaryService,
          useValue: mockService,
        },
      ],
    }).compile();

    resolver = module.get<MonthlyCommissionSummaryResolver>(
      MonthlyCommissionSummaryResolver,
    );
    service = module.get(
      MonthlyCommissionSummaryService,
    ) as jest.Mocked<MonthlyCommissionSummaryService>;
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  it('should call service with correct parameters', async () => {
    const expectedResponse: MonthlyCommissionSummaryResponse = {
      status: 'SUCCESS',
      summary: [
        {
          month: '2025-04',
          monthlyTotal: 0.56,
          monthlyCount: 4,
        },
      ],
    };

    service.getMonthlyCommissionSummary.mockResolvedValue(expectedResponse);

    const result = await resolver.getMonthlyCommissionSummary({
      req: {
        headers: {
          'client-info': { id: 'merchant-id-test' },
        },
      },
    });

    expect(service.getMonthlyCommissionSummary).toHaveBeenCalledWith(
      'merchant-id-test',
    );
    expect(result).toEqual(expectedResponse);
  });

  it('should throw error when client info is missing', async () => {
    await expect(
      resolver.getMonthlyCommissionSummary({
        req: { headers: {} },
      }),
    ).rejects.toThrow('Customer info is required, customer info is missing');
  });

  it('should propagate service errors', async () => {
    const expectedError = new Error('Service error');
    service.getMonthlyCommissionSummary.mockRejectedValue(expectedError);

    await expect(
      resolver.getMonthlyCommissionSummary({
        req: {
          headers: {
            'client-info': { id: 'merchant-id-test' },
          },
        },
      }),
    ).rejects.toThrow(expectedError);
  });
});
