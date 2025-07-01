import { ValidationResult } from '../entities/validation-result.entity';

export interface ProductValidationRequest {
  accountNumber: string;
  amount?: number;
  validationType: ValidationType;
}

export enum ValidationType {
  BALANCE_AND_STATUS = 'BALANCE_AND_STATUS',
  STATUS_ONLY = 'STATUS_ONLY',
}

export interface ProductValidationPort {
  validateProduct(request: ProductValidationRequest): Promise<ValidationResult>;
}
