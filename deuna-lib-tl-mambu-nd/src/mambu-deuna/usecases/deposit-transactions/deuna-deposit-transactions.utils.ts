import { TransactionType } from '../../../mambu-core/config/fields/transaction-types';
import { isDeposit } from '../../../mambu-core/usecases/deposit-transactions/deposit-transaction.utils';
import { TRANSACTION_REVERSAL_CHANNEL } from '../../config/finantials/mambu-finantial.types';
import { TransactionReason } from './deuna-deposit-transactions.constants';
import { TransactionCustom } from './deuna-deposit-transactions.types';

export function isOriginal(transaction: TransactionCustom): boolean {
  const { transaction_reason: reason } = transaction._detail_transaction;
  return reason === TransactionReason.ORIGINAL;
}

export function isReversal(transaction: TransactionCustom): boolean {
  const { transaction_reason: reason } = transaction._detail_transaction;
  return reason === TransactionReason.REVERSAL;
}

export function revertTransaction(
  transaction: TransactionCustom,
): TransactionCustom {
  const revertTransaction = { ...transaction };
  revertTransaction.transactionDetails.transactionChannelId =
    revertTransactionalChannel(transaction);
  revertTransaction.type = resolveReverseType(transaction);
  revertTransaction._detail_transaction = revertTransferDetails(transaction);
  return revertTransaction;
}

export function resolveReverseType(transaction: TransactionCustom): string {
  return isDeposit(transaction)
    ? TransactionType.WITHDRAWAL
    : TransactionType.DEPOSIT;
}

export function revertTransactionalChannel(
  transaction: TransactionCustom,
): string {
  const { transactionChannelId } = transaction.transactionDetails;
  const configuredReversalChannel =
    TRANSACTION_REVERSAL_CHANNEL[transactionChannelId];
  if (configuredReversalChannel != null) {
    return configuredReversalChannel;
  }
  return isOriginal(transaction)
    ? `${transactionChannelId}RV`
    : `${transactionChannelId}`.slice(0, -2);
}

export function resolveRelatedTransactionId(
  transaction: TransactionCustom,
): string | undefined {
  return isOriginal(transaction)
    ? transaction._detail_transaction.transaction_id
    : undefined;
}

export function revertTransferDetails(transaction: TransactionCustom) {
  const detailTransaction = { ...transaction._detail_transaction };
  const origin = { ...detailTransaction };
  const beneficiary = { ...detailTransaction };

  detailTransaction.origin_client_id = beneficiary.beneficiary_client_id;
  detailTransaction.origin_client_id_type =
    beneficiary.beneficiary_client_id_type;
  detailTransaction.origin_account_number =
    beneficiary.beneficiary_account_number;
  detailTransaction.origin_account_type = beneficiary.beneficiary_account_type;
  detailTransaction.origin_client_name = beneficiary.beneficiary_client_name;
  detailTransaction.origin_entity_name =
    detailTransaction.beneficiary_entity_name;

  detailTransaction.beneficiary_client_id = origin.origin_client_id;
  detailTransaction.beneficiary_client_id_type = origin.origin_client_id_type;
  detailTransaction.beneficiary_account_number = origin.origin_account_number;
  detailTransaction.beneficiary_account_type = origin.origin_account_type;
  detailTransaction.beneficiary_client_name = origin.origin_client_name;
  detailTransaction.beneficiary_entity_name = origin.origin_entity_name;

  detailTransaction.related_transaction_id =
    resolveRelatedTransactionId(transaction);

  detailTransaction.transaction_reason = revertTransactionReason(transaction);

  return detailTransaction;
}

export function revertTransactionReason(
  transaction: TransactionCustom,
): string {
  return isOriginal(transaction)
    ? TransactionReason.REVERSAL
    : TransactionReason.ORIGINAL;
}
