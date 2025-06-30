import { TrackingBaseDto } from '../../../common/constants/common';

export class GenerateCommissionInvoiceInput extends TrackingBaseDto {
  merchantId: string;
  identification: string;
  comercialName: string;
}
