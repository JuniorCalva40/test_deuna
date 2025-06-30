import { Observable } from 'rxjs';
import { SearchCommissionsInputDto } from '../dto/search-commissions-input.dto';
import { SearchCommissionsResponseDto } from '../dto/search-commissions-response.dto';

export interface IMsaMcCrCommissionsService {
  searchCommissions(
    merchantId: string,
    input: SearchCommissionsInputDto,
    startMonth: string,
    endMonth: string,
  ): Observable<SearchCommissionsResponseDto>;
}
