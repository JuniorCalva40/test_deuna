import { DepositAccount, Transaction } from '../../src';

export const despositAccountMock: DepositAccount = {
  encodedKey: '8aa6ebc788beff790188c004a1ce010e',
  creationDate: new Date(),
  lastModifiedDate: new Date(),
  id: '7700002628',
  name: 'Cuenta de ahorros Deuna',
  accountHolderType: 'CLIENT',
  accountHolderKey: '8aa6ebc788beff790188c0049ec50104',
  accountState: 'ACTIVE',
  productTypeKey: '8a44d17986c67d210186c6d451360583',
  accountType: 'CURRENT_ACCOUNT',
  approvedDate: new Date(),
  activationDate: new Date(),
  lastInterestCalculationDate: new Date(),
  lastAccountAppraisalDate: new Date(),
  currencyCode: 'USD',
  internalControls: {},
  overdraftSettings: {
    allowOverdraft: false,
    overdraftLimit: 0,
  },
  interestSettings: {
    interestRateSettings: {
      encodedKey: '8aa6ebc788beff790188c004a1ce010f',
      interestRate: 0,
      interestChargeFrequency: 'ANNUALIZED',
      interestChargeFrequencyCount: 1,
      interestRateTiers: [
        {
          encodedKey: '8aa6ebc788beff790188c004a1ce0110',
          endingBalance: 2000.0,
          interestRate: 0,
        },
        {
          encodedKey: '8aa6ebc788beff790188c004a1ce0111',
          endingBalance: 5000.0,
          interestRate: 0.5,
        },
        {
          encodedKey: '8aa6ebc788beff790188c004a1ce0112',
          endingBalance: 10000.0,
          interestRate: 0.75,
        },
        {
          encodedKey: '8aa6ebc788beff790188c004a1d80113',
          endingBalance: 100000.0,
          interestRate: 1.0,
        },
      ],
      interestRateTerms: 'TIERED',
      interestRateSource: 'FIXED_INTEREST_RATE',
    },
    interestPaymentSettings: {
      interestPaymentPoint: 'ON_FIXED_DATES',
      interestPaymentDates: [
        {
          month: 1,
          day: 31,
        },
        {
          month: 2,
          day: 28,
        },
        {
          month: 3,
          day: 31,
        },
        {
          month: 4,
          day: 28,
        },
        {
          month: 5,
          day: 31,
        },
        {
          month: 6,
          day: 30,
        },
        {
          month: 7,
          day: 31,
        },
        {
          month: 8,
          day: 31,
        },
        {
          month: 9,
          day: 29,
        },
        {
          month: 10,
          day: 31,
        },
        {
          month: 11,
          day: 30,
        },
        {
          month: 12,
          day: 29,
        },
      ],
    },
  },
  overdraftInterestSettings: {},
  balances: {
    totalBalance: 40.0,
    overdraftAmount: 0,
    technicalOverdraftAmount: 0,
    lockedBalance: 0,
    availableBalance: 40.0,
    holdBalance: 0,
    overdraftInterestDue: 0,
    technicalOverdraftInterestDue: 0,
    feesDue: 0,
    blockedBalance: 0,
    forwardAvailableBalance: 0,
  },
  accruedAmounts: {
    interestAccrued: 0,
    overdraftInterestAccrued: 0,
    technicalOverdraftInterestAccrued: 0,
    negativeInterestAccrued: 0,
  },
};

export const mambuError = {
  data: {
    errors: [
      {
        errorCode: 1,
        errorSource: 'INVALID_BASIC_AUTHORIZATION',
        errorReason: 'INVALID_BASIC_AUTHORIZATION',
      },
    ],
  },
};

export const transactionMock: Transaction = {
  encodedKey: '8aa6ebc788beff790188c004a1d80114',
  id: '7700002629',
  paymentOrderId: '0.0',
  creationDate: new Date(),
  valueDate: new Date(),
  notes: 'Deposito',
  parentAccountKey: '8aa6ebc788beff790188c004a1ce010e',
  type: 'DEPOSIT',
  amount: 40,
  currencyCode: 'USD',
  affectedAmounts: {
    fundsAmount: 40,
    interestAmount: 0,
    feesAmount: 0,
    overdraftAmount: 0,
    overdraftFeesAmount: 0,
    overdraftInterestAmount: 0,
    technicalOverdraftAmount: 0,
    technicalOverdraftInterestAmount: 0,
    fractionAmount: 0,
  },
  taxes: {},
  accountBalances: {
    totalBalance: 80,
  },
  userKey: '8a44b98384e7313c0184e80761b90e59',
  branchKey: '8a44b98384e7313c0184e80761b90e59',
  centreKey: '8a44b98384e7313c0184e80fd5040efc',
  terms: {
    interestSettings: {},
    overdraftInterestSettings: {},
    overdraftSettings: {},
  },
  transactionDetails: {
    transactionChannelKey: '8aa6ebc788beff790188c004a1ce0115',
    transactionChannelId: 'ONLINE_BANKING',
  },
  transferDetails: {},
  fees: [],
};
