import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import {
  DataStateCnb,
  OnboardingStatusResponseDto,
} from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { StandardizedResponse } from '../../../utils/standar-response.dto';
import { EstablishmentOutputDto } from '../../../utils/establishment.dto';
@ObjectType()
export class UpdateDataOnboardingResponseDto extends OnboardingStatusResponseDto {}

@ObjectType()
export class ConfirmDataResponseDto extends StandardizedResponse {
  @Field()
  onboardingSessionId: string;
}

@ObjectType()
export class GetStateOnboardingResponseDto {
  @Field(() => Int)
  id?: number;

  @Field()
  onboardingSessionId: string;

  @Field()
  securitySeed: string;

  @Field()
  identityId: string;

  @Field()
  onbType: string;

  @Field()
  data: DataStateCnb;

  @Field()
  status: string;

  @Field()
  publicKey: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@InputType()
export class DataConfigurationResponse {
  @Field()
  id: string;

  @Field()
  configKey: string;

  @Field()
  configData: EstablishmentOutputDto;

  @Field()
  cnbClientId: string;

  @Field()
  enabled: boolean;
}

export class ISaveElectronicSignatureResponseRedis {
  status: string;
  message: string;
}
