import { TransactionType } from '../../config/fields/transaction-types';
import { Transaction, TransactionTransfer } from './deposit-transaction.types';

export function isDeposit(
  transaction: Transaction | TransactionTransfer,
): boolean {
  return transaction.type == TransactionType.DEPOSIT;
}
