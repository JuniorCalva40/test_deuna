import { Test, TestingModule } from '@nestjs/testing';
import { SearchCommissionsService } from './search-commissions.service';
import { MsaMcCrCommissionsService } from '../../../external-services/deuna-msa-mc-cr-commissions/services/deuna-msa-mc-cr-commissions.service';
import { MSA_CR_COMMISIONS_SERVICE } from '../../../external-services/deuna-msa-mc-cr-commissions/providers/deuna-msa-mc-cr-commissions.provider';
import { SearchCommissionsInputDto } from '../dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto as ExternalSearchCommissionsResponseDto } from '../../../external-services/deuna-msa-mc-cr-commissions/dto/search-commissions-response.dto';
import { of } from 'rxjs';

describe('SearchCommissionsService', () => {
  let service: SearchCommissionsService;
  let commissionsServiceMock: MsaMcCrCommissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchCommissionsService,
        {
          provide: MSA_CR_COMMISIONS_SERVICE,
          useValue: {
            searchCommissions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchCommissionsService>(SearchCommissionsService);
    commissionsServiceMock = module.get<MsaMcCrCommissionsService>(
      MSA_CR_COMMISIONS_SERVICE,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchCommissions', () => {
    it('should call commissionsService.searchCommissions and map the response', (done) => {
      const input: SearchCommissionsInputDto = {
        startMonth: '2023-01',
        endMonth: '2023-03',
        page: 1,
        size: 10,
      };

      const externalResponse: ExternalSearchCommissionsResponseDto = {
        totalElements: 1,
        totalPages: 1,
        currentPage: 1,
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
        ],
      };

      jest
        .spyOn(commissionsServiceMock, 'searchCommissions')
        .mockReturnValue(of(externalResponse));

      const expectedResponse = {
        totalElements: 1,
        totalPages: 1,
        currentPage: 1,
        commissions: [
          {
            id: '44fffbaa-5e6a-4116-ac0c-510947ccc413',
            type: 'DEPOSIT',
            amount: 0.14,
            transactionDate: '2025-02-02T10:30:00Z',
            status: 'PENDING',
          },
        ],
      };

      service.searchCommissions(input, 'merchant-id').subscribe((result) => {
        expect(commissionsServiceMock.searchCommissions).toHaveBeenCalledWith(
          'merchant-id',
          input,
          input.startMonth,
          input.endMonth,
        );
        expect(result).toEqual(expectedResponse);
        done();
      });
    });
  });
});
