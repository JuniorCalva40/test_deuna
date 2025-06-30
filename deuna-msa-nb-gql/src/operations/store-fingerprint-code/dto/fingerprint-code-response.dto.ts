import { ObjectType, Field } from '@nestjs/graphql';
import { OnboardingStatusResponseDto } from '../../../external-services/msa-co-onboarding-status/dto/msa-co-onboarding-status-response.dto';
import { StandardizedResponse } from '../../../utils/standar-response.dto';

@ObjectType()
export class FingerprintDataResponseDto extends OnboardingStatusResponseDto {}

@ObjectType()
export class FingeprintCodeResponseDto extends StandardizedResponse {
  @Field()
  message: string;
}

export interface ISaveElectronicSignatureResponseRedis {
  status: string;
  message: string;
}
