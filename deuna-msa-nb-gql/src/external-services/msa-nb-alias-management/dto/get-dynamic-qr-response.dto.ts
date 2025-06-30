export class GetDynamicQrResponseDto {
  status: string;
  message: string;
  data: {
    cnbAccount: string;
    amount: number;
    transactionId: string;
    status: string;
    secondId: string;
    peopleAccount: string;
    peopleName: string;
    transactionNumber?: string;
    transactionDate?: string;
  };
}
