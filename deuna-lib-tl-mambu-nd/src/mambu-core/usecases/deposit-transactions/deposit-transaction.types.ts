export class TransactionTransfer {
  amount: number;
  transactionDetails: TransactionDetails;
  notes?: string;
  paymentOrderId?: string;
  externalId?: string;
  type?: string;
  parentAccountKey?: string;
}

export class Transaction {
  encodedKey: string;
  id: string;
  paymentOrderId: string;
  externalId?: string;
  creationDate: Date;
  valueDate: Date;
  notes?: string;
  parentAccountKey: string;
  type: string;
  amount: number;
  currencyCode: string;
  affectedAmounts: AffectedAmounts;
  taxes: Taxes;
  accountBalances: AccountBalances;
  userKey: string;
  branchKey: string;
  centreKey: string;
  terms: Terms;
  transactionDetails: TransactionDetails;
  transferDetails: Taxes;
  fees: any[];
}

export interface AccountBalances {
  totalBalance: number;
}

export interface AffectedAmounts {
  fundsAmount: number;
  interestAmount: number;
  feesAmount: number;
  overdraftAmount: number;
  overdraftFeesAmount: number;
  overdraftInterestAmount: number;
  technicalOverdraftAmount: number;
  technicalOverdraftInterestAmount: number;
  fractionAmount: number;
}

export interface Taxes {}

export interface Terms {
  interestSettings: Taxes;
  overdraftInterestSettings: Taxes;
  overdraftSettings: Taxes;
}

export interface TransactionDetails {
  transactionChannelKey?: string;
  transactionChannelId: string;
}

export enum TransactionTypes {
  WITHDRAWAL = 'WITHDRAWAL',
  DEPOSIT = 'DEPOSIT',
  INTEREST_APPLIED = 'INTEREST_APPLIED',
}
