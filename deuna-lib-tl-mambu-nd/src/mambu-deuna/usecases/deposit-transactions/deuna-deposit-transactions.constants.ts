export enum TransactionReason {
  ORIGINAL = 'ORIGINAL',
  REVERSAL = 'REVERSAL',
}

export const TRANSACTION_REASON = {
  [TransactionReason.ORIGINAL]: TransactionReason.REVERSAL,
};
