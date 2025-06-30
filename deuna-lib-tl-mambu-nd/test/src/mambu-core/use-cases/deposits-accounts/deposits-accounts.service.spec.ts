import { Test, TestingModule } from '@nestjs/testing';
import {
  DepositTransactionService,
  TransactionTransfer,
  PaginationDetails,
  DetailsLevel,
  FilterCriteria,
  Pagination,
  EnablePaginationDetails,
} from '../../../../../src';
import { MAMBU_CLIENT } from '../../../../../src/mambu-core/constants/constants';
import { MambuRestService } from '../../../../../src/mambu-core/mambu-rest.service';
import { transactionMock } from '../../../../mocks/data.mocks';

describe('DepositTransactionService', () => {
  let service: DepositTransactionService;
  let mambuRestService: jest.Mocked<MambuRestService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositTransactionService,
        {
          provide: MAMBU_CLIENT,
          useValue: {
            domain: 'https://domain.com',
            user: 'user',
            password: 'password',
          },
        },
        {
          provide: MambuRestService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DepositTransactionService>(DepositTransactionService);
    mambuRestService = module.get(MambuRestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('getById', () => {
    it('should call DepositTransactionService.getById success', async () => {
      const id = '7700002629';
      mambuRestService.get.mockResolvedValue(transactionMock);
      const response = await service.getById(id);
      expect(response).toEqual(transactionMock);
      expect(mambuRestService.get).toHaveBeenCalledWith(
        'https://domain.com/deposits/transactions/7700002629',
        {
          params: { detailsLevel: 'BASIC' },
        },
      );
      expect(mambuRestService.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('DepositTransactionService - search', () => {
    it('should call mambuRestService.search with correct parameters', async () => {
      const filterCriteria: FilterCriteria = {
        filterCriteria: [],
      };
      const pagination: Pagination = {
        offset: 0,
        limit: 10,
        paginationDetails: EnablePaginationDetails.ON,
      };
      const detailsLevel: DetailsLevel = DetailsLevel.FULL;
      const mockResponse = {
        data: [
          { id: '1', amount: 100 },
          { id: '2', amount: 200 },
        ],
        paginationDetails: {
          itemsTotal: 2,
          itemsOffset: 0,
          itemsLimit: 10,
        } as PaginationDetails,
      };

      mambuRestService.search.mockReturnValue(Promise.resolve(mockResponse));

      const result = await service.search(
        filterCriteria,
        pagination,
        detailsLevel,
      );

      expect(mambuRestService.search).toHaveBeenCalledWith(
        'https://domain.com/deposits/transactions:search',
        filterCriteria,
        {
          params: {
            detailsLevel,
            offset: pagination.offset,
            limit: pagination.limit,
            paginationDetails: pagination.paginationDetails,
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });
    it('should call mambuRestService.search with default parameters if none are provided', async () => {
      const mockResponse = {
        data: [],
        paginationDetails: {
          itemsLimit: 0,
          itemsOffset: 0,
          itemsTotal: 0,
        } as PaginationDetails,
      };
      mambuRestService.search.mockReturnValue(Promise.resolve(mockResponse));

      await service.search();

      expect(mambuRestService.search).toHaveBeenCalledWith(
        'https://domain.com/deposits/transactions:search',
        undefined,
        {
          params: {
            detailsLevel: DetailsLevel.BASIC,
            offset: undefined,
            limit: undefined,
            paginationDetails: undefined,
          },
        },
      );
    });

    it('should handle errors from mambuRestService.search', async () => {
      const errorMessage = 'Mambu API Error';
      mambuRestService.search.mockRejectedValue(new Error(errorMessage)); // Use mockRejectedValue for errors

      await expect(service.search()).rejects.toThrow(errorMessage); // Use expect.rejects.toThrow
    });
  });

  describe('makeTransaction', () => {
    it('should call DepositTransactionService.makeTransaction success', async () => {
      const transaction: TransactionTransfer = {
        amount: 100,
        transactionDetails: {
          transactionChannelId: 'transactionChannelId',
        },
        parentAccountKey: 'parentAccountKey',
      };
      mambuRestService.post.mockResolvedValue(transactionMock);
      const response = await service.makeTransaction(transaction);
      expect(response).toEqual(transactionMock);
      expect(mambuRestService.post).toHaveBeenCalledWith(
        'https://domain.com/deposits/parentAccountKey/withdrawal-transactions',
        {
          amount: 100,
          transactionDetails: {
            transactionChannelId: 'transactionChannelId',
          },
          parentAccountKey: 'parentAccountKey',
          paymentOrderId: expect.any(String),
          externalId: expect.any(String),
        },
      );
      expect(mambuRestService.post).toHaveBeenCalledTimes(1);
    });
  });
});
