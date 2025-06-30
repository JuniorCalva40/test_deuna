export class GenerateQrResponseDto {
  status: string;
  message: string;
  data: {
    qrUrl: string;
    qrBase64: string;
    transactionId: string;
  };
}
