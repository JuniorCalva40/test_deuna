import { ObjectType, Field } from '@nestjs/graphql';
import { StandardizedResponse } from '../../../utils/standar-response.dto';
import { EstablishmentOutputDto } from '../../../utils/establishment.dto';

@ObjectType()
export class StartOnboardingResponse extends StandardizedResponse {
  @Field()
  onboardingSessionId: string;

  @Field(() => [EstablishmentOutputDto])
  establishments: EstablishmentOutputDto[];
}

export interface ClientData {
  id: string;
  email?: string;
  identification: string;
  ruc?: string;
  businessActivities?: string;
  businessStartDate?: string;
  businessAddress?: string;
  phoneNumber?: string;
  status?: string;
  updatedBy?: string;
  cnbClientId?: string;
  blockedTmpAt?: string;
}

export interface OnboardingSessionOutput {
  sessionId: string;
}

export interface ISaveElectronicSignatureResponseRedis {
  status: string;
  message: string;
}
