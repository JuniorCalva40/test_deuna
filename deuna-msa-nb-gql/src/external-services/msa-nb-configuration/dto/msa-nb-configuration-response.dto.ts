import { ObjectType, Field, Int, InputType } from '@nestjs/graphql';
import { DataStateCnb } from '../../msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { EstablishmentOutputDto } from '../../../utils/establishment.dto';

@ObjectType()
export class ConfirmDataResponseDto {
  @Field(() => [String])
  successSteps: string[];

  @Field(() => [String])
  requiredSteps: string[];

  @Field(() => [String])
  optionalSteps: string[];

  @Field(() => [String])
  failureSteps: string[];

  @Field(() => [String])
  successIdentityValidationSteps: string[];

  @Field(() => [String])
  standbyIdentityValidationSteps: string[];

  @Field(() => [String])
  processingFailure: string[];

  @Field()
  status: string;

  @Field()
  onbType: string;
}

@ObjectType()
export class GetStateOnboardingResponseDto {
  @Field(() => Int)
  id?: number;

  @Field()
  sessionId: string;

  @Field()
  securitySeed: string;

  @Field()
  identityId: string;

  @Field()
  onbType: string;

  @Field(() => DataStateCnb)
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
