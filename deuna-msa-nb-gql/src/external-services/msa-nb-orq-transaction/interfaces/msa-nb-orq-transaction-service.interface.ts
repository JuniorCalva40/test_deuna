import { Observable } from 'rxjs';
import { InitiateDepositInput } from '../dto/msa-nb-orq-transaction-input.dto';
import { initiateDepositResponseDto } from '../dto/msa-nb-orq-transaction-response.dto';

export interface IMsaNbOrqTransactionService {
  initiateDeposit(
    input: InitiateDepositInput,
  ): Observable<initiateDepositResponseDto>;
}
