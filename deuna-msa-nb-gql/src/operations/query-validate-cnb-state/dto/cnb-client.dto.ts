import { PreApprovedState } from '../../../common/constants/common';

export class CnbClient {
  id: string;

  email?: string;

  identification: string;

  ruc?: string;

  businessActivities?: string;

  businessStartDate?: string;

  businessAddress?: string;

  phoneNumber?: string;

  status?: PreApprovedState;

  updatedBy?: string;

  cnbClientId?: string;

  blockedTmpAt?: string;

  remainingAttemptsOnb?: number;
}
