import { TrackingBaseDto } from '../../../common/constants/common';

export class ValidateCnbStateInput extends TrackingBaseDto {
  identification: string;
  comercialName: string;
  status: string;
  fullName?: string;
}
