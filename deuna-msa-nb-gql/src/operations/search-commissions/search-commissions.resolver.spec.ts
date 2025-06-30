import { Test, TestingModule } from '@nestjs/testing';
import { SearchCommissionsResolver } from './search-commissions.resolver';
import { SearchCommissionsService } from './services/search-commissions.service';
import { SearchCommissionsInputDto } from './dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto } from './dto/search-commissions-response.dto';
import { of, throwError } from 'rxjs';
import { ValidationAuthGuard } from '../../core/guards/validation-auth.guard';
import { GetClientGuard } from '../../core/guards/get-client.guard';
import { ClientInfo } from '../../core/schema/merchat-client.schema';

describe('SearchCommissionsResolver', () => {
  let resolver: SearchCommissionsResolver;
  let service: jest.Mocked<SearchCommissionsService>;

  beforeEach(async () => {
    const mockService = {
      searchCommissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchCommissionsResolver,
        {
          provide: SearchCommissionsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(ValidationAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(GetClientGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    resolver = module.get<SearchCommissionsResolver>(SearchCommissionsResolver);
    service = module.get(SearchCommissionsService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('searchCommissions', () => {
    const input: SearchCommissionsInputDto = {
      startMonth: '2025-01',
      endMonth: '2025-03',
      page: 1,
      size: 10,
    };

    const mockCustomerId = 'actual-customer-id-from-context';
    const mockContext = {
      req: {
        headers: {
          'client-info': { id: mockCustomerId } as ClientInfo,
        },
      },
    };

    it('should call searchCommissionsService.searchCommissions and return the result', async () => {
      const expectedResponse: SearchCommissionsResponseDto = {
        totalElements: 1,
        totalPages: 1,
        currentPage: 1,
        commissions: [
          {
            id: 'some-id',
            type: 'SALE',
            amount: 150.75,
            transactionDate: '2025-02-15',
            status: 'PENDING',
          },
        ],
      };

      service.searchCommissions.mockReturnValue(of(expectedResponse));

      const result = await resolver.searchCommissions(input, mockContext);

      expect(service.searchCommissions).toHaveBeenCalledWith(
        input,
        mockCustomerId,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('should propagate errors from the service', async () => {
      const expectedError = new Error('Service error');

      service.searchCommissions.mockReturnValue(
        throwError(() => expectedError),
      );

      await expect(
        resolver.searchCommissions(input, mockContext),
      ).rejects.toThrow(expectedError);
      expect(service.searchCommissions).toHaveBeenCalledWith(
        input,
        mockCustomerId,
      );
    });

    it('should throw an error if customer info is missing in context', async () => {
      const contextWithoutClientInfo = {
        req: {
          headers: {}, // No 'client-info'
        },
      };

      await expect(
        resolver.searchCommissions(input, contextWithoutClientInfo),
      ).rejects.toThrow('Customer info is required, customer info is missing');
      expect(service.searchCommissions).not.toHaveBeenCalled();
    });
  });
});
