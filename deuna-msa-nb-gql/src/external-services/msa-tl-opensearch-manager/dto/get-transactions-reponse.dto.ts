import { TransactionChannelId } from '../../../common/constants/common';

export class TransactionDto {
  id: string;
  amount: number;
  currency: string;
  date: string;
  source: string;
  transactionChannelId: TransactionChannelId;
  description: string;
}

export class GetCnbTransactionsResponseDto {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  transactions: TransactionDto[];
}
