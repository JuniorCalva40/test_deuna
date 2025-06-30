export class CommissionDto {
  transactionId: string;
  channel: string;
  type: string;
  amount: number;
  currency: string;
  merchantId: string;
  beneficiaryAccountNumber: string;
  beneficiaryClientId: string;
  beneficiaryClientIdType: string;
  transactionDate: string;
  posId: string;
  branchId: string;
  status: string;
}

export class SearchCommissionsResponseDto {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  commissions: CommissionDto[];
}
