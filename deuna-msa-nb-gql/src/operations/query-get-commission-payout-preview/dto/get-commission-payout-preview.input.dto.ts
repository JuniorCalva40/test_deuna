import { TrackingBaseDto } from '../../../common/constants/common';

export class GetCommissionPayoutPreviewInput extends TrackingBaseDto {
  identification: string;
  merchantId: string;
}
