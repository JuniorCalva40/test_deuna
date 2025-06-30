import {
  TransactionChannelId,
  TransactionChannelType,
} from 'src/common/constants/common';

export class GetCnbTransactionsInputdto {
  fromDate: string;
  toDate: string;
  transacitonType?: TransactionChannelType;
  page: number;
  size: number;
  transactionChannelId?: TransactionChannelId[];
}
