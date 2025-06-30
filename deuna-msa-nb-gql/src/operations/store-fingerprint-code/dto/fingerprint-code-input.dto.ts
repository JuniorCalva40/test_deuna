import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { TrackingBaseDto } from '../../../common/constants/common';

@InputType()
export class FingeprintCodeInputDto extends TrackingBaseDto {
  @IsString()
  @IsNotEmpty()
  @Field()
  onboardingSessionId: string;

  @Field()
  @IsNotEmpty()
  nationalID: string;

  @Field()
  @IsNotEmpty()
  fingerprintData: string;

  identificationNumber: string;
}
