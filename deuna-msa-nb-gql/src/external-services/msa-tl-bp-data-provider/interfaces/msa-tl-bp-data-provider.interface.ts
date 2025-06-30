import { Observable } from 'rxjs';
import { BlackListResponseDTO } from '../dto/black-list-response.dto';
import { BlackListRequestDTO } from '../dto/black-list-request.dto';

export interface IMsaTlBpDataProviderService {
  validateBlacklist(
    request: BlackListRequestDTO,
  ): Observable<BlackListResponseDTO>;
}
