import { Observable } from 'rxjs';
import { ValidateBalanceInput } from '../dto/msa-co-transfer-orchestration-input.dto';
import { ValidateBalanceResponse } from '../dto/msa-co-transfer-orchestration-response.dto';

export interface IMsaCoTransferOrchestrationService {
  validateBalance(
    input: ValidateBalanceInput,
  ): Observable<ValidateBalanceResponse>;
}
