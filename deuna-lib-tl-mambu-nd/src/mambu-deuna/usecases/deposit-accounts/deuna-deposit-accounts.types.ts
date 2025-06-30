import { DepositAccount } from '../../../mambu-core/usecases/deposit-accounts/deposit-account.types';
import { DepositAccountSubState } from '../../config/constants';
import { AccountsProcess } from './deuna-deposit-accounts.constants';

export class AccountProcess {
  process_id: string;
  process_name?: AccountsProcess;
}

export class AccountSubState {
  current_state?: DepositAccountSubState;
  last_state_date?: Date;
  state_balance?: string;
  external_trx_id?: string;
}
export class DepositAccountCustom extends DepositAccount {
  _account_state_detail?: AccountSubState;
}

export enum AccountState {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  ACTIVE_IN_ARREARS = 'ACTIVE_IN_ARREARS',
  MATURED = 'MATURED',
  LOCKED = 'LOCKED',
  DORMANT = 'DORMANT',
  CLOSED = 'CLOSED',
  ACTIVE = 'ACTIVE',
  CLOSED_WRITTEN_OFF = 'CLOSED_WRITTEN_OFF',
  WITHDRAWN = 'WITHDRAWN',
  CLOSED_REJECTED = 'CLOSED_REJECTED',
}

export enum FieldCriteria {
  ACCOUNT_HOLDER_KEY = "accountHolderKey",
  ACCOUNT_STATE = "accountState",
}
