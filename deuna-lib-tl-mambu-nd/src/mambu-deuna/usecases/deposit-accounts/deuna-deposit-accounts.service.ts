import { Injectable } from '@nestjs/common';
import { DepositAccountSubState } from '../../config/constants';
import { CUSTOM_FIELDS } from '../../config/custom-fields/custom-fields.types';
import { LogDeunaMambu } from '../../utils/deuna-mambu-logger';
import { INTEREST_ERROR_CODES_ALLOWED } from './deuna-deposit-accounts.constants';
import { AccountProcess, AccountState, AccountSubState, DepositAccountCustom, FieldCriteria } from './deuna-deposit-accounts.types';
import { DepositAccountService } from '../../../mambu-core/usecases/deposit-accounts/deposit-account.service';
import { DetailsLevel, FilterCriteria } from '../../../mambu-core/config/fields/search-params.type';
import { CriteriaOperator, MambuOps } from '../../../mambu-core/mambu.types';
import { MambuDomain } from '../../../mambu-core/config/constants/mambu.constants';
import { MambuException } from '../../../mambu-core/utils/mambu.exception';

@Injectable()
export class DeunaDepositAccountsService {
  constructor(private depositAccount: DepositAccountService) {}

  @LogDeunaMambu()
  async fetchById(
    accountId: string,
    detailsLevel: DetailsLevel = DetailsLevel.FULL,
  ): Promise<DepositAccountCustom> {
    return (await this.depositAccount.fetchById(
      accountId,
      detailsLevel,
    )) as unknown as DepositAccountCustom;
  }

  @LogDeunaMambu()
  async activeAccount(accountId: string) {
    await this.changeAccountSubState(accountId, {
      last_state_date: new Date(),
      current_state: DepositAccountSubState.ACTIVE,
    });
  }

  @LogDeunaMambu()
  async inactiveAccount(accountId: string, trxId: string, balance: string) {
    await this.changeAccountSubState(accountId, {
      last_state_date: new Date(),
      current_state: DepositAccountSubState.INACTIVE,
      external_trx_id: trxId,
      state_balance: balance,
    });
  }

  @LogDeunaMambu()
  async assignProcess(accountId: string, accountProcess: AccountProcess) {
    const fields = [
      {
        op: MambuOps.ADD,
        path: CUSTOM_FIELDS[MambuDomain.ACCOUNTS].process.section,
        value: accountProcess,
      },
    ];
    await this.depositAccount.update(accountId, fields);
  }

  @LogDeunaMambu()
  async removeProcess(accountId: string) {
    const fields = [
      {
        op: MambuOps.ADD,
        path: CUSTOM_FIELDS[MambuDomain.ACCOUNTS].process.section,
        value: {
          process_id: null,
          process_name: null,
        } as AccountProcess,
      },
    ];
    await this.depositAccount.update(accountId, fields);
  }

  @LogDeunaMambu()
  async changeAccountSubState(accountId: string, state: AccountSubState) {
    await this.depositAccount.update(accountId, [
      {
        op: MambuOps.ADD,
        path: CUSTOM_FIELDS[MambuDomain.ACCOUNTS].subState.section,
        value: state,
      },
    ]);
  }

  @LogDeunaMambu()
  async applyInterest(accountId: string, notes?: string) {
    try {
      await this.depositAccount.applyInterest({
        accountId,
        notes,
        interestApplicationDate: new Date(),
      });
    } catch (e) {
      if (e instanceof MambuException) {
        let error = e.error;
        if (INTEREST_ERROR_CODES_ALLOWED.includes(error.errorCode)) {
          return;
        }
      }
      throw e;
    }
  }

  @LogDeunaMambu()
  async fetchByCustomParams(
    accountHolderId: string,
    accountState?: AccountState
  ): Promise<DepositAccountCustom[]> {
    const filterCriteria : FilterCriteria = {
      filterCriteria:[
        {
          field: FieldCriteria.ACCOUNT_HOLDER_KEY,
          operator: CriteriaOperator.EQUALS_CASE_SENSITIVE,
          value: accountHolderId
        },
        ...( accountState? [ 
          {
            field: FieldCriteria.ACCOUNT_STATE,
            operator: CriteriaOperator.EQUALS_CASE_SENSITIVE,
            value: accountState
          }
        ]: [])
      ]
    };
    const { data: response } = await this.depositAccount.search(filterCriteria);
    return response as DepositAccountCustom[];
  }
}
