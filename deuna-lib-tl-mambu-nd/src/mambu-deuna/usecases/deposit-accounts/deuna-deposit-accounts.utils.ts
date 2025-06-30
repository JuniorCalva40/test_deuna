import { DepositAccountSubState } from '../../config/constants';
import { DepositAccountCustom } from './deuna-deposit-accounts.types';

export function isInactive(account: DepositAccountCustom) {
  const state = account._account_state_detail?.current_state;
  return state !== null && state === DepositAccountSubState.INACTIVE;
}

export function isActive(account: DepositAccountCustom) {
  const state = account._account_state_detail?.current_state;
  return state !== null && state === DepositAccountSubState.ACTIVE;
}
