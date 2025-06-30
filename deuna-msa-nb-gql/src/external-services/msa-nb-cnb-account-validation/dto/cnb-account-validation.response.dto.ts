export class CnbAccountValidationResponseDto {
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