import { Inject, Injectable } from '@nestjs/common';
import { SearchCommissionsInputDto } from '../dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto as ExternalSearchCommissionsResponseDto } from 'src/external-services/deuna-msa-mc-cr-commissions/dto/search-commissions-response.dto';
import { Observable, map } from 'rxjs';
import { IMsaMcCrCommissionsService } from '../../../external-services/deuna-msa-mc-cr-commissions/interfaces/deuna-msa-mc-cr-commissions.interface';
import { SearchCommissionsResponseDto } from '../dto/search-commissions-response.dto';
import { MSA_CR_COMMISIONS_SERVICE } from '../../../external-services/deuna-msa-mc-cr-commissions/providers/deuna-msa-mc-cr-commissions.provider';

@Injectable()
export class SearchCommissionsService {
  constructor(
    @Inject(MSA_CR_COMMISIONS_SERVICE)
    private readonly commissionsService: IMsaMcCrCommissionsService,
  ) {}

  searchCommissions(
    input: SearchCommissionsInputDto,
    merchantId: string,
  ): Observable<SearchCommissionsResponseDto> {
    return this.commissionsService
      .searchCommissions(merchantId, input, input.startMonth, input.endMonth)
      .pipe(
        map((response: ExternalSearchCommissionsResponseDto) => {
          return {
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            currentPage: response.currentPage,
            commissions: response.commissions.map((commission) => ({
              id: commission.transactionId,
              type: commission.type,
              amount: commission.amount,
              transactionDate: commission.transactionDate,
              status: 'PENDING', // Campo constante
            })),
          };
        }),
      );
  }
}
