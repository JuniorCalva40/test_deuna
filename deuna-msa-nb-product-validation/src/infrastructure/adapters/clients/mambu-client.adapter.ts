import { Injectable, Logger } from '@nestjs/common';
import { DeunaDepositAccountsService } from '@deuna/tl-mambu-nd';
import {
  Account,
  AccountStatus,
} from '../../../domain/entities/account.entity';

import { AccountNotFoundError } from '../../../domain/errors/product-validation.error';
import { MambuClientPort } from 'src/application/ports/out/clients/mambu.client.port';

@Injectable()
export class MambuClientAdapter implements MambuClientPort {
  constructor(
    private readonly deunaDepositAccountsService: DeunaDepositAccountsService,
  ) {}

  async getAccountById(accountId: string): Promise<Account> {
    try {
      const mambuAccount =
        await this.deunaDepositAccountsService.fetchById(accountId);

      return mambuAccount;
    } catch (error) {
      throw new AccountNotFoundError(accountId);
    }
  }

  async getAccountByNumber(accountNumber: string): Promise<Account> {
    try {
      const mambuAccount =
        await this.deunaDepositAccountsService.fetchById(accountNumber);

      // Mapear la respuesta de Mambu a nuestra entidad de dominio
      const account: Account = {
        id: mambuAccount.id,
        accountNumber: mambuAccount.id,
        balance: mambuAccount.balances.totalBalance,
        availableBalance: mambuAccount.balances.availableBalance,
        status: this.mapAccountStatus(mambuAccount.accountState, mambuAccount),
        currency: mambuAccount.currencyCode,
        clientId: mambuAccount.accountHolderKey,
      };

      return account;
    } catch (error) {
      throw new AccountNotFoundError(accountNumber);
    }
  }

  private mapAccountStatus(mambuState: string, account: any): AccountStatus {
    switch (mambuState) {
      case 'ACTIVE':
        return AccountStatus.ACTIVE;
      case 'LOCKED':
        return AccountStatus.BLOCKED;
      case 'DORMANT':
        return AccountStatus.SUSPENDED;
      case 'CLOSED':
        return AccountStatus.CLOSED;
      default:
        return AccountStatus.INACTIVE;
    }
  }
}
