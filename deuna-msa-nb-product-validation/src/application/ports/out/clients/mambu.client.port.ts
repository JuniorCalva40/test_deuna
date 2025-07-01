import { Account } from 'src/domain/entities/account.entity';

export interface MambuClientPort {
  getAccountByNumber(accountNumber: string): Promise<Account>;
}
