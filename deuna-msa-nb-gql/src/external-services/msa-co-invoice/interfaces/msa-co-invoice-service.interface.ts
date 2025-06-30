import { CreateAccountDto } from '../dto/create-account.dto';
import { Observable } from 'rxjs';

export interface IMsaCoInvoiceService {
  createAccount(accountData: CreateAccountDto): Observable<any>;
}
