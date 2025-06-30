export class CreateDynamicQrResponseDto {
  status: string;
  message: string;
  data: {
    transactionId: string;
    qrId: string;
    qrUrl: string;
    qrBase64: string;
  };
}
