import { TransactionType } from '../../../mambu-core/config/fields/transaction-types';
import { TransactionReason } from '../../usecases/deposit-transactions/deuna-deposit-transactions.constants';
import {
  ACCOUNTS,
  AccountType,
  DeunaConstants,
  FinantialEntity,
  TransactioMember,
  entities,
} from '../constants';

export enum TransactionalChannels {
  INACTIVE_ACCOUNTS = 'INTCUENTAINACTIVA',
  INACTIVE_ACCOUNTS_WITHOUT_BALANCE = 'INTCUENTAINACTIVASINSALDO',
  REACTIVE_ACCOUNTS = 'INTCUENTAACTIVACION',
  REACTIVE_ACCOUNTS_WITHOUT_BALANCE = 'INTCUENTAACTIVACIONSINSALDO',
  CHARGE_TO_EXPENSE = 'INTCARGOGASTO',
  CHARGE_TO_EXPENSE_REVERSE = 'INTCARGOGASTORV',
  CLOSE_ACCOUNT = 'INTCIERRECUENTASALDO',
  CLOSE_ACCOUNT_WITHOUT_BALANCE = 'INTCIERRECUENTASINSALDO',
  PICHINCHA_RETURNS = 'INTDEVOLUCIONSALDOCTAPORBP',
}

export const TRANSACTION_REVERSAL_CHANNEL = {
  [TransactionalChannels.INACTIVE_ACCOUNTS]:
    TransactionalChannels.REACTIVE_ACCOUNTS,
  [TransactionalChannels.INACTIVE_ACCOUNTS_WITHOUT_BALANCE]:
    TransactionalChannels.REACTIVE_ACCOUNTS_WITHOUT_BALANCE,
  [TransactionalChannels.REACTIVE_ACCOUNTS]:
    TransactionalChannels.INACTIVE_ACCOUNTS,
  [TransactionalChannels.REACTIVE_ACCOUNTS_WITHOUT_BALANCE]:
    TransactionalChannels.INACTIVE_ACCOUNTS_WITHOUT_BALANCE,
};

