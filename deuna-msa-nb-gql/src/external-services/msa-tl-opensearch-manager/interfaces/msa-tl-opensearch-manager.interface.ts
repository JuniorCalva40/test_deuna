import { Observable } from 'rxjs';
import { GetCnbTransactionsInputdto } from '../dto/get-transactions-input.dto';
import { GetCnbTransactionsResponseDto } from '../dto/get-transactions-reponse.dto';

export interface IMsaTlOpensearchManagerService {
  getCnbTransactions(
    input: GetCnbTransactionsInputdto,
    merchanId: string,
  ): Observable<GetCnbTransactionsResponseDto>;

  getMonthlyCommissionSummary(
    merchantId: string,
    startMonth: string,
    endMonth: string,
  ): Observable<any>;
}
