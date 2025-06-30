import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { StandardizedResponse } from '../../../utils/standar-response.dto';
import { PreApprovedState } from 'src/common/constants/common';

@InputType()
export class ResendOtpInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  onboardingSessionId: string;
}

@ObjectType()
export class ResendOtpResponse extends StandardizedResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  expirationDate?: string;

  @Field({ nullable: true })
  remainingResendAttempts?: number;
}

export class BodySendOtpDto {
  businessDeviceId: string;
  deviceName: string;
  commerceName: string;
  email: string;
  requestId: string;
}

export interface ClientInfoResp {
  cnbClientId: string;
  email: string;
  companyName: string;
  ruc: string;
  businessAddress: string;
  legalRepresentative: string;
  establishment: {
    fullAdress: string;
    numberEstablishment: string;
  };
  identityId: string;
  username: string;
  commerceId: string;
  trackingId: string;
  status: PreApprovedState;
}
