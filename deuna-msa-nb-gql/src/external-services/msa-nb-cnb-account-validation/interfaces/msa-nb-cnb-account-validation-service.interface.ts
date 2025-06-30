export interface CnbAccountValidationRequest {
  accountNumber: string;
}

export interface CnbAccountValidationResponse {
  status: string;
  data: {
    accountNumber: string;
    accountStatus: string;
    balance: number;
    currency: string;
    isActive: boolean;
  };
  message?: string;
}

export interface CnbAccountValidationError {
  status: string;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface IMsaNbCnbAccountValidationService {
  validateAccount(
    request: CnbAccountValidationRequest,
  ): Promise<CnbAccountValidationResponse>;
} 