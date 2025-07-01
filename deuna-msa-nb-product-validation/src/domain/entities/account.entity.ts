export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  currency: string;
  clientId: string;
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}
