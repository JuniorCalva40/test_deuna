export const MAMBU_DEUNA_CLIENT = 'MAMBU_DEUNA_CLIENT';

export enum DepositAccountSubState {
  ACTIVE = 'ACTIVO',
  INACTIVE = 'INACTIVO',
}

export enum ClientType {
  CEDULA = 'CEDULA',
}

export enum AccountType {
  ACCOUNTING = 'CONTABLE',
}

export enum TransactioMember {
  CLIENT = 'CLIENT',
  ACCOUNTING = 'ACCOUNTING',
  PICHINCHA_RETURNS = 'PICHINCHA_RETURNS',
}

export enum FinantialEntity {
  MAMBU = 'MAMBU',
  PICHINCHA = 'PICHINCHA',
}

export const entities = {
  [FinantialEntity.MAMBU]: {
    name: 'DeUna',
    dni: '190270016',
    dniType: 'RUC',
  },
  [FinantialEntity.PICHINCHA]: {
    name: 'Banco Pichincha',
  },
};

export const DeunaConstants = {
  account: {
    name: 'Deuna Operación Interna',
  },
  version: 'OPERATIONS_CONTINGENCY',
};

export const ACCOUNTS = {
  ['ACCOUNTING']: {
    CHARGE_TO_EXPENSE: '469006100000000000',
    INACTIVE_ACCOUNTS: '210135001800300000',
    INACTIVE_ACCOUNTS_WITHOUT_BALANCE: '210135001800300000',
    REACTIVE_ACCOUNTS: '210135001800300000',
    REACTIVE_ACCOUNTS_WITHOUT_BALANCE: '210135001800300000',
    CLOSE_ACCOUNT_BY_COMPLIANCE_UNIT: '210135001800700000',
    CLOSE_ACCOUNT: '210135001800600000',
    CLOSE_ACCOUNT_WITHOUT_BALANCE: '210135001800600000',
    PICHINCHA_RETURNS: '259090570000000000',
  },
};
