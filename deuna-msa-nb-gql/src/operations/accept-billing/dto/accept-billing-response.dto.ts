import { ObjectType, Field, Int } from '@nestjs/graphql';
import {
  DataStateCnb,
} from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class AcceptBillingResponse extends StandardizedResponse {
  @Field()
  sessionId: string;
}

@ObjectType()
export class GetStateOnboardingResponse {
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
  publicKey: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

