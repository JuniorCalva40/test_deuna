import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { EstablishmentInputDto } from '../../../utils/establishment.dto';

@ObjectType()
class BaseOnboardingResponse {
  @Field()
  sessionId: string;

  @Field()
  securitySeed: string;

  @Field()
  identityId: string;

  @Field()
  onbType: string;

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
class BaseConfigurationResponse extends BaseOnboardingResponse {
  @Field()
  cnbClientId: string;

  @Field()
  enabled: boolean;
}

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
export class OnboardingStatusResponseDto extends BaseOnboardingResponse {
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
}

@ObjectType()
export class GetStateOnboardingResponseDto extends BaseConfigurationResponse {
  @Field(() => Int)
  id?: number;

  @Field(() => DataStateCnb)
  data: DataStateCnb;
}

@ObjectType()
export class DataConfigurationResponse extends BaseConfigurationResponse {
  @Field()
  id: string;

  @Field()
  configKey: string;

  @Field()
  configData: EstablishmentInputDto;
}

@ObjectType()
export class InitOnboardingResponseDto {
  @Field()
  sessionId: string;
}

export interface ClientData {
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
  status: string;
}

@ObjectType()
export class GetAllOnboardingResponseDto extends BaseOnboardingResponse {
  @Field(() => Int)
  id: number;

  @Field(() => GraphQLJSONObject)
  data: Record<string, any>;

  @Field({ nullable: true })
  asyncData?: string;
}
