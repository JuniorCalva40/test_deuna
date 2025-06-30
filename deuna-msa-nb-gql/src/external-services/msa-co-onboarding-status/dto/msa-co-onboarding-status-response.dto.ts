import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { EstablishmentInputDto } from '../../../utils/establishment.dto';
@ObjectType()
export class StartOnbCnbData {
  @Field(() => Float)
  ruc: number;

  @Field()
  message: string;

  @Field()
  cnbClientId: string;
}

@ObjectType()
export class StartOnbCnb {
  @Field()
  status: string;

  @Field(() => StartOnbCnbData)
  data: StartOnbCnbData;
}

@ObjectType()
export class DataStateCnb {
  @Field(() => StartOnbCnb)
  startOnbCnb: StartOnbCnb;
}

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

@ObjectType()
export class DataConfigurationResponse {
  @Field()
  id: string;

  @Field()
  configKey: string;

  @Field()
  configData: EstablishmentInputDto;

  @Field()
  cnbClientId: string;

  @Field()
  enabled: boolean;
}

@ObjectType()
export class InitOnboardingResponseDto {
  @Field()
  sessionId: string;
}

@ObjectType()
export class StartOnboardingResponseDto {
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
export class SetStepValidateOtpResponseDto {
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
