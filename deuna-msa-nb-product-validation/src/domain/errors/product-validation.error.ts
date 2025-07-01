export class ProductValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'ProductValidationError';
  }
}

export class InsufficientBalanceError extends ProductValidationError {
  constructor(
    accountId: string,
    availableBalance: number,
    requestedAmount: number,
  ) {
    super(
      `Insufficient balance for account ${accountId}. Available: ${availableBalance}, Requested: ${requestedAmount}`,
      'INSUFFICIENT_BALANCE',
      404,
    );
    this.name = 'InsufficientBalanceError';
  }
}

export class AccountInactiveError extends ProductValidationError {
  constructor(accountId: string, status: string) {
    super(
      `Account ${accountId} is not active. Current status: ${status}`,
      'ACCOUNT_INACTIVE',
      404,
    );
    this.name = 'AccountInactiveError';
  }
}

export class AccountNotFoundError extends ProductValidationError {
  constructor(accountId: string) {
    super(`Account ${accountId} not found`, 'ACCOUNT_NOT_FOUND', 404);
    this.name = 'AccountNotFoundError';
  }
}