export const TRANSACTION_CHANNEL_CONFIG = {
  [TransactionalChannels.CHARGE_TO_EXPENSE_REVERSE]: {
    config: {
      origin: TransactioMember.CLIENT,
      beneficiary: TransactioMember.ACCOUNTING,
    },
    transaction: {
      type: TransactionType.WITHDRAWAL,
      transactionDetails: {
        transactionChannelId: TransactionalChannels.CHARGE_TO_EXPENSE_REVERSE,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.REVERSAL,
        version: DeunaConstants.version,
        beneficiary_client_name: DeunaConstants.account.name,
        beneficiary_entity_name: entities[FinantialEntity.MAMBU].name,
        beneficiary_account_number: ACCOUNTS.ACCOUNTING.CHARGE_TO_EXPENSE,
        beneficiary_account_type: AccountType.ACCOUNTING,
        beneficiary_client_id: entities[FinantialEntity.MAMBU].dni,
        beneficiary_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.INACTIVE_ACCOUNTS_WITHOUT_BALANCE]: {
    config: {
      origin: TransactioMember.CLIENT,
      beneficiary: TransactioMember.ACCOUNTING,
      affectedAccount: ACCOUNTS.ACCOUNTING.INACTIVE_ACCOUNTS_WITHOUT_BALANCE,
    },
    transaction: {
      type: TransactionType.DEPOSIT,
      transactionDetails: {
        transactionChannelId:
          TransactionalChannels.INACTIVE_ACCOUNTS_WITHOUT_BALANCE,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        beneficiary_client_name: DeunaConstants.account.name,
        beneficiary_entity_name: entities[FinantialEntity.MAMBU].name,
        beneficiary_account_number:
          ACCOUNTS.ACCOUNTING.INACTIVE_ACCOUNTS_WITHOUT_BALANCE,
        beneficiary_account_type: AccountType.ACCOUNTING,
        beneficiary_client_id: entities[FinantialEntity.MAMBU].dni,
        beneficiary_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.INACTIVE_ACCOUNTS]: {
    config: {
      origin: TransactioMember.CLIENT,
      beneficiary: TransactioMember.ACCOUNTING,
      affectedAccount: ACCOUNTS.ACCOUNTING.INACTIVE_ACCOUNTS,
    },
    transaction: {
      type: TransactionType.DEPOSIT,
      transactionDetails: {
        transactionChannelId: TransactionalChannels.INACTIVE_ACCOUNTS,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        beneficiary_client_name: DeunaConstants.account.name,
        beneficiary_entity_name: entities[FinantialEntity.MAMBU].name,
        beneficiary_account_number: ACCOUNTS.ACCOUNTING.INACTIVE_ACCOUNTS,
        beneficiary_account_type: AccountType.ACCOUNTING,
        beneficiary_client_id: entities[FinantialEntity.MAMBU].dni,
        beneficiary_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.REACTIVE_ACCOUNTS_WITHOUT_BALANCE]: {
    config: {
      origin: TransactioMember.ACCOUNTING,
      beneficiary: TransactioMember.CLIENT,
      affectedAccount: ACCOUNTS.ACCOUNTING.REACTIVE_ACCOUNTS_WITHOUT_BALANCE,
    },
    transaction: {
      type: TransactionType.WITHDRAWAL,
      transactionDetails: {
        transactionChannelId:
          TransactionalChannels.REACTIVE_ACCOUNTS_WITHOUT_BALANCE,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        origin_client_name: DeunaConstants.account.name,
        origin_entity_name: entities[FinantialEntity.MAMBU].name,
        origin_account_number:
          ACCOUNTS.ACCOUNTING.REACTIVE_ACCOUNTS_WITHOUT_BALANCE,
        origin_account_type: AccountType.ACCOUNTING,
        origin_client_id: entities[FinantialEntity.MAMBU].dni,
        origin_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.REACTIVE_ACCOUNTS]: {
    config: {
      origin: TransactioMember.ACCOUNTING,
      beneficiary: TransactioMember.CLIENT,
      affectedAccount: ACCOUNTS.ACCOUNTING.REACTIVE_ACCOUNTS,
    },
    transaction: {
      type: TransactionType.WITHDRAWAL,
      transactionDetails: {
        transactionChannelId: TransactionalChannels.REACTIVE_ACCOUNTS,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        origin_client_name: DeunaConstants.account.name,
        origin_entity_name: entities[FinantialEntity.MAMBU].name,
        origin_account_number: ACCOUNTS.ACCOUNTING.REACTIVE_ACCOUNTS,
        origin_account_type: AccountType.ACCOUNTING,
        origin_client_id: entities[FinantialEntity.MAMBU].dni,
        origin_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.CLOSE_ACCOUNT]: {
    config: {
      origin: TransactioMember.CLIENT,
      beneficiary: TransactioMember.ACCOUNTING,
    },
    transaction: {
      type: TransactionType.WITHDRAWAL,
      transactionDetails: {
        transactionChannelId: TransactionalChannels.CLOSE_ACCOUNT,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        beneficiary_client_name: DeunaConstants.account.name,
        beneficiary_entity_name: entities[FinantialEntity.MAMBU].name,
        beneficiary_account_number: ACCOUNTS.ACCOUNTING.CLOSE_ACCOUNT,
        beneficiary_account_type: AccountType.ACCOUNTING,
        beneficiary_client_id: entities[FinantialEntity.MAMBU].dni,
        beneficiary_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.CLOSE_ACCOUNT_WITHOUT_BALANCE]: {
    config: {
      origin: TransactioMember.CLIENT,
      beneficiary: TransactioMember.ACCOUNTING,
      affectedAccount: ACCOUNTS.ACCOUNTING.CLOSE_ACCOUNT,
    },
    transaction: {
      type: TransactionType.DEPOSIT,
      transactionDetails: {
        transactionChannelId:
          TransactionalChannels.CLOSE_ACCOUNT_WITHOUT_BALANCE,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        beneficiary_client_name: DeunaConstants.account.name,
        beneficiary_entity_name: entities[FinantialEntity.MAMBU].name,
        beneficiary_account_number:
          ACCOUNTS.ACCOUNTING.CLOSE_ACCOUNT_WITHOUT_BALANCE,
        beneficiary_account_type: AccountType.ACCOUNTING,
        beneficiary_client_id: entities[FinantialEntity.MAMBU].dni,
        beneficiary_client_id_type: entities[FinantialEntity.MAMBU].dniType,
      },
    },
  },
  [TransactionalChannels.PICHINCHA_RETURNS]: {
    config: {
      origin: TransactioMember.PICHINCHA_RETURNS,
      beneficiary: TransactioMember.PICHINCHA_RETURNS,
      affectedAccount: ACCOUNTS.ACCOUNTING.PICHINCHA_RETURNS,
    },
    transaction: {
      type: TransactionType.DEPOSIT,
      transactionDetails: {
        transactionChannelId: TransactionalChannels.PICHINCHA_RETURNS,
      },
      _detail_transaction: {
        transaction_reason: TransactionReason.ORIGINAL,
        version: DeunaConstants.version,
        beneficiary_entity_name: entities[FinantialEntity.MAMBU].name,
      },
    },
  },
};
