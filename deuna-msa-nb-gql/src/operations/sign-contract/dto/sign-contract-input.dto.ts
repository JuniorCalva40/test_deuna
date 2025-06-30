import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty } from 'class-validator';
import { TrackingBaseDto } from '../../../common/constants/common';
@InputType()
export class SignContractInput extends TrackingBaseDto {
  @Field({ description: 'unique identified of the session' })
  @IsString()
  @IsNotEmpty()
  onboardingSessionId: string;

  merchantId?: string;

  nodeId?: string;

  latitude?: string;

  longitude?: string;

  clientCnbDocumentId: string;

  clientAccountId?: string;
}
