import { ChangeStateActions } from './deposit-account.constants';

export interface ApplyInterest {
  accountId: string;
  notes?: string;
  interestApplicationDate: Date;
}

export interface ChangeStatus {
  accountId: string;
  action: ChangeStateActions;
  notes?: string;
}

export interface ChangeInterestRate {
  accountId: string;
  notes?: string;
  valueDate: Date;
  interestRate: number;
}

export class DepositAccount {
  encodedKey: string;
  creationDate: Date;
  lastModifiedDate: Date;
  id: string;
  name: string;
  accountHolderType: string;
  accountHolderKey: string;
  accountState: string;
  productTypeKey: string;
  accountType: string;
  approvedDate: Date;
  activationDate: Date;
  lastInterestCalculationDate: Date;
  lastAccountAppraisalDate: Date;
  currencyCode: string;
  internalControls: InternalControls;
  overdraftSettings: OverdraftSettings;
  interestSettings: InterestSettings;
  overdraftInterestSettings: InternalControls;
  balances: Balances;
  accruedAmounts: AccruedAmounts;
}


export interface Balances {
  totalBalance: number;
  overdraftAmount: number;
  technicalOverdraftAmount: number;
  lockedBalance: number;
  availableBalance: number;
  holdBalance: number;
  overdraftInterestDue: number;
  technicalOverdraftInterestDue: number;
  feesDue: number;
  blockedBalance: number;
  forwardAvailableBalance: number;
}

export interface AccruedAmounts {
  interestAccrued: number;
  overdraftInterestAccrued: number;
  technicalOverdraftInterestAccrued: number;
  negativeInterestAccrued: number;
}

export interface InterestSettings {
  interestRateSettings: InterestRateSettings;
  interestPaymentSettings: InterestPaymentSettings;
}

export interface InterestPaymentSettings {
  interestPaymentPoint: string;
  interestPaymentDates: InterestPaymentDate[];
}

export interface InterestPaymentDate {
  month: number;
  day: number;
}

export interface InterestRateSettings {
  encodedKey: string;
  interestRate: number;
  interestChargeFrequency: string;
  interestChargeFrequencyCount: number;
  interestRateTiers: any[];
  interestRateTerms: string;
  interestRateSource: string;
}

export interface InternalControls {}

export interface OverdraftSettings {
  allowOverdraft: boolean;
  overdraftLimit: number;
}
