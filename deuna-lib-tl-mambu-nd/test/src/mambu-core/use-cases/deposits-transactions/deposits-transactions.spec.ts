import { Test, TestingModule } from '@nestjs/testing';
import {
  ChangeStateActions,
  ChangeStatus,
  DepositAccountService,
  DetailsLevel,
  EnablePaginationDetails,
  FilterCriteria,
  Pagination,
  PaginationDetails,
} from '../../../../../src';
import { MAMBU_CLIENT } from '../../../../../src/mambu-core/constants/constants';
import { MambuRestService } from '../../../../../src/mambu-core/mambu-rest.service';
import {
  EditionField,
  MambuOps,
} from '../../../../../src/mambu-core/mambu.types';
import { transactionMock } from '../../../../mocks/data.mocks';

describe('DepositAccountService', () => {
  let service: DepositAccountService;
  let mambuRestService: jest.Mocked<MambuRestService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositAccountService,
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
            patch: jest.fn(),
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DepositAccountService>(DepositAccountService);
    mambuRestService = module.get(MambuRestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('fetchById', () => {
    it('should call DepositAccountService.fetchById success', async () => {
      const id = '7700002629';
      mambuRestService.get.mockResolvedValue(transactionMock);
      const response = await service.fetchById(id);
      expect(response).toEqual(transactionMock);
      expect(mambuRestService.get).toHaveBeenCalledWith(
        'https://domain.com/deposits/7700002629',
        {
          params: { detailsLevel: 'BASIC' },
        },
      );
      expect(mambuRestService.get).toHaveBeenCalledTimes(1);
    });
  });
  describe('changeState', () => {
    it('should call DepositAccountService.changeState success', async () => {
      const changeStatus: ChangeStatus = {
        accountId: '7700002629',
        action: ChangeStateActions.CLOSE,
        notes: 'notes',
      };
      mambuRestService.post.mockResolvedValue(undefined);
      const response = await service.changeState(changeStatus);
      expect(response).toBeUndefined();
      expect(mambuRestService.post).toHaveBeenCalledWith(
        'https://domain.com/deposits/7700002629:changeState',
        {
          action: ChangeStateActions.CLOSE,
          notes: 'notes',
        },
      );
      expect(mambuRestService.post).toHaveBeenCalledTimes(1);
    });
  });
  describe('applyInterest', () => {
    it('should call DepositAccountService.applyInterest success', async () => {
      const applyInterest = {
        accountId: '7700002629',
        interestApplicationDate: new Date(),
        notes: 'notes',
      };
      mambuRestService.post.mockResolvedValue(undefined);
      const response = await service.applyInterest(applyInterest);
      expect(response).toBeUndefined();
      expect(mambuRestService.post).toHaveBeenCalledWith(
        'https://domain.com/deposits/7700002629:applyInterest',
        {
          interestApplicationDate: expect.any(String),
          notes: 'notes',
        },
      );
      expect(mambuRestService.post).toHaveBeenCalledTimes(1);
    });
  });
  describe('changeInterestRate', () => {
    it('should call DepositAccountService.changeInterestRate success', async () => {
      const changeInterestRate = {
        accountId: '7700002629',
        interestRate: 0.1,
        valueDate: new Date(),
        notes: 'notes',
      };
      mambuRestService.post.mockResolvedValue(undefined);
      const response = await service.changeInterestRate(changeInterestRate);
      expect(response).toBeUndefined();
      expect(mambuRestService.post).toHaveBeenCalledWith(
        'https://domain.com/deposits/7700002629:changeInterestRate',
        {
          interestRate: 0.1,
          valueDate: expect.any(String),
          notes: 'notes',
        },
      );
      expect(mambuRestService.post).toHaveBeenCalledTimes(1);
    });
  });
  describe('update', () => {
    it('should call DepositAccountService.update success', async () => {
      const accountId = '7700002629';
      const fields: EditionField<any>[] = [
        { op: MambuOps.ADD, path: '/notes', value: 'notes' },
      ];
      mambuRestService.patch.mockResolvedValue(undefined as any);
      const response = await service.update(accountId, fields);
      expect(response).toBeUndefined();
      expect(mambuRestService.patch).toHaveBeenCalledWith(
        'https://domain.com/deposits/7700002629',
        fields,
      );
      expect(mambuRestService.patch).toHaveBeenCalledTimes(1);
    });
  });
  describe('search', () => {
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
            'https://domain.com/deposits:search',
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
            'https://domain.com/deposits:search',
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
  });
});
