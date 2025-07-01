export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  accountId?: string;
  accountNumber?: string;
  availableBalance?: number;
  requestedAmount?: number;
  accountStatus?: string;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export enum ValidationErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
}
