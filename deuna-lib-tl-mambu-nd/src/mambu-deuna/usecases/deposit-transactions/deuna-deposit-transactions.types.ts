import {
  Transaction,
  TransactionTransfer,
} from '../../../mambu-core/usecases/deposit-transactions/deposit-transaction.types';

export class TransactionCustom extends Transaction {
  _detail_merchants?: DetailMerchants;
  _detail_transaction: DetailTransaction;
}

export class TransactionTransferCustom extends TransactionTransfer {
  _detail_merchants?: DetailMerchants;
  _detail_transaction: DetailTransaction;
}

export interface DetailMerchants {
  merchant_id: string;
  branch_id: string;
  pos_id: string;
  internal_transaction_reference: string;
}

export interface DetailTransaction {
  transaction_date: Date;
  transaction_id: string;
  related_transaction_id?: string;
  transaction_number?: string;
  transaction_pts_id: string;
  transaction_reason: string;
  beneficiary_client_id: string;
  beneficiary_client_id_type: string;
  beneficiary_account_number: string;
  beneficiary_account_type: string;
  beneficiary_client_name: string;
  beneficiary_entity_name: string;
  origin_client_id: string;
  origin_client_id_type: string;
  origin_account_number: string;
  origin_account_type: string;
  origin_client_name: string;
  origin_entity_name: string;
  version: string;
  iso_txid?: string;
  user_execution: string;
  user_authorization: string;
}
